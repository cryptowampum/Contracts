// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title DorkRewards
 * @notice Distributes DORK tokens as rewards for Unicorn Games wins
 * @dev Uses signature verification to ensure only valid wins are rewarded
 */
contract DorkRewards is Ownable, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public immutable dorkToken;
    address public signer;

    uint256 public defaultRewardAmount = 1 ether; // 1 DORK default
    uint256 public cooldownPeriod = 1 hours;
    uint256 public dailyClaimLimit = 10;

    // Per-game reward amounts (0 means use default)
    mapping(string => uint256) public gameRewardAmounts;

    // Tracking claims
    mapping(address => mapping(string => uint256)) public lastClaimTime;
    mapping(address => mapping(uint256 => uint256)) public dailyClaims;
    mapping(bytes32 => bool) public usedNonces;

    event RewardClaimed(address indexed player, uint256 amount, string gameId, uint256 score);
    event SignerUpdated(address indexed newSigner);
    event GameRewardUpdated(string gameId, uint256 amount);
    event DefaultRewardUpdated(uint256 newAmount);
    event CooldownUpdated(uint256 newCooldown);
    event DailyLimitUpdated(uint256 newLimit);

    error InvalidSignature();
    error NonceAlreadyUsed();
    error CooldownNotElapsed(uint256 remainingTime);
    error DailyLimitExceeded();
    error InsufficientBalance();

    constructor(address _dorkToken, address _signer) Ownable(msg.sender) {
        dorkToken = IERC20(_dorkToken);
        signer = _signer;

        // Set initial game rewards
        gameRewardAmounts["2048"] = 10 ether;       // 10 DORK
        gameRewardAmounts["tetris"] = 8 ether;      // 8 DORK
        gameRewardAmounts["higherlower"] = 5 ether; // 5 DORK
        // snake, memory, blackjack use default (1 DORK)
    }

    /**
     * @notice Get reward amount for a specific game
     */
    function getRewardAmount(string calldata gameId) public view returns (uint256) {
        uint256 gameReward = gameRewardAmounts[gameId];
        return gameReward > 0 ? gameReward : defaultRewardAmount;
    }

    /**
     * @notice Claim reward for a verified game win
     * @param gameId Identifier for the game
     * @param score The winning score
     * @param nonce Unique nonce to prevent replay attacks
     * @param signature Backend signature authorizing the claim
     */
    function claimReward(
        string calldata gameId,
        uint256 score,
        bytes32 nonce,
        bytes calldata signature
    ) external whenNotPaused {
        // Verify nonce hasn't been used
        if (usedNonces[nonce]) revert NonceAlreadyUsed();
        usedNonces[nonce] = true;

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, gameId, score, nonce));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedHash.recover(signature);
        if (recoveredSigner != signer) revert InvalidSignature();

        // Check cooldown per game
        uint256 lastClaim = lastClaimTime[msg.sender][gameId];
        if (block.timestamp < lastClaim + cooldownPeriod) {
            revert CooldownNotElapsed(lastClaim + cooldownPeriod - block.timestamp);
        }

        // Check daily limit
        uint256 today = block.timestamp / 1 days;
        if (dailyClaims[msg.sender][today] >= dailyClaimLimit) {
            revert DailyLimitExceeded();
        }

        // Get reward amount for this game
        uint256 reward = getRewardAmount(gameId);

        // Check balance
        if (dorkToken.balanceOf(address(this)) < reward) {
            revert InsufficientBalance();
        }

        // Update tracking
        lastClaimTime[msg.sender][gameId] = block.timestamp;
        dailyClaims[msg.sender][today]++;

        // Transfer reward
        dorkToken.transfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward, gameId, score);
    }

    // Admin functions
    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
        emit SignerUpdated(_signer);
    }

    function setGameReward(string calldata gameId, uint256 amount) external onlyOwner {
        gameRewardAmounts[gameId] = amount;
        emit GameRewardUpdated(gameId, amount);
    }

    function setDefaultRewardAmount(uint256 _amount) external onlyOwner {
        defaultRewardAmount = _amount;
        emit DefaultRewardUpdated(_amount);
    }

    function setCooldownPeriod(uint256 _cooldown) external onlyOwner {
        cooldownPeriod = _cooldown;
        emit CooldownUpdated(_cooldown);
    }

    function setDailyClaimLimit(uint256 _limit) external onlyOwner {
        dailyClaimLimit = _limit;
        emit DailyLimitUpdated(_limit);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    // View functions
    function canClaim(address player, string calldata gameId) external view returns (bool canClaimNow, string memory reason) {
        if (paused()) {
            return (false, "Contract is paused");
        }
        uint256 lastClaim = lastClaimTime[player][gameId];
        if (block.timestamp < lastClaim + cooldownPeriod) {
            return (false, "Cooldown not elapsed");
        }
        uint256 today = block.timestamp / 1 days;
        if (dailyClaims[player][today] >= dailyClaimLimit) {
            return (false, "Daily limit reached");
        }
        uint256 reward = getRewardAmount(gameId);
        if (dorkToken.balanceOf(address(this)) < reward) {
            return (false, "Insufficient reward pool");
        }
        return (true, "");
    }

    function getRemainingCooldown(address player, string calldata gameId) external view returns (uint256) {
        uint256 nextClaimTime = lastClaimTime[player][gameId] + cooldownPeriod;
        if (block.timestamp >= nextClaimTime) return 0;
        return nextClaimTime - block.timestamp;
    }

    function getDailyClaimsRemaining(address player) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        uint256 claimed = dailyClaims[player][today];
        if (claimed >= dailyClaimLimit) return 0;
        return dailyClaimLimit - claimed;
    }

    function getRewardPoolBalance() external view returns (uint256) {
        return dorkToken.balanceOf(address(this));
    }
}
