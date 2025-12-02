// SPDX-License-Identifier: MIT
// FLATTENED CONTRACT FOR REMIX DEPLOYMENT
// BitBasel Moonshot 2025 - P2P IRL NFT System
// Flattened on: December 1, 2025
// OpenZeppelin Contracts v5.0.0

pragma solidity 0.8.24;

// ============ OpenZeppelin Interfaces ============

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC721Enumerable is IERC721 {
    function totalSupply() external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
    function tokenByIndex(uint256 index) external view returns (uint256);
}

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    function nonces(address owner) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

// ============ OpenZeppelin Utils ============

library Strings {
    bytes16 private constant HEX_DIGITS = "0123456789abcdef";
    uint8 private constant ADDRESS_LENGTH = 20;

    error StringsInsufficientHexLength(uint256 value, uint256 length);

    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = Math.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                assembly {
                    mstore8(ptr, byte(mod(value, 10), HEX_DIGITS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    function toHexString(uint256 value) internal pure returns (string memory) {
        unchecked {
            return toHexString(value, Math.log256(value) + 1);
        }
    }

    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        uint256 localValue = value;
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = HEX_DIGITS[localValue & 0xf];
            localValue >>= 4;
        }
        if (localValue != 0) {
            revert StringsInsufficientHexLength(value, length);
        }
        return string(buffer);
    }

    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), ADDRESS_LENGTH);
    }
}

library Math {
    error MathOverflowedMulDiv();

    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >= 10 ** 64) { value /= 10 ** 64; result += 64; }
            if (value >= 10 ** 32) { value /= 10 ** 32; result += 32; }
            if (value >= 10 ** 16) { value /= 10 ** 16; result += 16; }
            if (value >= 10 ** 8) { value /= 10 ** 8; result += 8; }
            if (value >= 10 ** 4) { value /= 10 ** 4; result += 4; }
            if (value >= 10 ** 2) { value /= 10 ** 2; result += 2; }
            if (value >= 10 ** 1) { result += 1; }
        }
        return result;
    }

    function log256(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >> 128 > 0) { value >>= 128; result += 16; }
            if (value >> 64 > 0) { value >>= 64; result += 8; }
            if (value >> 32 > 0) { value >>= 32; result += 4; }
            if (value >> 16 > 0) { value >>= 16; result += 2; }
            if (value >> 8 > 0) { result += 1; }
        }
        return result;
    }
}

library Address {
    error AddressInsufficientBalance(address account);
    error AddressEmptyCode(address target);
    error FailedInnerCall();

    function sendValue(address payable recipient, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert AddressInsufficientBalance(address(this));
        }
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert FailedInnerCall();
        }
    }

    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0);
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        if (address(this).balance < value) {
            revert AddressInsufficientBalance(address(this));
        }
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata
    ) internal view returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            if (returndata.length == 0 && target.code.length == 0) {
                revert AddressEmptyCode(target);
            }
            return returndata;
        }
    }

    function _revert(bytes memory returndata) private pure {
        if (returndata.length > 0) {
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert FailedInnerCall();
        }
    }
}

// ============ OpenZeppelin Context ============

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// ============ OpenZeppelin ERC165 ============

abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

// ============ OpenZeppelin Ownable ============

abstract contract Ownable is Context {
    address private _owner;

    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

abstract contract Ownable2Step is Ownable {
    address private _pendingOwner;

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);

    function pendingOwner() public view virtual returns (address) {
        return _pendingOwner;
    }

    function transferOwnership(address newOwner) public virtual override onlyOwner {
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner(), newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual override {
        delete _pendingOwner;
        super._transferOwnership(newOwner);
    }

    function acceptOwnership() public virtual {
        address sender = _msgSender();
        if (pendingOwner() != sender) {
            revert OwnableUnauthorizedAccount(sender);
        }
        _transferOwnership(sender);
    }
}

// ============ OpenZeppelin ReentrancyGuard ============

abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = NOT_ENTERED;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// ============ OpenZeppelin SafeERC20 ============

library SafeERC20 {
    using Address for address;

    error SafeERC20FailedOperation(address token);
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeCall(token.approve, (spender, value));
        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeCall(token.approve, (spender, 0)));
            _callOptionalReturn(token, approvalCall);
        }
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        bytes memory returndata = address(token).functionCall(data);
        if (returndata.length != 0 && !abi.decode(returndata, (bool))) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        (bool success, bytes memory returndata) = address(token).call(data);
        return success && (returndata.length == 0 || abi.decode(returndata, (bool))) && address(token).code.length > 0;
    }
}

// ============ OpenZeppelin ERC721 ============

abstract contract ERC721 is Context, ERC165, IERC721, IERC721Metadata {
    using Strings for uint256;

    string private _name;
    string private _symbol;

    mapping(uint256 tokenId => address) private _owners;
    mapping(address owner => uint256) private _balances;
    mapping(uint256 tokenId => address) private _tokenApprovals;
    mapping(address owner => mapping(address operator => bool)) private _operatorApprovals;

    error ERC721InvalidOwner(address owner);
    error ERC721NonexistentToken(uint256 tokenId);
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);
    error ERC721InvalidSender(address sender);
    error ERC721InvalidReceiver(address receiver);
    error ERC721InsufficientApproval(address operator, uint256 tokenId);
    error ERC721InvalidApprover(address approver);
    error ERC721InvalidOperator(address operator);

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function balanceOf(address owner) public view virtual returns (uint256) {
        if (owner == address(0)) {
            revert ERC721InvalidOwner(address(0));
        }
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        return _requireOwned(tokenId);
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        _requireOwned(tokenId);
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string.concat(baseURI, tokenId.toString()) : "";
    }

    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }

    function approve(address to, uint256 tokenId) public virtual {
        _approve(to, tokenId, _msgSender());
    }

    function getApproved(uint256 tokenId) public view virtual returns (address) {
        _requireOwned(tokenId);
        return _getApproved(tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public virtual {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view virtual returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, _msgSender());
        if (previousOwner != from) {
            revert ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual {
        transferFrom(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, data);
    }

    function _ownerOf(uint256 tokenId) internal view virtual returns (address) {
        return _owners[tokenId];
    }

    function _getApproved(uint256 tokenId) internal view virtual returns (address) {
        return _tokenApprovals[tokenId];
    }

    function _isAuthorized(address owner, address spender, uint256 tokenId) internal view virtual returns (bool) {
        return
            spender != address(0) &&
            (owner == spender || isApprovedForAll(owner, spender) || _getApproved(tokenId) == spender);
    }

    function _checkAuthorized(address owner, address spender, uint256 tokenId) internal view virtual {
        if (!_isAuthorized(owner, spender, tokenId)) {
            if (owner == address(0)) {
                revert ERC721NonexistentToken(tokenId);
            } else {
                revert ERC721InsufficientApproval(spender, tokenId);
            }
        }
    }

    function _increaseBalance(address account, uint128 value) internal virtual {
        unchecked {
            _balances[account] += value;
        }
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual returns (address) {
        address from = _ownerOf(tokenId);

        if (auth != address(0)) {
            _checkAuthorized(from, auth, tokenId);
        }

        if (from != address(0)) {
            _approve(address(0), tokenId, address(0), false);
            unchecked {
                _balances[from] -= 1;
            }
        }

        if (to != address(0)) {
            unchecked {
                _balances[to] += 1;
            }
        }

        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        return from;
    }

    function _mint(address to, uint256 tokenId) internal {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, address(0));
        if (previousOwner != address(0)) {
            revert ERC721InvalidSender(address(0));
        }
    }

    function _safeMint(address to, uint256 tokenId) internal {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual {
        _mint(to, tokenId);
        _checkOnERC721Received(address(0), to, tokenId, data);
    }

    function _burn(uint256 tokenId) internal {
        address previousOwner = _update(address(0), tokenId, address(0));
        if (previousOwner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, address(0));
        if (previousOwner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        } else if (previousOwner != from) {
            revert ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }

    function _safeTransfer(address from, address to, uint256 tokenId) internal {
        _safeTransfer(from, to, tokenId, "");
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal virtual {
        _transfer(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, data);
    }

    function _approve(address to, uint256 tokenId, address auth) internal {
        _approve(to, tokenId, auth, true);
    }

    function _approve(address to, uint256 tokenId, address auth, bool emitEvent) internal virtual {
        if (emitEvent || auth != address(0)) {
            address owner = _requireOwned(tokenId);

            if (auth != address(0) && owner != auth && !isApprovedForAll(owner, auth)) {
                revert ERC721InvalidApprover(auth);
            }

            if (emitEvent) {
                emit Approval(owner, to, tokenId);
            }
        }

        _tokenApprovals[tokenId] = to;
    }

    function _setApprovalForAll(address owner, address operator, bool approved) internal virtual {
        if (operator == address(0)) {
            revert ERC721InvalidOperator(address(0));
        }
        _operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function _requireOwned(uint256 tokenId) internal view returns (address) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
        return owner;
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, data) returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector) {
                    revert ERC721InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert ERC721InvalidReceiver(to);
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }
}

// ============ OpenZeppelin ERC721Enumerable ============

abstract contract ERC721Enumerable is ERC721, IERC721Enumerable {
    mapping(address owner => mapping(uint256 index => uint256)) private _ownedTokens;
    mapping(uint256 tokenId => uint256) private _ownedTokensIndex;

    uint256[] private _allTokens;
    mapping(uint256 tokenId => uint256) private _allTokensIndex;

    error ERC721OutOfBoundsIndex(address owner, uint256 index);
    error ERC721EnumerableForbiddenBatchMint();

    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC721) returns (bool) {
        return interfaceId == type(IERC721Enumerable).interfaceId || super.supportsInterface(interfaceId);
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256) {
        if (index >= balanceOf(owner)) {
            revert ERC721OutOfBoundsIndex(owner, index);
        }
        return _ownedTokens[owner][index];
    }

    function totalSupply() public view virtual returns (uint256) {
        return _allTokens.length;
    }

    function tokenByIndex(uint256 index) public view virtual returns (uint256) {
        if (index >= totalSupply()) {
            revert ERC721OutOfBoundsIndex(address(0), index);
        }
        return _allTokens[index];
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);

        if (previousOwner == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (previousOwner != to) {
            _removeTokenFromOwnerEnumeration(previousOwner, tokenId);
        }
        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (previousOwner != to) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }

        return previousOwner;
    }

    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = balanceOf(to) - 1;
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
    }

    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = balanceOf(from);
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }

    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        uint256 lastTokenIndex = _allTokens.length - 1;
        uint256 tokenIndex = _allTokensIndex[tokenId];

        uint256 lastTokenId = _allTokens[lastTokenIndex];

        _allTokens[tokenIndex] = lastTokenId;
        _allTokensIndex[lastTokenId] = tokenIndex;

        delete _allTokensIndex[tokenId];
        _allTokens.pop();
    }

    function _increaseBalance(address account, uint128 amount) internal virtual override {
        if (amount > 0) {
            revert ERC721EnumerableForbiddenBatchMint();
        }
        super._increaseBalance(account, amount);
    }
}

// ============ BitBasel Moonshot 2025 Contract ============

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

    /// @notice Manual pausable state
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
    struct TokenMetadata {
        string customImage;
        string customText;
        string eventName;
        uint256 eventDate;
        address minter;
    }

    // ========== MAPPINGS ==========

    mapping(uint256 => TokenMetadata) public tokenMetadata;
    mapping(uint256 => bool) public isFlagged;
    mapping(address => bool) public moderators;
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

        teamMinters[msg.sender] = true;
        moderators[msg.sender] = true;

        emit TeamMinterUpdated(msg.sender, true);
        emit ModeratorUpdated(msg.sender, true);
    }

    // ========== MODIFIERS ==========

    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    modifier supplyAvailable() {
        require(totalSupply() < MAX_SUPPLY, "Max supply reached");
        _;
    }

    modifier validEventDate(uint256 eventDate) {
        require(eventDate <= block.timestamp + MAX_FUTURE_EVENT_DATE, "Event date too far in future");
        require(eventDate >= block.timestamp - MAX_PAST_EVENT_DATE, "Event date too far in past");
        _;
    }

    // ========== PAUSABLE FUNCTIONS ==========

    function paused() public view returns (bool) {
        return _paused;
    }

    function pause() public onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    function unpause() public onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    // ========== INTERNAL HELPERS ==========

    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < _nextTokenId;
    }

    // ========== MINTING FUNCTIONS ==========

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

        uint256 refundAmount = msg.value - mintPrice;
        uint256 tokenId = _nextTokenId++;

        tokenMetadata[tokenId] = TokenMetadata({
            customImage: customImage,
            customText: customText,
            eventName: eventName,
            eventDate: eventDate,
            minter: msg.sender
        });

        emit Minted(msg.sender, tokenId, eventName);
        _safeMint(msg.sender, tokenId);

        if (refundAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund failed");
        }
    }

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

        uint256 tokenId = _nextTokenId++;

        tokenMetadata[tokenId] = TokenMetadata({
            customImage: customImage,
            customText: customText,
            eventName: eventName,
            eventDate: eventDate,
            minter: msg.sender
        });

        emit Minted(recipient, tokenId, eventName);
        _safeMint(recipient, tokenId);
    }

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

        for (uint256 i = 0; i < recipients.length; i++) {
            _safeMint(recipients[i], tokenIds[i]);
        }

        emit BatchMinted(msg.sender, recipients, tokenIds);
    }

    // ========== METADATA MANAGEMENT ==========

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

    function flagToken(uint256 tokenId, string memory reason) external {
        require(moderators[msg.sender], "Not authorized to moderate");
        require(_tokenExists(tokenId), "Token does not exist");
        require(!isFlagged[tokenId], "Token already flagged");
        require(bytes(reason).length > 0, "Reason required");

        isFlagged[tokenId] = true;
        emit TokenFlagged(tokenId, msg.sender, reason);
    }

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

    function unflagToken(uint256 tokenId) external onlyOwner {
        require(_tokenExists(tokenId), "Token does not exist");
        require(isFlagged[tokenId], "Token not flagged");

        isFlagged[tokenId] = false;
        emit TokenUnflagged(tokenId, msg.sender);
    }

    function setNSFWReplacementImage(string memory newNSFWImage) external onlyOwner {
        require(bytes(newNSFWImage).length > 0, "NSFW image URI cannot be empty");
        string memory oldURI = nsfwReplacementImage;
        nsfwReplacementImage = newNSFWImage;
        emit NSFWImageUpdated(oldURI, newNSFWImage);
    }

    function setModerator(address moderator, bool authorized) external onlyOwner {
        require(moderator != address(0), "Invalid moderator address");
        moderators[moderator] = authorized;
        emit ModeratorUpdated(moderator, authorized);
    }

    // ========== SOULBOUND IMPLEMENTATION ==========

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfers disabled");
        }

        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert("Soulbound: approvals disabled");
    }

    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert("Soulbound: approvals disabled");
    }

    // ========== METADATA GENERATION ==========

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_tokenExists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) != address(0), "Token was burned");

        TokenMetadata storage meta = tokenMetadata[tokenId];
        address owner = ownerOf(tokenId);
        string memory ownerStr = Strings.toHexString(uint160(owner), 20);
        string memory minterStr = Strings.toHexString(uint160(meta.minter), 20);

        string memory imageURI;
        if (isFlagged[tokenId]) {
            imageURI = nsfwReplacementImage;
        } else {
            imageURI = bytes(meta.customImage).length > 0 ? meta.customImage : baseImageURI;
        }

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

        return string(abi.encodePacked("data:application/json;utf8,", json));
    }

    // ========== ADMIN FUNCTIONS ==========

    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    function setTeamMinter(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        teamMinters[minter] = authorized;
        emit TeamMinterUpdated(minter, authorized);
    }

    function updateBaseImageURI(string memory newBaseImageURI) external onlyOwner {
        require(bytes(newBaseImageURI).length > 0, "Base image URI cannot be empty");
        string memory oldURI = baseImageURI;
        baseImageURI = newBaseImageURI;
        emit BaseImageURIUpdated(oldURI, newBaseImageURI);
    }

    function updateBaseAnimationURI(string memory newBaseAnimationURI) external onlyOwner {
        string memory oldURI = baseAnimationURI;
        baseAnimationURI = newBaseAnimationURI;
        emit BaseAnimationURIUpdated(oldURI, newBaseAnimationURI);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit NativeTokenWithdrawn(owner(), balance);
    }

    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit NativeTokenWithdrawn(owner(), balance);
    }

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

    function recoverERC721(address tokenAddress, uint256 tokenId) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenAddress != address(this), "Cannot recover own tokens");

        IERC721 token = IERC721(tokenAddress);
        require(token.ownerOf(tokenId) == address(this), "Contract doesn't own this token");

        token.safeTransferFrom(address(this), owner(), tokenId);

        emit ERC721Recovered(tokenAddress, owner(), tokenId);
    }

    // ========== VIEW FUNCTIONS ==========

    function isMintingActive() external view returns (bool) {
        return !_paused && totalSupply() < MAX_SUPPLY;
    }

    function getBaseImageURI() external view returns (string memory) {
        return baseImageURI;
    }

    function getBaseAnimationURI() external view returns (string memory) {
        return baseAnimationURI;
    }

    function getNSFWReplacementImage() external view returns (string memory) {
        return nsfwReplacementImage;
    }

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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
