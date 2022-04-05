/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "./Permissions.sol";
import "../erc165/AdaptiveERC165.sol";
import "./../acl/ACL.sol";
import "./../IDAO.sol";

/// @title Base component in the Aragon DAO framework
/// @author Samuel Furter - Aragon Association - 2021
/// @notice Any component within the Aragon DAO framework has to inherit from this contract
abstract contract Component is UUPSUpgradeable, AdaptiveERC165, Permissions {
    
    /// @notice Role identifier to upgrade a component 
    bytes32 public constant UPGRADE_ROLE = keccak256("UPGRADE_ROLE");

    /// @dev Used for UUPS upgradability pattern
    function __Component_init(IDAO _dao) internal virtual {
    function __Component_init(IDAO _dao) internal virtual initializer {
        __Permission_init(_dao);

        _registerStandard(type(Component).interfaceId);
    }

    /// @dev Used to check the permissions within the upgradability pattern implementation of OZ
    function _authorizeUpgrade(address) internal virtual override auth(UPGRADE_ROLE) { }

    /// @dev Fallback to handle future versions of the ERC165 standard.
    fallback () external {
        _handleCallback(msg.sig, _msgData()); // WARN: does a low-level return, any code below would be unreacheable
    }
}
