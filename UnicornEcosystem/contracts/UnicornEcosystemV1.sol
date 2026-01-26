// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IUnicornCredit.sol";

/// @title UnicornEcosystem - Subdomain & Community NFT System
/// @author @cryptowampum and Claude AI
/// @notice Combined soulbound NFT contract for Unicorn Subdomains and Community membership
/// @dev Burns UCRED tokens to claim subdomain + community NFT in a single transaction
contract UnicornEcosystem is ERC721, ERC721Enumerable, Ownable2Step, ReentrancyGuard {
    using Strings for uint256;
    using SafeERC20 for IERC20;

    // ========== CONSTANTS ==========

    /// @notice Token ID offset for community NFTs (1 billion)
    /// @dev SubdomainNFTs: 1 to 999,999,999 | CommunityNFTs: 1,000,000,001+
    uint256 public constant COMMUNITY_TOKEN_OFFSET = 1_000_000_000;

    /// @notice Maximum subdomain name length
    uint256 public constant MAX_NAME_LENGTH = 128;

    /// @notice Minimum subdomain name length
    uint256 public constant MIN_NAME_LENGTH = 1;

    /// @notice Cost to claim a subdomain (1 UCRED token = 1e18)
    uint256 public constant CLAIM_COST = 1e18;

    /// @notice Maximum batch operations
    uint256 public constant MAX_BATCH_SIZE = 50;

    // ========== STATE VARIABLES ==========

    /// @notice Manual pausable state
    bool private _paused = false;

    /// @notice Reference to UnicornCredit token contract
    IUnicornCredit public unicornCredit;

    /// @notice Counter for subdomain token IDs (starts at 1)
    uint256 private _nextSubdomainId = 1;

    /// @notice Maps subdomain token ID to its name
    mapping(uint256 => string) public subdomainNames;

    /// @notice Maps name hash to subdomain token ID (for uniqueness)
    mapping(bytes32 => uint256) public subdomainByNameHash;

    /// @notice Maps name hash to owner address (for reverse lookup)
    mapping(bytes32 => address) public subdomainOwner;

    /// @notice Addresses authorized to claim on behalf of users
    mapping(address => bool) public teamMinters;

    /// @notice Base image URI for subdomain NFTs
    string private baseSubdomainImageURI;

    /// @notice Base image URI for community NFTs
    string private baseCommunityImageURI;

    /// @notice Domain suffix (e.g., ".unicorn")
    string public domainSuffix = ".unicorn";

    // ========== EVENTS ==========

    event SubdomainClaimed(address indexed owner, uint256 indexed subdomainTokenId, uint256 indexed communityTokenId, string name);
    event TeamClaimExecuted(address indexed by, address indexed recipient, uint256 subdomainTokenId, string name);
    event UnicornCreditUpdated(address indexed oldAddress, address indexed newAddress);
    event BaseSubdomainImageURIUpdated(string oldURI, string newURI);
    event BaseCommunityImageURIUpdated(string oldURI, string newURI);
    event DomainSuffixUpdated(string oldSuffix, string newSuffix);
    event TeamMinterUpdated(address indexed minter, bool authorized);
    event Paused(address account);
    event Unpaused(address account);
    event NativeTokenWithdrawn(address indexed to, uint256 amount);
    event ERC20Recovered(address indexed token, address indexed to, uint256 amount);
    event ERC721Recovered(address indexed token, address indexed to, uint256 tokenId);

    // ========== CONSTRUCTOR ==========

    /// @notice Initializes the UnicornEcosystem contract
    /// @param _unicornCredit Address of the UnicornCredit ERC20 token
    /// @param _baseSubdomainImageURI Default image URI for subdomain NFTs
    /// @param _baseCommunityImageURI Default image URI for community NFTs
    constructor(
        address _unicornCredit,
        string memory _baseSubdomainImageURI,
        string memory _baseCommunityImageURI
    )
        ERC721("Unicorn Ecosystem", "UNICORN")
        Ownable(msg.sender)
    {
        require(_unicornCredit != address(0), "Invalid UCRED address");
        require(bytes(_baseSubdomainImageURI).length > 0, "Subdomain image URI required");
        require(bytes(_baseCommunityImageURI).length > 0, "Community image URI required");

        unicornCredit = IUnicornCredit(_unicornCredit);
        baseSubdomainImageURI = _baseSubdomainImageURI;
        baseCommunityImageURI = _baseCommunityImageURI;

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
    function paused() public view returns (bool) {
        return _paused;
    }

    /// @notice Pauses all claiming operations
    function pause() external onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpauses all claiming operations
    function unpause() external onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    // ========== NAME VALIDATION ==========

    /// @notice Validates a subdomain name
    /// @dev Allows a-z, 0-9, hyphens, and dots (hyphens/dots not at start/end)
    /// @param name Name to validate
    /// @return bool True if valid
    function _isValidName(string memory name) internal pure returns (bool) {
        bytes memory b = bytes(name);

        if (b.length < MIN_NAME_LENGTH || b.length > MAX_NAME_LENGTH) {
            return false;
        }

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];

            // Allow: a-z, 0-9
            bool isLowercase = (char >= 0x61 && char <= 0x7A);
            bool isUppercase = (char >= 0x41 && char <= 0x5A);
            bool isDigit = (char >= 0x30 && char <= 0x39);
            bool isHyphen = (char == 0x2D);
            bool isDot = (char == 0x2E);

            if (isHyphen || isDot) {
                // Hyphen and dot not allowed at start or end
                if (i == 0 || i == b.length - 1) {
                    return false;
                }
            } else if (!isLowercase && !isUppercase && !isDigit) {
                return false;
            }
        }

        return true;
    }

    /// @notice Converts a string to lowercase
    /// @param str Input string
    /// @return string Lowercase string
    function _toLowerCase(string memory str) internal pure returns (string memory) {
        bytes memory b = bytes(str);
        bytes memory result = new bytes(b.length);

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            // Convert uppercase to lowercase
            if (char >= 0x41 && char <= 0x5A) {
                result[i] = bytes1(uint8(char) + 32);
            } else {
                result[i] = char;
            }
        }

        return string(result);
    }

    /// @notice Gets the hash of a normalized (lowercase) name
    /// @param name Name to hash
    /// @return bytes32 Hash of lowercase name
    function _getNameHash(string memory name) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_toLowerCase(name)));
    }

    // ========== CLAIM FUNCTIONS ==========

    /// @notice Claim a subdomain and community NFT by burning 1 UCRED
    /// @dev User must have approved this contract to spend their UCRED first
    /// @param name Desired subdomain name (will be normalized to lowercase)
    function claimSubdomain(string calldata name) external whenNotPaused nonReentrant {
        _claimSubdomainFor(msg.sender, name);
    }

    /// @notice Team claim - authorized minters can claim on behalf of users
    /// @dev Used when ThirdWeb server wallet handles the claim for the user
    /// @param recipient Address that will receive the NFTs
    /// @param name Desired subdomain name
    function teamClaimFor(address recipient, string calldata name) external whenNotPaused nonReentrant {
        require(teamMinters[msg.sender], "Not authorized to team claim");
        _claimSubdomainFor(recipient, name);
        emit TeamClaimExecuted(msg.sender, recipient, _nextSubdomainId - 1, name);
    }

    /// @notice Internal claim logic
    /// @param recipient Address to receive the NFTs
    /// @param name Subdomain name to claim
    function _claimSubdomainFor(address recipient, string calldata name) internal {
        // CHECKS
        require(recipient != address(0), "Cannot claim to zero address");
        require(bytes(name).length >= MIN_NAME_LENGTH, "Name too short");
        require(bytes(name).length <= MAX_NAME_LENGTH, "Name too long");
        require(_isValidName(name), "Invalid characters in name");

        // Normalize name and check uniqueness
        string memory normalizedName = _toLowerCase(name);
        bytes32 nameHash = keccak256(abi.encodePacked(normalizedName));
        require(subdomainByNameHash[nameHash] == 0, "Subdomain already claimed");

        // Verify recipient has enough UCRED
        require(
            unicornCredit.balanceOf(recipient) >= CLAIM_COST,
            "Insufficient UCRED balance"
        );

        // EFFECTS - Update all state first
        uint256 subdomainId = _nextSubdomainId++;
        uint256 communityId = COMMUNITY_TOKEN_OFFSET + subdomainId;

        subdomainNames[subdomainId] = normalizedName;
        subdomainByNameHash[nameHash] = subdomainId;
        subdomainOwner[nameHash] = recipient;

        emit SubdomainClaimed(recipient, subdomainId, communityId, normalizedName);

        // INTERACTIONS - External calls last
        // Burn 1 UCRED from recipient (requires prior approval)
        unicornCredit.burnFrom(recipient, CLAIM_COST);

        // Mint both NFTs to recipient
        _safeMint(recipient, subdomainId);
        _safeMint(recipient, communityId);
    }

    // ========== RESOLUTION FUNCTIONS ==========

    /// @notice Resolve a subdomain name to its owner address
    /// @param name Subdomain name to resolve
    /// @return address Owner of the subdomain (or zero address if not claimed)
    function resolveSubdomain(string calldata name) external view returns (address) {
        bytes32 nameHash = _getNameHash(name);
        return subdomainOwner[nameHash];
    }

    /// @notice Check if a subdomain name is available
    /// @param name Subdomain name to check
    /// @return bool True if available
    function isNameAvailable(string calldata name) external view returns (bool) {
        if (!_isValidName(name)) return false;
        bytes32 nameHash = _getNameHash(name);
        return subdomainByNameHash[nameHash] == 0;
    }

    /// @notice Get the subdomain name for a token ID
    /// @param tokenId Subdomain token ID (must be < COMMUNITY_TOKEN_OFFSET)
    /// @return string Subdomain name
    function getSubdomainName(uint256 tokenId) external view returns (string memory) {
        require(tokenId > 0 && tokenId < COMMUNITY_TOKEN_OFFSET, "Not a subdomain token");
        require(bytes(subdomainNames[tokenId]).length > 0, "Subdomain does not exist");
        return subdomainNames[tokenId];
    }

    /// @notice Get the full domain (name + suffix) for a token ID
    /// @param tokenId Subdomain token ID
    /// @return string Full domain (e.g., "alice.unicorn")
    function getFullDomain(uint256 tokenId) external view returns (string memory) {
        require(tokenId > 0 && tokenId < COMMUNITY_TOKEN_OFFSET, "Not a subdomain token");
        require(bytes(subdomainNames[tokenId]).length > 0, "Subdomain does not exist");
        return string(abi.encodePacked(subdomainNames[tokenId], domainSuffix));
    }

    /// @notice Get the community token ID for a subdomain token ID
    /// @param subdomainTokenId Subdomain token ID
    /// @return uint256 Community token ID
    function getCommunityTokenId(uint256 subdomainTokenId) external pure returns (uint256) {
        require(subdomainTokenId > 0 && subdomainTokenId < COMMUNITY_TOKEN_OFFSET, "Not a subdomain token");
        return COMMUNITY_TOKEN_OFFSET + subdomainTokenId;
    }

    /// @notice Get the subdomain token ID for a community token ID
    /// @param communityTokenId Community token ID
    /// @return uint256 Subdomain token ID
    function getSubdomainTokenId(uint256 communityTokenId) external pure returns (uint256) {
        require(communityTokenId > COMMUNITY_TOKEN_OFFSET, "Not a community token");
        return communityTokenId - COMMUNITY_TOKEN_OFFSET;
    }

    /// @notice Check if a token ID is a subdomain NFT
    /// @param tokenId Token ID to check
    /// @return bool True if subdomain NFT
    function isSubdomainToken(uint256 tokenId) external pure returns (bool) {
        return tokenId > 0 && tokenId < COMMUNITY_TOKEN_OFFSET;
    }

    /// @notice Check if a token ID is a community NFT
    /// @param tokenId Token ID to check
    /// @return bool True if community NFT
    function isCommunityToken(uint256 tokenId) external pure returns (bool) {
        return tokenId > COMMUNITY_TOKEN_OFFSET;
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
    /// @param tokenId Token ID to get metadata for
    /// @return string Data URI with JSON metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0, "Invalid token ID");

        address tokenOwner = ownerOf(tokenId);
        require(tokenOwner != address(0), "Token does not exist");

        if (tokenId < COMMUNITY_TOKEN_OFFSET) {
            return _buildSubdomainMetadata(tokenId, tokenOwner);
        } else {
            return _buildCommunityMetadata(tokenId, tokenOwner);
        }
    }

    /// @notice Build metadata for subdomain NFT
    function _buildSubdomainMetadata(uint256 tokenId, address tokenOwner) internal view returns (string memory) {
        string memory name = subdomainNames[tokenId];
        string memory fullDomain = string(abi.encodePacked(name, domainSuffix));
        string memory ownerStr = Strings.toHexString(uint160(tokenOwner), 20);

        string memory json = string(abi.encodePacked(
            '{"name":"', fullDomain, '",',
            '"description":"Unicorn Subdomain - ', fullDomain, '. A soulbound identity in the Unicorn ecosystem.",',
            '"image":"', baseSubdomainImageURI, '",',
            '"attributes":[',
                '{"trait_type":"Type","value":"Subdomain"},',
                '{"trait_type":"Name","value":"', name, '"},',
                '{"trait_type":"Full Domain","value":"', fullDomain, '"},',
                '{"trait_type":"Owner","value":"', ownerStr, '"},',
                '{"trait_type":"Token ID","value":"', tokenId.toString(), '"}',
            ']}'
        ));

        return string(abi.encodePacked("data:application/json;utf8,", json));
    }

    /// @notice Build metadata for community NFT
    function _buildCommunityMetadata(uint256 tokenId, address tokenOwner) internal view returns (string memory) {
        uint256 subdomainId = tokenId - COMMUNITY_TOKEN_OFFSET;
        string memory linkedDomain = string(abi.encodePacked(subdomainNames[subdomainId], domainSuffix));
        string memory ownerStr = Strings.toHexString(uint160(tokenOwner), 20);

        string memory json = string(abi.encodePacked(
            '{"name":"Unicorn Community Member #', subdomainId.toString(), '",',
            '"description":"Unicorn Community Membership NFT. Soulbound proof of membership in the Unicorn ecosystem.",',
            '"image":"', baseCommunityImageURI, '",',
            '"attributes":[',
                '{"trait_type":"Type","value":"Community Membership"},',
                '{"trait_type":"Linked Subdomain","value":"', linkedDomain, '"},',
                '{"trait_type":"Owner","value":"', ownerStr, '"},',
                '{"trait_type":"Member Number","value":"', subdomainId.toString(), '"},',
                '{"trait_type":"Token ID","value":"', tokenId.toString(), '"}',
            ']}'
        ));

        return string(abi.encodePacked("data:application/json;utf8,", json));
    }

    // ========== ADMIN FUNCTIONS ==========

    /// @notice Set the UnicornCredit token contract address
    /// @param newUnicornCredit New address
    function setUnicornCredit(address newUnicornCredit) external onlyOwner {
        require(newUnicornCredit != address(0), "Invalid address");
        address oldAddress = address(unicornCredit);
        unicornCredit = IUnicornCredit(newUnicornCredit);
        emit UnicornCreditUpdated(oldAddress, newUnicornCredit);
    }

    /// @notice Add or remove a team minter
    function setTeamMinter(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        teamMinters[minter] = authorized;
        emit TeamMinterUpdated(minter, authorized);
    }

    /// @notice Update the base subdomain image URI
    function setBaseSubdomainImageURI(string memory newURI) external onlyOwner {
        require(bytes(newURI).length > 0, "URI cannot be empty");
        string memory oldURI = baseSubdomainImageURI;
        baseSubdomainImageURI = newURI;
        emit BaseSubdomainImageURIUpdated(oldURI, newURI);
    }

    /// @notice Update the base community image URI
    function setBaseCommunityImageURI(string memory newURI) external onlyOwner {
        require(bytes(newURI).length > 0, "URI cannot be empty");
        string memory oldURI = baseCommunityImageURI;
        baseCommunityImageURI = newURI;
        emit BaseCommunityImageURIUpdated(oldURI, newURI);
    }

    /// @notice Update the domain suffix
    function setDomainSuffix(string memory newSuffix) external onlyOwner {
        require(bytes(newSuffix).length > 0, "Suffix cannot be empty");
        string memory oldSuffix = domainSuffix;
        domainSuffix = newSuffix;
        emit DomainSuffixUpdated(oldSuffix, newSuffix);
    }

    /// @notice Withdraw all native tokens from the contract
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit NativeTokenWithdrawn(owner(), balance);
    }

    /// @notice Recover ERC20 tokens accidentally sent to contract
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");

        IERC20 token = IERC20(tokenAddress);
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance > 0, "No tokens to recover");

        uint256 amountToRecover = amount == 0 ? contractBalance : amount;
        require(amountToRecover <= contractBalance, "Insufficient token balance");

        token.safeTransfer(owner(), amountToRecover);
        emit ERC20Recovered(tokenAddress, owner(), amountToRecover);
    }

    /// @notice Recover ERC721 NFTs accidentally sent to contract
    function recoverERC721(address tokenAddress, uint256 tokenId) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenAddress != address(this), "Cannot recover own tokens");

        IERC721 token = IERC721(tokenAddress);
        require(token.ownerOf(tokenId) == address(this), "Contract doesn't own this token");

        token.safeTransferFrom(address(this), owner(), tokenId);
        emit ERC721Recovered(tokenAddress, owner(), tokenId);
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Get the base subdomain image URI
    function getBaseSubdomainImageURI() external view returns (string memory) {
        return baseSubdomainImageURI;
    }

    /// @notice Get the base community image URI
    function getBaseCommunityImageURI() external view returns (string memory) {
        return baseCommunityImageURI;
    }

    /// @notice Get total subdomains claimed
    function totalSubdomainsClaimed() external view returns (uint256) {
        return _nextSubdomainId - 1;
    }

    /// @notice Check if claiming is active
    function isClaimingActive() external view returns (bool) {
        return !_paused;
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
