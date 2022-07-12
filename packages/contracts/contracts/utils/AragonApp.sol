
/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.8.10;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

import "../core/IDAO.sol";
import "../core/acl/ACL.sol";

import "./AppStorage.sol";

contract AragonApp is AppStorage, UUPSUpgradeable, ContextUpgradeable {
    bytes32 public constant UPGRADE_ROLE = keccak256("UPGRADE_ROLE");

     /// @dev Used to check the permissions within the upgradability pattern implementation of OZ
    function _authorizeUpgrade(address) internal virtual override auth(UPGRADE_ROLE) { }

    /// @dev Auth modifier used in all components of a DAO to check the permissions.
    /// @param _role The hash of the role identifier
    modifier auth(bytes32 _role)  {
        IDAO dao = dao(); 
        if(!dao.hasPermission(address(this), _msgSender(), _role, _msgData())) {
            revert ACLData.ACLAuth({
                here: address(this), 
                where: address(this), 
                who: _msgSender(), 
                role: _role
            });
        }
        _;
    }
}