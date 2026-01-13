// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// Use OpenZeppelin for core security features
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BitBasel Moonshot 2025 - P2P IRL NFT System
/// @author @cryptowampum and Claude AI
/// @notice A soulbound NFT system for creating personalized, peer-to-peer NFTs during BitBasel 2025
/// @dev Inherits from ERC721, ERC721Enumerable, Ownable2Step, and ReentrancyGuard for maximum security
contract BitBaselMoonshot2025 is ERC721, ERC721Enumerable, Ownable2Step, ReentrancyGuard {
    using Strings for uint256;
    using SafeERC20 for IERC20;

    // ========== CONSTANTS ==========

    /// @notice Maximum number of NFTs that can ever be minted
    uint256 public constant MAX_SUPPLY = 10000;

    /// @notice Maximum number of NFTs that can be minted in a single batch operation
    uint256 public constant MAX_BATCH_SIZE = 100;

    /// @notice Maximum number of tokens that can be flagged in a single batch operation
    uint256 public constant MAX_BATCH_FLAG = 50;

    /// @notice Maximum time in future for event dates (1 year)
    uint256 public constant MAX_FUTURE_EVENT_DATE = 365 days;

    /// @notice Maximum time in past for event dates (5 years for historical events)
    uint256 public constant MAX_PAST_EVENT_DATE = 1825 days;

    // ========== STATE VARIABLES ==========

    /// @notice Manual pausable state (avoiding OpenZeppelin Pausable.sol for compatibility)
    bool private _paused = false;

    /// @notice Counter for token IDs
    uint256 private _nextTokenId = 1;

    /// @notice Fallback/default image URI
    string private baseImageURI;

    /// @notice Optional animation/video URI
    string private baseAnimationURI;

    /// @notice Price to mint an NFT (in wei)
    uint256 public mintPrice = 0;

    /// @notice Image shown for flagged/inappropriate content
    string private nsfwReplacementImage;

    // ========== STRUCTS ==========

    /// @notice Metadata for each token
    /// @param customImage IPFS URI of the custom photo
    /// @param customText Personalized message/description
    /// @param eventName Name of the event where NFT was created
    /// @param eventDate Unix timestamp of the event
    /// @param minter Address of the team member who created this NFT
    struct TokenMetadata {
        string customImage;
        string customText;
        string eventName;
        uint256 eventDate;
        address minter;
    }

    // ========== MAPPINGS ==========

    /// @notice Stores metadata for each token
    mapping(uint256 => TokenMetadata) public tokenMetadata;

    /// @notice Tracks which tokens have been flagged for inappropriate content
    mapping(uint256 => bool) public isFlagged;

    /// @notice Addresses authorized to flag inappropriate content
    mapping(address => bool) public moderators;

    /// @notice Addresses authorized to mint NFTs for others
    mapping(address => bool) public teamMinters;

    // ========== EVENTS ==========

    event BaseImageURIUpdated(string oldURI, string newURI);
    event BaseAnimationURIUpdated(string oldURI, string newURI);
    event Minted(address indexed to, uint256 indexed tokenId, string eventName);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event BatchMinted(address indexed by, address[] recipients, uint256[] tokenIds);
    event TokenFlagged(uint256 indexed tokenId, address indexed moderator, string reason);
    event TokenUnflagged(uint256 indexed tokenId, address indexed moderator);
    event NSFWImageUpdated(string oldURI, string newURI);
    event ModeratorUpdated(address indexed moderator, bool authorized);
    event TeamMinterUpdated(address indexed minter, bool authorized);
    event TokenMetadataUpdated(uint256 indexed tokenId);
    event NativeTokenWithdrawn(address indexed to, uint256 amount);
    event ERC20Recovered(address indexed token, address indexed to, uint256 amount);
    event ERC721Recovered(address indexed token, address indexed to, uint256 tokenId);
    event Paused(address account);
    event Unpaused(address account);

    // ========== CONSTRUCTOR ==========

    /// @notice Initializes the BitBasel Moonshot 2025 contract
    /// @param _baseImageURI Fallback image URI
    /// @param _baseAnimationURI Optional animation URI (can be empty)
    /// @param _nsfwImage NSFW replacement image URI
    constructor(
        string memory _baseImageURI,
        string memory _baseAnimationURI,
        string memory _nsfwImage
    )
        ERC721("BitBasel Moonshot 2025", "BBM25")
        Ownable(msg.sender)
    {
        require(bytes(_baseImageURI).length > 0, "Base image URI cannot be empty");
        require(bytes(_nsfwImage).length > 0, "NSFW image URI cannot be empty");

        baseImageURI = _baseImageURI;
        baseAnimationURI = _baseAnimationURI;
        nsfwReplacementImage = _nsfwImage;

        // Owner is automatically a team minter and moderator
        teamMinters[msg.sender] = true;
        moderators[msg.sender] = true;

        // Emit events for initial setup
        emit TeamMinterUpdated(msg.sender, true);
        emit ModeratorUpdated(msg.sender, true);
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

    /// @notice Ensures supply is available
    modifier supplyAvailable() {
        require(totalSupply() < MAX_SUPPLY, "Max supply reached");
        _;
    }

    /// @notice Validates event date is within acceptable range
    /// @param eventDate Unix timestamp to validate
    modifier validEventDate(uint256 eventDate) {
        require(
            eventDate <= block.timestamp + MAX_FUTURE_EVENT_DATE,
            "Event date too far in future"
        );
        require(
            eventDate >= block.timestamp - MAX_PAST_EVENT_DATE,
            "Event date too far in past"
        );
        _;
    }

    // ========== PAUSABLE FUNCTIONS ==========

    /// @notice Returns whether the contract is paused
    /// @return bool True if paused, false otherwise
    function paused() public view returns (bool) {
        return _paused;
    }

    /// @notice Pauses all minting operations
    /// @dev Only owner can pause. Does not affect burning or metadata updates
    function pause() public onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpauses all minting operations
    /// @dev Only owner can unpause
    function unpause() public onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    // ========== INTERNAL HELPERS ==========

    /// @notice Checks if a token exists
    /// @param tokenId Token ID to check
    /// @return bool True if token exists
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < _nextTokenId;
    }

    // ========== MINTING FUNCTIONS ==========

    /// @notice Public mint - user mints for themselves with customization
    /// @dev Follows CEI pattern and includes reentrancy guard
    /// @param customImage IPFS hash of custom photo (can be empty to use base image)
    /// @param customText Personalized message (can be empty for default)
    /// @param eventName Name of the event
    /// @param eventDate Unix timestamp of event
    function mint(
        string memory customImage,
        string memory customText,
        string memory eventName,
        uint256 eventDate
    )
        external
        payable
        supplyAvailable
        whenNotPaused
        validEventDate(eventDate)
        nonReentrant
    {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(bytes(eventName).length > 0, "Event name required");

        // Calculate refund amount BEFORE any state changes
        uint256 refundAmount = msg.value - mintPrice;

        // CHECKS-EFFECTS-INTERACTIONS pattern
        // 1. EFFECTS - Update all state first
        uint256 tokenId = _nextTokenId++;

        tokenMetadata[tokenId] = TokenMetadata({
            customImage: customImage,
            customText: customText,
            eventName: eventName,
            eventDate: eventDate,
            minter: msg.sender
        });

        emit Minted(msg.sender, tokenId, eventName);

        // 2. INTERACTIONS - External calls last
        _safeMint(msg.sender, tokenId);

        // Refund excess payment AFTER all state changes
        if (refundAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund failed");
        }
    }

    /// @notice Team mint - authorized team member creates NFT for recipient
    /// @dev Only callable by authorized team minters
    /// @param recipient Address that will receive the NFT
    /// @param customImage IPFS hash of custom photo (required for team mints)
    /// @param customText Personalized message
    /// @param eventName Name of the event
    /// @param eventDate Unix timestamp of event
    function teamMint(
        address recipient,
        string memory customImage,
        string memory customText,
        string memory eventName,
        uint256 eventDate
    )
        external
        supplyAvailable
        whenNotPaused
        validEventDate(eventDate)
        nonReentrant
    {
        require(teamMinters[msg.sender], "Not authorized to team mint");
        require(recipient != address(0), "Cannot mint to zero address");
        require(bytes(customImage).length > 0, "Custom image required for team mint");
        require(bytes(eventName).length > 0, "Event name required");

        // EFFECTS
        uint256 tokenId = _nextTokenId++;

        tokenMetadata[tokenId] = TokenMetadata({
            customImage: customImage,
            customText: customText,
            eventName: eventName,
            eventDate: eventDate,
            minter: msg.sender
        });

        emit Minted(recipient, tokenId, eventName);

        // INTERACTIONS
        _safeMint(recipient, tokenId);
    }

    /// @notice Batch team mint - mint multiple NFTs at once
    /// @dev Useful for group photos. Limited to MAX_BATCH_SIZE
    /// @param recipients Array of recipient addresses
    /// @param customImages Array of IPFS hashes (one per recipient)
    /// @param customTexts Array of personalized messages
    /// @param eventName Event name (same for all in batch)
    /// @param eventDate Event timestamp (same for all in batch)
    function batchTeamMint(
        address[] calldata recipients,
        string[] calldata customImages,
        string[] calldata customTexts,
        string memory eventName,
        uint256 eventDate
    )
        external
        supplyAvailable
        whenNotPaused
        validEventDate(eventDate)
        nonReentrant
    {
        require(teamMinters[msg.sender], "Not authorized to team mint");
        require(recipients.length > 0, "No recipients provided");
        require(recipients.length <= MAX_BATCH_SIZE, "Batch size too large");
        require(recipients.length == customImages.length, "Recipients/images length mismatch");
        require(recipients.length == customTexts.length, "Recipients/texts length mismatch");
        require(totalSupply() + recipients.length <= MAX_SUPPLY, "Batch would exceed max supply");
        require(bytes(eventName).length > 0, "Event name required");

        uint256[] memory tokenIds = new uint256[](recipients.length);

        // EFFECTS - All state changes first
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(bytes(customImages[i]).length > 0, "Custom image required");

            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;

            tokenMetadata[tokenId] = TokenMetadata({
                customImage: customImages[i],
                customText: customTexts[i],
                eventName: eventName,
                eventDate: eventDate,
                minter: msg.sender
            });

            emit Minted(recipients[i], tokenId, eventName);
        }

        // INTERACTIONS - External calls last
        for (uint256 i = 0; i < recipients.length; i++) {
            _safeMint(recipients[i], tokenIds[i]);
        }

        emit BatchMinted(msg.sender, recipients, tokenIds);
    }

    // ========== METADATA MANAGEMENT ==========

    /// @notice Update metadata for existing token
    /// @dev Only callable by authorized team members, useful for corrections
    /// @param tokenId Token ID to update
    /// @param customImage New IPFS hash
    /// @param customText New personalized message
    /// @param eventName New event name
    /// @param eventDate New event timestamp
    function updateTokenMetadata(
        uint256 tokenId,
        string memory customImage,
        string memory customText,
        string memory eventName,
        uint256 eventDate
    )
        external
        validEventDate(eventDate)
    {
        require(teamMinters[msg.sender], "Not authorized");
        require(_tokenExists(tokenId), "Token does not exist");
        require(bytes(eventName).length > 0, "Event name required");

        tokenMetadata[tokenId].customImage = customImage;
        tokenMetadata[tokenId].customText = customText;
        tokenMetadata[tokenId].eventName = eventName;
        tokenMetadata[tokenId].eventDate = eventDate;

        emit TokenMetadataUpdated(tokenId);
    }

    // ========== MODERATION FUNCTIONS ==========

    /// @notice Flag a token as containing inappropriate content
    /// @dev Only callable by authorized moderators
    /// @param tokenId Token ID to flag
    /// @param reason Reason for flagging (logged in event)
    function flagToken(uint256 tokenId, string memory reason) external {
        require(moderators[msg.sender], "Not authorized to moderate");
        require(_tokenExists(tokenId), "Token does not exist");
        require(!isFlagged[tokenId], "Token already flagged");
        require(bytes(reason).length > 0, "Reason required");

        isFlagged[tokenId] = true;
        emit TokenFlagged(tokenId, msg.sender, reason);
    }

    /// @notice Batch flag multiple tokens
    /// @dev Limited to MAX_BATCH_FLAG to prevent gas issues
    /// @param tokenIds Array of token IDs to flag
    /// @param reason Reason for flagging (same for all)
    function batchFlagTokens(uint256[] calldata tokenIds, string memory reason) external {
        require(moderators[msg.sender], "Not authorized to moderate");
        require(tokenIds.length > 0, "No tokens provided");
        require(tokenIds.length <= MAX_BATCH_FLAG, "Too many tokens to flag at once");
        require(bytes(reason).length > 0, "Reason required");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_tokenExists(tokenIds[i]), "Token does not exist");
            if (!isFlagged[tokenIds[i]]) {
                isFlagged[tokenIds[i]] = true;
                emit TokenFlagged(tokenIds[i], msg.sender, reason);
            }
        }
    }

    /// @notice Unflag a token (for appeals or corrections)
    /// @dev Only owner can unflag to prevent moderator abuse
    /// @param tokenId Token ID to unflag
    function unflagToken(uint256 tokenId) external onlyOwner {
        require(_tokenExists(tokenId), "Token does not exist");
        require(isFlagged[tokenId], "Token not flagged");

        isFlagged[tokenId] = false;
        emit TokenUnflagged(tokenId, msg.sender);
    }

    /// @notice Set the NSFW replacement image
    /// @dev Only owner can update
    /// @param newNSFWImage New IPFS hash for NSFW warning image
    function setNSFWReplacementImage(string memory newNSFWImage) external onlyOwner {
        require(bytes(newNSFWImage).length > 0, "NSFW image URI cannot be empty");
        string memory oldURI = nsfwReplacementImage;
        nsfwReplacementImage = newNSFWImage;
        emit NSFWImageUpdated(oldURI, newNSFWImage);
    }

    /// @notice Add or remove a moderator
    /// @dev Only owner can manage moderators
    /// @param moderator Address to update
    /// @param authorized True to add, false to remove
    function setModerator(address moderator, bool authorized) external onlyOwner {
        require(moderator != address(0), "Invalid moderator address");
        moderators[moderator] = authorized;
        emit ModeratorUpdated(moderator, authorized);
    }

    // ========== SOULBOUND IMPLEMENTATION ==========

    /// @notice Hook called before token transfers
    /// @dev Blocks all transfers except mints and burns (soulbound)
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // SOULBOUND: Only allow mints (from == 0) and burns (to == 0)
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfers disabled");
        }

        return super._update(to, tokenId, auth);
    }

    /// @notice Required override for ERC721Enumerable
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /// @notice Disable approve - soulbound tokens cannot be approved
    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert("Soulbound: approvals disabled");
    }

    /// @notice Disable setApprovalForAll - soulbound tokens cannot be approved
    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert("Soulbound: approvals disabled");
    }

    // ========== METADATA GENERATION ==========

    /// @notice Generate on-chain metadata for a token
    /// @dev Returns data URI with JSON metadata
    /// @param tokenId Token ID to get metadata for
    /// @return string Data URI containing JSON metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_tokenExists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) != address(0), "Token was burned");

        TokenMetadata storage meta = tokenMetadata[tokenId];
        address owner = ownerOf(tokenId);
        string memory ownerStr = Strings.toHexString(uint160(owner), 20);
        string memory minterStr = Strings.toHexString(uint160(meta.minter), 20);

        // Use NSFW image if flagged, otherwise use custom or base image
        string memory imageURI;
        if (isFlagged[tokenId]) {
            imageURI = nsfwReplacementImage;
        } else {
            imageURI = bytes(meta.customImage).length > 0
                ? meta.customImage
                : baseImageURI;
        }

        // Build description
        string memory description;
        if (isFlagged[tokenId]) {
            description = string(abi.encodePacked(
                bytes(meta.customText).length > 0 ? meta.customText : "BitBasel Moonshot 2025 NFT",
                " [Content flagged by moderators]"
            ));
        } else {
            description = bytes(meta.customText).length > 0
                ? meta.customText
                : "BitBasel Moonshot 2025 - A soulbound memory captured at Art Basel Miami!";
        }

        // Build attributes
        string memory attributes = string(abi.encodePacked(
            '{"trait_type":"Owner","value":"', ownerStr, '"}',
            ',{"trait_type":"Created By","value":"', minterStr, '"}'
        ));

        if (bytes(meta.eventName).length > 0) {
            attributes = string(abi.encodePacked(
                attributes,
                ',{"trait_type":"Event","value":"', meta.eventName, '"}'
            ));
        }

        if (meta.eventDate > 0) {
            attributes = string(abi.encodePacked(
                attributes,
                ',{"trait_type":"Event Date","display_type":"date","value":', meta.eventDate.toString(), '}'
            ));
        }

        if (bytes(meta.customImage).length > 0) {
            attributes = string(abi.encodePacked(
                attributes,
                ',{"trait_type":"Custom Photo","value":"true"}'
            ));
        }

        if (isFlagged[tokenId]) {
            attributes = string(abi.encodePacked(
                attributes,
                ',{"trait_type":"Status","value":"Flagged"}'
            ));
        }

        // Build final JSON
        string memory json = string(abi.encodePacked(
            '{"name":"BitBasel Moonshot #', tokenId.toString()
        ));

        if (bytes(meta.eventName).length > 0) {
            json = string(abi.encodePacked(json, ' - ', meta.eventName));
        }

        json = string(abi.encodePacked(
            json,
            '","description":"', description, '","image":"', imageURI, '"'
        ));

        // Add animation URL if set
        if (bytes(baseAnimationURI).length > 0) {
            json = string(abi.encodePacked(
                json,
                ',"animation_url":"', baseAnimationURI, '"'
            ));
        }

        json = string(abi.encodePacked(
            json,
            ',"attributes":[', attributes, ']}'
        ));

        return string(abi.encodePacked(
            "data:application/json;utf8,",
            json
        ));
    }

    // ========== ADMIN FUNCTIONS ==========

    /// @notice Set the mint price
    /// @dev Only owner can update
    /// @param newPrice New price in wei
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /// @notice Add or remove a team minter
    /// @dev Only owner can manage team minters
    /// @param minter Address to update
    /// @param authorized True to add, false to remove
    function setTeamMinter(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        teamMinters[minter] = authorized;
        emit TeamMinterUpdated(minter, authorized);
    }

    /// @notice Update the base image URI
    /// @dev Only owner can update. Used as fallback when no custom image
    /// @param newBaseImageURI New IPFS hash for base image
    function updateBaseImageURI(string memory newBaseImageURI) external onlyOwner {
        require(bytes(newBaseImageURI).length > 0, "Base image URI cannot be empty");
        string memory oldURI = baseImageURI;
        baseImageURI = newBaseImageURI;
        emit BaseImageURIUpdated(oldURI, newBaseImageURI);
    }

    /// @notice Update the base animation URI
    /// @dev Only owner can update
    /// @param newBaseAnimationURI New IPFS hash for animation
    function updateBaseAnimationURI(string memory newBaseAnimationURI) external onlyOwner {
        string memory oldURI = baseAnimationURI;
        baseAnimationURI = newBaseAnimationURI;
        emit BaseAnimationURIUpdated(oldURI, newBaseAnimationURI);
    }

    /// @notice Withdraw all native tokens (ETH/MATIC/etc) from the contract
    /// @dev Only owner can withdraw. Works with any chain's native token
    /// @dev Emits event for transparency. Uses nonReentrant for safety
    /// @dev IMPORTANT: Owner must be EOA or contract with payable receive/fallback
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit NativeTokenWithdrawn(owner(), balance);
    }

    /// @notice Legacy function name for backward compatibility
    /// @dev Calls withdraw() - works on any chain regardless of name
    /// @dev IMPORTANT: Owner must be EOA or contract with payable receive/fallback
    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit NativeTokenWithdrawn(owner(), balance);
    }

    /// @notice Recover ERC20 tokens accidentally sent to contract
    /// @dev Only owner can recover. Uses SafeERC20 for non-standard token compatibility
    /// @dev Prevents tokens from being stuck forever
    /// @param tokenAddress Address of the ERC20 token contract
    /// @param amount Amount of tokens to recover (use 0 to recover all)
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenAddress != address(this), "Cannot recover own tokens");

        IERC20 token = IERC20(tokenAddress);
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance > 0, "No tokens to recover");

        // If amount is 0, recover all tokens
        uint256 amountToRecover = amount == 0 ? contractBalance : amount;
        require(amountToRecover <= contractBalance, "Insufficient token balance");

        // Use SafeERC20 for better compatibility with non-standard tokens
        token.safeTransfer(owner(), amountToRecover);

        emit ERC20Recovered(tokenAddress, owner(), amountToRecover);
    }

    /// @notice Recover ERC721 NFTs accidentally sent to contract
    /// @dev Only owner can recover. This contract shouldn't hold other NFTs
    /// @param tokenAddress Address of the ERC721 token contract
    /// @param tokenId Token ID to recover
    function recoverERC721(address tokenAddress, uint256 tokenId) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenAddress != address(this), "Cannot recover own tokens");

        IERC721 token = IERC721(tokenAddress);
        require(token.ownerOf(tokenId) == address(this), "Contract doesn't own this token");

        token.safeTransferFrom(address(this), owner(), tokenId);

        emit ERC721Recovered(tokenAddress, owner(), tokenId);
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Check if minting is currently active
    /// @return bool True if minting is active
    function isMintingActive() external view returns (bool) {
        return !_paused && totalSupply() < MAX_SUPPLY;
    }

    /// @notice Get the base image URI
    /// @return string Base image URI
    function getBaseImageURI() external view returns (string memory) {
        return baseImageURI;
    }

    /// @notice Get the base animation URI
    /// @return string Base animation URI
    function getBaseAnimationURI() external view returns (string memory) {
        return baseAnimationURI;
    }

    /// @notice Get the NSFW replacement image URI
    /// @return string NSFW replacement image URI
    function getNSFWReplacementImage() external view returns (string memory) {
        return nsfwReplacementImage;
    }

    /// @notice Get all metadata for a token
    /// @param tokenId Token ID to query
    /// @return customImage IPFS hash of custom image
    /// @return customText Personalized message
    /// @return eventName Name of the event
    /// @return eventDate Unix timestamp of event
    /// @return minter Address of team member who created it
    /// @return flagged Whether token is flagged
    function getTokenMetadata(uint256 tokenId) external view returns (
        string memory customImage,
        string memory customText,
        string memory eventName,
        uint256 eventDate,
        address minter,
        bool flagged
    ) {
        require(_tokenExists(tokenId), "Token does not exist");
        TokenMetadata storage meta = tokenMetadata[tokenId];
        return (
            meta.customImage,
            meta.customText,
            meta.eventName,
            meta.eventDate,
            meta.minter,
            isFlagged[tokenId]
        );
    }

    // ========== REQUIRED OVERRIDES ==========

    /// @notice Required override for ERC721Enumerable
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
