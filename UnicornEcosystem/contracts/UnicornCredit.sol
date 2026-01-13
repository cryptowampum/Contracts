// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title UnicornCredit - Utility Token for Unicorn Ecosystem
/// @author @cryptowampum and Claude AI
/// @notice ERC20 utility token used to claim Unicorn Subdomains and Community NFTs
/// @dev Burnable token with paid public minting and free team minting for airdrops
contract UnicornCredit is ERC20, ERC20Burnable, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ========== CONSTANTS ==========

    /// @notice Initial mint price (0.01 ETH)
    uint256 public constant INITIAL_MINT_PRICE = 0.01 ether;

    /// @notice Maximum tokens that can be minted in a single transaction
    uint256 public constant MAX_BATCH_MINT = 100;

    // ========== STATE VARIABLES ==========

    /// @notice Manual pausable state
    bool private _paused = false;

    /// @notice Current mint price in wei
    uint256 public mintPrice;

    /// @notice Addresses authorized to mint tokens for free (airdrops)
    mapping(address => bool) public teamMinters;

    // ========== EVENTS ==========

    event Minted(address indexed to, uint256 amount);
    event TeamMinted(address indexed by, address indexed to, uint256 amount);
    event BatchTeamMinted(address indexed by, address[] recipients, uint256[] amounts);
    event TeamMinterUpdated(address indexed minter, bool authorized);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event Paused(address account);
    event Unpaused(address account);
    event NativeTokenWithdrawn(address indexed to, uint256 amount);
    event ERC20Recovered(address indexed token, address indexed to, uint256 amount);
    event ERC721Recovered(address indexed token, address indexed to, uint256 tokenId);

    // ========== CONSTRUCTOR ==========

    /// @notice Initializes the UnicornCredit token
    constructor()
        ERC20("UnicornCredit", "UCRED")
        Ownable(msg.sender)
    {
        mintPrice = INITIAL_MINT_PRICE;

        // Owner is automatically a team minter
        teamMinters[msg.sender] = true;
        emit TeamMinterUpdated(msg.sender, true);
    }

    // ========== MODIFIERS ==========

    /// @notice Ensures contract is not paused
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /// @notice Ensures contract is paused
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    // ========== PAUSABLE FUNCTIONS ==========

    /// @notice Returns whether the contract is paused
    /// @return bool True if paused, false otherwise
    function paused() public view returns (bool) {
        return _paused;
    }

    /// @notice Pauses all minting operations
    /// @dev Only owner can pause
    function pause() external onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpauses all minting operations
    /// @dev Only owner can unpause
    function unpause() external onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    // ========== MINTING FUNCTIONS ==========

    /// @notice Public mint - purchase UCRED tokens at the current mint price
    /// @dev Follows CEI pattern with reentrancy guard
    /// @param amount Number of whole tokens to mint (will be multiplied by 10^18)
    function mint(uint256 amount) external payable whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(amount <= MAX_BATCH_MINT, "Exceeds max batch mint");
        require(msg.value >= mintPrice * amount, "Insufficient payment");

        // Calculate refund BEFORE state changes (CEI pattern)
        uint256 refundAmount = msg.value - (mintPrice * amount);

        // EFFECTS - Mint tokens (1 token = 1e18 units)
        _mint(msg.sender, amount * 1e18);
        emit Minted(msg.sender, amount);

        // INTERACTIONS - Refund excess payment
        if (refundAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund failed");
        }
    }

    /// @notice Team mint - authorized minters can create tokens for free (airdrops)
    /// @dev Used by ThirdWeb server wallet to airdrop tokens to users
    /// @param to Recipient address
    /// @param amount Number of whole tokens to mint
    function teamMint(address to, uint256 amount) external whenNotPaused nonReentrant {
        require(teamMinters[msg.sender], "Not authorized to team mint");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be positive");
        require(amount <= MAX_BATCH_MINT, "Exceeds max batch mint");

        _mint(to, amount * 1e18);
        emit TeamMinted(msg.sender, to, amount);
    }

    /// @notice Batch team mint - mint tokens to multiple recipients at once
    /// @dev Efficient for airdrops to multiple users
    /// @param recipients Array of recipient addresses
    /// @param amounts Array of amounts (whole tokens) per recipient
    function batchTeamMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused nonReentrant {
        require(teamMinters[msg.sender], "Not authorized to team mint");
        require(recipients.length > 0, "No recipients provided");
        require(recipients.length == amounts.length, "Array length mismatch");
        require(recipients.length <= MAX_BATCH_MINT, "Too many recipients");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(amounts[i] > 0, "Amount must be positive");

            _mint(recipients[i], amounts[i] * 1e18);
        }

        emit BatchTeamMinted(msg.sender, recipients, amounts);
    }

    // ========== ADMIN FUNCTIONS ==========

    /// @notice Add or remove a team minter
    /// @dev Only owner can manage team minters
    /// @param minter Address to update
    /// @param authorized True to add, false to remove
    function setTeamMinter(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        teamMinters[minter] = authorized;
        emit TeamMinterUpdated(minter, authorized);
    }

    /// @notice Set the mint price
    /// @dev Only owner can update. Set to 0 for free minting
    /// @param newPrice New price in wei
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /// @notice Withdraw all native tokens (ETH/MATIC/etc) from the contract
    /// @dev Only owner can withdraw
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit NativeTokenWithdrawn(owner(), balance);
    }

    /// @notice Recover ERC20 tokens accidentally sent to contract
    /// @dev Only owner can recover. Uses SafeERC20 for compatibility
    /// @param tokenAddress Address of the ERC20 token contract
    /// @param amount Amount to recover (use 0 to recover all)
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenAddress != address(this), "Cannot recover own tokens");

        IERC20 token = IERC20(tokenAddress);
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance > 0, "No tokens to recover");

        uint256 amountToRecover = amount == 0 ? contractBalance : amount;
        require(amountToRecover <= contractBalance, "Insufficient token balance");

        token.safeTransfer(owner(), amountToRecover);
        emit ERC20Recovered(tokenAddress, owner(), amountToRecover);
    }

    /// @notice Recover ERC721 NFTs accidentally sent to contract
    /// @dev Only owner can recover
    /// @param tokenAddress Address of the ERC721 token contract
    /// @param tokenId Token ID to recover
    function recoverERC721(address tokenAddress, uint256 tokenId) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");

        IERC721 token = IERC721(tokenAddress);
        require(token.ownerOf(tokenId) == address(this), "Contract doesn't own this token");

        token.safeTransferFrom(address(this), owner(), tokenId);
        emit ERC721Recovered(tokenAddress, owner(), tokenId);
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Check if minting is currently active
    /// @return bool True if minting is active
    function isMintingActive() external view returns (bool) {
        return !_paused;
    }

    /// @notice Get the cost to mint a specific amount of tokens
    /// @param amount Number of whole tokens
    /// @return uint256 Total cost in wei
    function getMintCost(uint256 amount) external view returns (uint256) {
        return mintPrice * amount;
    }
}
