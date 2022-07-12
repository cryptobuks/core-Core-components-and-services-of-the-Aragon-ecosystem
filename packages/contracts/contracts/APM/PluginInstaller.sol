/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.8.10;

import "../APM/IPluginFactory.sol";
import "./../core/DAO.sol";
import "../utils/UncheckedIncrement.sol";
import "../utils/UUPSProxy.sol";

interface ENS {

}
/// @title PluginInstaller to install packages on a DAO.
/// @author Sarkawt Noori - Aragon Association - 2022
/// @notice This contract is used to create/deploy new packages and instaling them on a DAO.
contract PluginInstaller {
    
    address public tokenFactory;
    ENS public ens;

    /**
    NOTE: better aproach might be to have a permission ops like:

    struct PermissionOp {
        PermissionType permissionType;
        bytes32[] roles;
        address where;
        address who;
    }

    to be used inside Packages like:

    struct Package {
        address factoryAddress; // package deployer (factory) address, hopefully from APM
        PermissionOp[] PermissionOps; 
        bytes args; // pre-determined value for stting up the package
    }

    for futher improvment and relationship between apps, utilizing AppArray and indexes

     */
    struct Package {
        bool isGovernanceTokenNeeded; // is governance erc20 token is need by package factory address
        address factoryAddress; // package deployer (factory) address, hopefully from APM
        bytes32[] PackagePermissions; // to be granted to DAO
        bytes32[] DAOPermissions; // Dao permission to be granted to package like: exec_role
        bytes args; // pre-determined value for stting up the package
    }

    struct Pack {
        bytes32 node; // namehash of the plugin (e.x - finance.aragonpm.eth) on the ens
    }

    event PluginInstalled(address indexed dao, address indexed pluginAddress);

    error NoRootRole();

    constructor(address _tokenFactory, address _ens) {
        tokenFactory = _tokenFactory;
        ens = ENS(_ens);
    }

    function installPluginsOnExistingDAO(DAO dao, Package[] calldata packages) external {
        if (!dao.hasPermission(address(dao), address(this), dao.ROOT_ROLE(), bytes("0x00"))) revert NoRootRole();
        installPlugins(dao, packages);
        dao.revoke(address(dao), address(this), dao.ROOT_ROLE());
    }

    function installPlugins(DAO dao, Pack[] calldata packages) public {
        for (uint256 i = 0; i < packages.length; i++) {
            bytes32 node = packages[i].node;
            address repo = ens.resolve(node).addr(node);
            address baseImplementation = repo.getLatest();
            address proxy = new UUPSProxy(dao, baseImplementation, packages[i].args);

            emit PluginInstalled(dao, proxy);
        }
    }


    function _installPlugin(DAO dao, Package calldata package) internal returns (address app) {
        // revoke root from TokenFactory
        if (package.isGovernanceTokenNeeded) {
            dao.grant(address(dao), address(tokenFactory), dao.ROOT_ROLE());
        }

        // TODO: Retrive data from APM once APM is ready

        // deploy new packaes for Dao
        app = IPluginFactory(package.factoryAddress).deploy(address(dao), package.args);

        // revoke root from TokenFactory
        if (package.isGovernanceTokenNeeded) {
            dao.revoke(address(dao), address(tokenFactory), dao.ROOT_ROLE());
        }

        // Grant dao the necessary permissions on the package
        ACLData.BulkItem[] memory packageItems = new ACLData.BulkItem[](package.PackagePermissions.length);
        for (uint256 i; i < package.PackagePermissions.length; i = _uncheckedIncrement(i)) {
            packageItems[i] = ACLData.BulkItem(ACLData.BulkOp.Grant, package.PackagePermissions[i], address(dao));
        }
        dao.bulk(app, packageItems);

        // Grant Package the necessary permissions on the DAO
        ACLData.BulkItem[] memory daoItems = new ACLData.BulkItem[](package.DAOPermissions.length);
        for (uint256 i; i < package.DAOPermissions.length; i = _uncheckedIncrement(i)) {
            daoItems[i] = ACLData.BulkItem(ACLData.BulkOp.Grant, package.DAOPermissions[i], app);
        }
        dao.bulk(address(dao), daoItems);

        emit PluginInstalled(address(dao), address(app));
    }
}
