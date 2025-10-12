// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// ========== MOCK CONTRACTS FOR TESTING ==========

/// @title MockERC20
/// @notice Standard ERC20 for testing token recovery
contract MockERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}

/// @title MockERC721
/// @notice Standard ERC721 for testing NFT recovery
contract MockERC721 is ERC721 {
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}
    
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}

/// @title NonStandardERC20
/// @notice ERC20 that returns false instead of reverting (old token standard)
/// @dev Used to test SafeERC20 compatibility
contract NonStandardERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    uint256 public totalSupply;
    string public name = "Non-Standard Token";
    string public symbol = "NST";
    uint8 public decimals = 18;
    
    constructor() {
        totalSupply = 1000000 * 10**18;
        balanceOf[msg.sender] = totalSupply;
    }
    
    // Returns false on failure instead of reverting
    function transfer(address to, uint256 amount) external returns (bool) {
        if (balanceOf[msg.sender] < amount) {
            return false; // Old tokens returned false instead of reverting
        }
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (balanceOf[from] < amount || allowance[from][msg.sender] < amount) {
            return false;
        }
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

/// @title ReentrancyAttacker
/// @notice Malicious contract that attempts reentrancy on withdraw
contract ReentrancyAttacker {
    address public target;
    uint256 public attackCount;
    
    constructor(address _target) {
        target = _target;
    }
    
    receive() external payable {
        if (attackCount < 3) {
            attackCount++;
            // Try to reenter withdraw()
            (bool success, ) = target.call(abi.encodeWithSignature("withdraw()"));
            require(success, "Reentry failed");
        }
    }
    
    function attack() external payable {
        (bool success, ) = target.call{value: msg.value}(
            abi.encodeWithSignature("withdraw()")
        );
        require(success, "Initial call failed");
    }
}

/// @title MaliciousERC20
/// @notice ERC20 that attempts reentrancy on transfer
contract MaliciousERC20 {
    address public target;
    mapping(address => uint256) public balanceOf;
    
    constructor(address _target) {
        target = _target;
        balanceOf[_target] = 1000 * 10**18;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        // Attempt reentrancy
        (bool success, ) = target.call(
            abi.encodeWithSignature("recoverERC20(address,uint256)", address(this), 0)
        );
        
        // Even if reentrancy fails, complete the transfer
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @title MaliciousERC721  
/// @notice ERC721 that attempts reentrancy on transfer
contract MaliciousERC721 is ERC721 {
    address public target;
    
    constructor(address _target) ERC721("Malicious NFT", "MNFT") {
        target = _target;
        _mint(_target, 1);
    }
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override {
        super._afterTokenTransfer(from, to, firstTokenId, batchSize);
        
        // Attempt reentrancy during transfer
        if (from == target && attackCount < 2) {
            attackCount++;
            (bool success, ) = target.call(
                abi.encodeWithSignature("recoverERC721(address,uint256)", address(this), 2)
            );
        }
    }
    
    uint256 private attackCount;
}

/// @title FakeERC20
/// @notice Contract that pretends to be ERC20 but isn't
contract FakeERC20 {
    // Implements balanceOf but returns garbage
    function balanceOf(address) external pure returns (uint256) {
        revert("I'm not a real token!");
    }
}

/// @title MaliciousReceiver
/// @notice Contract that attacks via onERC721Received callback
contract MaliciousReceiver {
    address public target;
    uint256 public attackCount;
    
    constructor(address _target) {
        target = _target;
    }
    
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external returns (bytes4) {
        if (attackCount < 2) {
            attackCount++;
            // Try to reenter
            (bool success, ) = target.call(
                abi.encodeWithSignature("recoverERC721(address,uint256)", msg.sender, 1)
            );
        }
        return this.onERC721Received.selector;
    }
}

/// @title GasGriefingToken
/// @notice Token that consumes excessive gas to DoS recovery
contract GasGriefingToken {
    mapping(address => uint256) public balanceOf;
    
    constructor() {
        balanceOf[msg.sender] = 1000000;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        // Waste gas in a loop
        for (uint i = 0; i < 10000; i++) {
            // Expensive operation
            balanceOf[address(uint160(i))] = i;
        }
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @title OwnerlessERC721
/// @notice NFT that doesn't implement ownerOf correctly
contract OwnerlessERC721 {
    function ownerOf(uint256) external pure returns (address) {
        revert("No owner for this token");
    }
    
    function safeTransferFrom(address, address, uint256) external pure {
        revert("Cannot transfer");
    }
}

/// @title RevertingERC721
/// @notice NFT that reverts on safeTransferFrom
contract RevertingERC721 is ERC721 {
    constructor() ERC721("Reverting NFT", "RNFT") {
        _mint(msg.sender, 1);
    }
    
    function safeTransferFrom(
        address,
        address,
        uint256
    ) public pure override {
        revert("Transfer not allowed");
    }
    
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert("Transfer not allowed");
    }
}