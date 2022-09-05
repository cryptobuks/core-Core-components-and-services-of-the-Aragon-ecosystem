// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import {PermissionManager} from "../permission/PermissionManager.sol";

import {IDAO} from "../IDAO.sol";
import {DaoAuthorizable} from "../component/DaoAuthorizable.sol";
import {AppStorage} from "../../utils/AppStorage.sol";

/// @title PluginClones
/// @notice An abstract contract to inherit from when creating a proxy contract.
/// This should be used to deploy EIP-1167 clones.
abstract contract PluginClones is Initializable, ERC165, Context, AppStorage {
    bytes4 public constant PLUGIN_INTERFACE_ID = type(PluginClones).interfaceId;

    /// @notice used by the deployer of the plugin to call.
    /// @dev plugin's own initialize function can't have the initializer with the same version(1)
    /// @param _dao the dao address to set in a slot.
    /// IMPORTANT: Must be called after the plugin's own initialize is called ONLY 
    // if it also uses OZ's initializable
    function clonesInit(address _dao) external reinitializer(2) {
        setDAO(_dao);
    }

    /// @dev Auth modifier used in all components of a DAO to check the permissions.
    /// @param _permissionId The hash of the permission identifier
    modifier auth(bytes32 _permissionId) {
        IDAO dao = dao();
        if (!dao.hasPermission(address(this), _msgSender(), _permissionId, _msgData())) {
            revert PermissionManager.Unauthorized({
                here: address(this),
                where: address(this),
                who: _msgSender(),
                permissionId: _permissionId
            });
        }
        _;
    }

    /// @notice adds a IERC165 to check whether contract supports PluginClones interface or not.
    /// @dev See {ERC165Upgradeable-supportsInterface}.
    /// @return bool whether it supports the IERC165 or PluginClones
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == PLUGIN_INTERFACE_ID || super.supportsInterface(interfaceId);
    }
}
