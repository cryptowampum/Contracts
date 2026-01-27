// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/// @title DorkToken - A Fun-to-Share ERC20 Token
/// @author @cryptowampum and Claude AI
/// @notice ERC20 token that rewards sharing - send DORK to others and get some back!
/// @dev UUPS upgradeable token with transfer bonus mechanics
contract DorkToken is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    Ownable2StepUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ========== CONSTANTS ==========

    /// @notice Initial mint price (0.001 ETH)
    uint256 public constant INITIAL_MINT_PRICE = 0.001 ether;

    /// @notice Maximum tokens that can be minted in a single batch transaction
    uint256 public constant MAX_BATCH_MINT = 1000;

    /// @notice Maximum reward per transfer (20 DORK)
    uint256 public constant MAX_REWARD = 20 * 1e18;

    /// @notice Balance threshold for reduced rewards (100 DORK)
    uint256 public constant REWARD_THRESHOLD = 100 * 1e18;

    /// @notice Self-transfer penalty percentage (90% goes to contract)
    uint256 public constant SELF_TRANSFER_PENALTY = 90;

    /// @notice Minimum transfer amount to be eligible for bonus (1 DORK)
    uint256 public constant MIN_TRANSFER_FOR_BONUS = 1 * 1e18;

    // ========== STATE VARIABLES ==========

    /// @notice Manual pausable state
    bool private _paused;

    /// @notice Current mint price in wei
    uint256 public mintPrice;

    /// @notice Addresses authorized to mint tokens for free (airdrops)
    mapping(address => bool) public teamMinters;

    /// @notice Token metadata URI (for wallets/explorers that support ERC20 metadata)
    string private _tokenURI;

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
    event ERC1155Recovered(address indexed token, address indexed to, uint256 tokenId, uint256 amount);
    event TransferBonus(address indexed sender, uint256 bonusAmount);
    event SelfTransferPenalty(address indexed sender, uint256 penaltyAmount);
    event GenericTokenRecovered(address indexed token, bytes data, bool success);
    event TokenURIUpdated(string oldURI, string newURI);

    // ========== INITIALIZER ==========

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the DorkToken contract
    /// @param initialOwner The initial owner of the contract
    /// @param initialTokenURI The initial token metadata URI
    function initialize(address initialOwner, string calldata initialTokenURI) public initializer {
        __ERC20_init("DorkToken", "DORK");
        __ERC20Burnable_init();
        __Ownable_init(initialOwner);
        __Ownable2Step_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        mintPrice = INITIAL_MINT_PRICE;
        _paused = false;
        _tokenURI = initialTokenURI;

        // Owner is automatically a team minter
        teamMinters[initialOwner] = true;
        emit TeamMinterUpdated(initialOwner, true);
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

    /// @notice Restricts function to team minters
    modifier onlyTeam() {
        require(teamMinters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    // ========== UUPS UPGRADE ==========

    /// @notice Authorizes contract upgrades
    /// @dev Only owner can upgrade
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ========== PAUSABLE FUNCTIONS ==========

    /// @notice Returns whether the contract is paused
    function paused() public view returns (bool) {
        return _paused;
    }

    /// @notice Pauses all minting and transfer operations
    function pause() external onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpauses all operations
    function unpause() external onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    // ========== TRANSFER OVERRIDE ==========

    /// @notice Override transfer to implement bonus/penalty mechanics
    /// @dev Rewards sender when transferring to others, penalizes self-transfers
    function transfer(address to, uint256 value) public virtual override whenNotPaused returns (bool) {
        address sender = _msgSender();

        // Skip bonus logic for special addresses
        if (_isSpecialAddress(sender) || _isSpecialAddress(to)) {
            _transfer(sender, to, value);
            return true;
        }

        // Self-transfer: 90% penalty goes to contract
        if (sender == to) {
            uint256 penaltyAmount = (value * SELF_TRANSFER_PENALTY) / 100;

            // Transfer penalty to contract, remaining 10% stays with sender
            _transfer(sender, address(this), penaltyAmount);
            emit SelfTransferPenalty(sender, penaltyAmount);
            return true;
        }

        // Normal transfer to others
        _transfer(sender, to, value);

        // Calculate and send bonus from contract
        _sendBonus(sender, value);

        return true;
    }

    /// @notice Override transferFrom to implement bonus/penalty mechanics
    function transferFrom(address from, address to, uint256 value) public virtual override whenNotPaused returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);

        // Skip bonus logic for special addresses
        if (_isSpecialAddress(from) || _isSpecialAddress(to)) {
            _transfer(from, to, value);
            return true;
        }

        // Self-transfer: 90% penalty goes to contract
        if (from == to) {
            uint256 penaltyAmount = (value * SELF_TRANSFER_PENALTY) / 100;

            _transfer(from, address(this), penaltyAmount);
            emit SelfTransferPenalty(from, penaltyAmount);
            return true;
        }

        // Normal transfer
        _transfer(from, to, value);

        // Bonus goes to the original sender (from), not the spender
        _sendBonus(from, value);

        return true;
    }

    /// @notice Transfer without bonus mechanics
    /// @dev Use this for direct transfers without rewards/penalties
    function transferNoBonus(address to, uint256 value) external whenNotPaused returns (bool) {
        _transfer(_msgSender(), to, value);
        return true;
    }

    /// @notice TransferFrom without bonus mechanics
    function transferFromNoBonus(address from, address to, uint256 value) external whenNotPaused returns (bool) {
        _spendAllowance(from, _msgSender(), value);
        _transfer(from, to, value);
        return true;
    }

    /// @notice Check if address should skip bonus logic
    function _isSpecialAddress(address addr) internal view returns (bool) {
        return addr == address(0) || addr == address(this);
    }

    /// @notice Calculate and send bonus to sender
    function _sendBonus(address sender, uint256 transferAmount) internal {
        // Minimum transfer required for bonus eligibility
        if (transferAmount < MIN_TRANSFER_FOR_BONUS) {
            return;
        }

        uint256 contractBalance = balanceOf(address(this));
        if (contractBalance == 0) {
            return; // No bonus available
        }

        uint256 senderBalance = balanceOf(sender);
        uint256 bonusAmount;

        if (senderBalance > REWARD_THRESHOLD) {
            // Sender has > 100 DORK: 1x reward, max 20
            bonusAmount = transferAmount;
        } else {
            // Sender has <= 100 DORK: 2x reward, max 20
            bonusAmount = transferAmount * 2;
        }

        // Cap at MAX_REWARD (20 DORK)
        if (bonusAmount > MAX_REWARD) {
            bonusAmount = MAX_REWARD;
        }

        // Cap at available contract balance
        if (bonusAmount > contractBalance) {
            bonusAmount = contractBalance;
        }

        if (bonusAmount > 0) {
            _transfer(address(this), sender, bonusAmount);
            emit TransferBonus(sender, bonusAmount);
        }
    }

    // ========== MINTING FUNCTIONS ==========

    /// @notice Public mint - purchase DORK tokens at the current mint price
    /// @param amount Number of whole tokens to mint
    function mint(uint256 amount) external payable whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(amount <= MAX_BATCH_MINT, "Exceeds max batch mint");
        require(msg.value >= mintPrice * amount, "Insufficient payment");

        uint256 refundAmount = msg.value - (mintPrice * amount);

        _mint(msg.sender, amount * 1e18);
        emit Minted(msg.sender, amount);

        if (refundAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund failed");
        }
    }

    /// @notice Team mint - authorized minters can create tokens for free
    /// @param to Recipient address
    /// @param amount Number of whole tokens to mint
    function teamMint(address to, uint256 amount) external whenNotPaused nonReentrant onlyTeam {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be positive");
        require(amount <= MAX_BATCH_MINT, "Exceeds max batch mint");

        _mint(to, amount * 1e18);
        emit TeamMinted(msg.sender, to, amount);
    }

    /// @notice Batch team mint - mint tokens to multiple recipients
    /// @param recipients Array of recipient addresses
    /// @param amounts Array of amounts (whole tokens) per recipient
    function batchTeamMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused nonReentrant onlyTeam {
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

    /// @notice Mint tokens directly to the contract's reward pool
    /// @param amount Number of whole tokens to mint to contract
    function mintToRewardPool(uint256 amount) external whenNotPaused nonReentrant onlyTeam {
        require(amount > 0, "Amount must be positive");
        require(amount <= MAX_BATCH_MINT, "Exceeds max batch mint");

        _mint(address(this), amount * 1e18);
        emit TeamMinted(msg.sender, address(this), amount);
    }

    // ========== ADMIN FUNCTIONS ==========

    /// @notice Add or remove a team minter
    function setTeamMinter(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        teamMinters[minter] = authorized;
        emit TeamMinterUpdated(minter, authorized);
    }

    /// @notice Set the mint price
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /// @notice Set the token metadata URI
    /// @param newURI The new metadata URI
    function setTokenURI(string calldata newURI) external onlyOwner {
        string memory oldURI = _tokenURI;
        _tokenURI = newURI;
        emit TokenURIUpdated(oldURI, newURI);
    }

    /// @notice Withdraw all native tokens (ETH) from the contract
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit NativeTokenWithdrawn(owner(), balance);
    }

    /// @notice Recover ERC20 tokens from contract
    /// @dev Cannot recover DORK from contract (that's the reward pool)
    /// @param tokenAddress Address of the ERC20 token
    /// @param amount Amount to recover (0 for all)
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        // Note: We allow recovering DORK if needed via generic call, but not through this function
        require(tokenAddress != address(this), "Use withdrawDorkFromPool for DORK");

        IERC20 token = IERC20(tokenAddress);
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance > 0, "No tokens to recover");

        uint256 amountToRecover = amount == 0 ? contractBalance : amount;
        require(amountToRecover <= contractBalance, "Insufficient token balance");

        token.safeTransfer(owner(), amountToRecover);
        emit ERC20Recovered(tokenAddress, owner(), amountToRecover);
    }

    /// @notice Withdraw DORK from the reward pool (emergency only)
    /// @param amount Amount to withdraw (whole tokens)
    function withdrawDorkFromPool(uint256 amount) external onlyOwner nonReentrant {
        uint256 contractBalance = balanceOf(address(this));
        require(contractBalance > 0, "No DORK in pool");

        uint256 amountToWithdraw = amount == 0 ? contractBalance : amount * 1e18;
        require(amountToWithdraw <= contractBalance, "Insufficient pool balance");

        _transfer(address(this), owner(), amountToWithdraw);
        emit ERC20Recovered(address(this), owner(), amountToWithdraw);
    }

    /// @notice Recover ERC721 NFTs from contract
    /// @param tokenAddress Address of the ERC721 contract
    /// @param tokenId Token ID to recover
    function recoverERC721(address tokenAddress, uint256 tokenId) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");

        IERC721 token = IERC721(tokenAddress);
        require(token.ownerOf(tokenId) == address(this), "Contract doesn't own this token");

        token.safeTransferFrom(address(this), owner(), tokenId);
        emit ERC721Recovered(tokenAddress, owner(), tokenId);
    }

    /// @notice Recover ERC1155 tokens from contract
    /// @param tokenAddress Address of the ERC1155 contract
    /// @param tokenId Token ID to recover
    /// @param amount Amount to recover
    function recoverERC1155(
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");

        IERC1155 token = IERC1155(tokenAddress);
        uint256 balance = token.balanceOf(address(this), tokenId);
        require(balance >= amount, "Insufficient balance");

        uint256 amountToRecover = amount == 0 ? balance : amount;
        token.safeTransferFrom(address(this), owner(), tokenId, amountToRecover, "");
        emit ERC1155Recovered(tokenAddress, owner(), tokenId, amountToRecover);
    }

    /// @notice Generic token recovery via low-level call
    /// @dev Use for ERC-404, ERC-1337, or any non-standard tokens
    /// @param tokenAddress Target contract address
    /// @param data Encoded function call data
    function recoverGenericToken(
        address tokenAddress,
        bytes calldata data
    ) external onlyOwner nonReentrant returns (bool success, bytes memory result) {
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenAddress != address(this), "Cannot call self");

        (success, result) = tokenAddress.call(data);
        emit GenericTokenRecovered(tokenAddress, data, success);
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Returns the token metadata URI
    /// @dev Some wallets and explorers check for this on ERC20 tokens
    function tokenURI() external view returns (string memory) {
        return _tokenURI;
    }

    /// @notice Check if minting is currently active
    function isMintingActive() external view returns (bool) {
        return !_paused;
    }

    /// @notice Get the cost to mint a specific amount of tokens
    function getMintCost(uint256 amount) external view returns (uint256) {
        return mintPrice * amount;
    }

    /// @notice Get the current reward pool balance
    function getRewardPoolBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }

    /// @notice Calculate potential bonus for a transfer
    /// @param sender Address that would send
    /// @param amount Amount that would be sent
    function calculateBonus(address sender, uint256 amount) external view returns (uint256) {
        // Minimum transfer required for bonus
        if (amount < MIN_TRANSFER_FOR_BONUS) return 0;

        uint256 contractBalance = balanceOf(address(this));
        if (contractBalance == 0) return 0;

        uint256 senderBalance = balanceOf(sender);
        uint256 bonusAmount;

        if (senderBalance > REWARD_THRESHOLD) {
            bonusAmount = amount;
        } else {
            bonusAmount = amount * 2;
        }

        if (bonusAmount > MAX_REWARD) {
            bonusAmount = MAX_REWARD;
        }

        if (bonusAmount > contractBalance) {
            bonusAmount = contractBalance;
        }

        return bonusAmount;
    }

    // ========== RECEIVER FUNCTIONS ==========

    /// @notice Allows contract to receive ETH
    receive() external payable {}

    /// @notice Required for ERC721 safeTransfer
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /// @notice Required for ERC1155 safeTransfer
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /// @notice Required for ERC1155 batch safeTransfer
    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
