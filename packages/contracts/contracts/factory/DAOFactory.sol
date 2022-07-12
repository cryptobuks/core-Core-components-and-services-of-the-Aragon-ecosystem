/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./../tokens/GovernanceERC20.sol";
import "./../tokens/GovernanceWrappedERC20.sol";
import "./../registry/Registry.sol";
import "../tokens/MerkleMinter.sol";
import "../APM/PluginInstaller.sol";
import "../utils/UncheckedIncrement.sol";

import "../utils/UUPSProxy.sol";

import "../votings/VotingTest.sol";

/// @title DAOFactory to create a DAO
/// @author Giorgi Lagidze & Samuel Furter - Aragon Association - 2022
/// @notice This contract is used to create a DAO.
contract DAOFactory {
    using Address for address;
    using Clones for address;

    address public daoBase;

    Registry public registry;
    PluginInstaller public pluginInstaller;

    struct DAOConfig {
        string name;
        bytes metadata;
        address gsnForwarder;
    }

    // @dev Stores the registry and token factory address and creates the base contracts required for the factory
    // @param _registry The DAO registry to register the DAO with his name
    // @param _tokenFactory The Token Factory to register tokens
    constructor(Registry _registry) {
        registry = _registry;
        pluginInstaller = _pluginInstaller;

        setupBases();
    }

    function createDAO(DAOConfig calldata _daoConfig)
        external
        returns (DAO dao)
    {
        // create a DAO
        dao = _createDAO(_daoConfig);

        VotingTest t = new VotingTest();

        // UUPSProxy proxy = new UUPSProxy(address(dao), address(t), bytes(""));

        // grant root permission to PluginInstaller
        dao.grant(address(dao), address(pluginInstaller), dao.ROOT_ROLE());

        // install packages
        pluginInstaller.installPlugins(dao, packages);

        // setup dao permissions
        setDAOPermissions(dao);
    }

    // @dev Creates a new DAO.
    // @oaram _daoConfig The name and metadata hash of the DAO it creates
    // @param _gsnForwarder The forwarder address for the OpenGSN meta tx solution
    function _createDAO(DAOConfig calldata _daoConfig) internal returns (DAO dao) {
        // create dao
        dao = DAO(createProxy(daoBase, bytes("")));
        // initialize dao with the ROOT_ROLE as DAOFactory
        dao.initialize(_daoConfig.metadata, address(this), _daoConfig.gsnForwarder);
        // register dao with its name and token to the registry
        registry.register(_daoConfig.name, dao, msg.sender);
    }

    // @dev Does set the required permissions for the new DAO.
    // @param _dao The DAO instance just created.
    // @param _voting The voting contract address (whitelist OR ERC20 voting)
    function setDAOPermissions(DAO _dao) internal {
        // set roles on the dao itself.
        ACLData.BulkItem[] memory items = new ACLData.BulkItem[](8);

        // Grant DAO all the permissions required
        items[0] = ACLData.BulkItem(ACLData.BulkOp.Grant, _dao.DAO_CONFIG_ROLE(), address(_dao));
        items[1] = ACLData.BulkItem(ACLData.BulkOp.Grant, _dao.WITHDRAW_ROLE(), address(_dao));
        items[2] = ACLData.BulkItem(ACLData.BulkOp.Grant, _dao.UPGRADE_ROLE(), address(_dao));
        items[3] = ACLData.BulkItem(ACLData.BulkOp.Grant, _dao.ROOT_ROLE(), address(_dao));
        items[4] = ACLData.BulkItem(ACLData.BulkOp.Grant, _dao.SET_SIGNATURE_VALIDATOR_ROLE(), address(_dao));
        items[5] = ACLData.BulkItem(ACLData.BulkOp.Grant, _dao.MODIFY_TRUSTED_FORWARDER(), address(_dao));

        // Revoke permissions from factory
        items[6] = ACLData.BulkItem(ACLData.BulkOp.Revoke, _dao.ROOT_ROLE(), address(this));
        // Revoke permissions from PluginInstaller
        items[7] = ACLData.BulkItem(ACLData.BulkOp.Revoke, _dao.ROOT_ROLE(), address(pluginInstaller));

        _dao.bulk(address(_dao), items);
    }

    // @dev Internal helper method to set up the required base contracts on DAOFactory deployment.
    function setupBases() private {
        daoBase = address(new DAO());

    }
}




// APMRegistryFactory
//     1. createS a dao
//     2. CREATE APMRegistry proxy and install on the dao.
//     3. Let's say 3rd-party user wrote Finance contract ! Now he calls APMRegistry's newRepoWithVersion 
//         * creates a Repo contract
//         * At this point, on the ENSRegistry, there's aragonpm.eth domain created which has the owner `ENSSubdomainRegistrar`.
//         * on the ENSRegistry contract, it now creates finance.aragonpm.eth domain and sets its owner as `ENSSubdomainRegistrar` again
//         and sets its resolver as PUBLIC_RESOLVER(a contract). On that PUBLIC_RESOLVER, it sets created repo as its addr.
//         so basically, if we fetch finance.aragonpm.eth from ENSRegistry, it will return PUBLIC_RESOLVER contract and on this contract,
//         if we fetch finance.aragonpm.eth's address, it will return repo address. 
//     4. from the dao-templates(Company Template), it creates a dao
//        * then it installs plugins(finance, vault, ...) the way it does is first, it fetches finance.aragonpm.eth's addr from ENS
//        that returns repo and from the repo, repo.getLatest() that finally returns the latest base implementation of finance contract.
//        * creates proxy from this base finance contract and calls setApp on the dao
//             setApp => apps[APP_NAMESPACE][namehash(finance.aragonpm.eth)] = finance base contract 
//         * if something gets called on the finance proxy, finance proxy has Kernel(dao) and its app id(namehash(finance.aragonpm.eth))
//         stored on it. so it first calls Kernel(dao)'s getApp with the app id, gets finance base contract address and then delegates call to it.
//     5. When the update is necessary on finance, finance's repo owner pushes new base address on the repo. then through voting,
//     when it passes, `setApp` is called on the kernel(dao) that updates the base address.

