// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import "../plugin/PluginManager.sol";
import "./MajorityVotingMock.sol";
import "../utils/Proxy.sol";

contract PluginManagerMock is PluginManager {
    address public basePluginAddress;

    constructor() {
        basePluginAddress = address(new MajorityVotingMock());
    }

    function getImplementationAddress() public view virtual override returns (address) {
        return basePluginAddress;
    }

    function install(address _dao, bytes memory _data) external virtual override {}

    function getInstallPermissionOps(uint256 _nonce)
        external
        view
        virtual
        override
        returns (BulkPermissionsLib.ItemMultiTarget[] memory)
    {}

    function getUninstallPermissionOps(uint256 _nonce)
        external
        view
        virtual
        override
        returns (BulkPermissionsLib.ItemMultiTarget[] memory)
    {}
}
