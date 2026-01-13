// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IUnicornCredit - Interface for UnicornCredit token
/// @notice Extends IERC20 with burn functionality needed by UnicornEcosystem
interface IUnicornCredit is IERC20 {
    /// @notice Burns tokens from the caller's account
    /// @param amount Amount of tokens to burn
    function burn(uint256 amount) external;

    /// @notice Burns tokens from a specified account (requires approval)
    /// @param account Address to burn tokens from
    /// @param amount Amount of tokens to burn
    function burnFrom(address account, uint256 amount) external;

    /// @notice Check if an address is a team minter
    /// @param minter Address to check
    /// @return bool True if address is a team minter
    function teamMinters(address minter) external view returns (bool);

    /// @notice Get the current mint price
    /// @return uint256 Mint price in wei
    function mintPrice() external view returns (uint256);

    /// @notice Check if minting is active
    /// @return bool True if minting is active
    function isMintingActive() external view returns (bool);
}
