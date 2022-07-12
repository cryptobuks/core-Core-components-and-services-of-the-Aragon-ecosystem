/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.8.10;

import "./UnstructuredStorage.sol";
import "../core/IDAO.sol";

contract AppStorage {
    using UnstructuredStorage for bytes32;

    /* Hardcoded constants to save gas
    bytes32 internal constant KERNEL_POSITION = keccak256("aragonOS.appStorage.kernel");
    */
    bytes32 internal constant DAO_POSITION = 0x4172f0f7d2289153072b0a6ca36959e0cbe2efc3afe50fc81636caa96338137b;

    function dao() public view returns (IDAO) {
        return IDAO(DAO_POSITION.getStorageAddress());
    }
    function setDAO(address _dao) internal {
        DAO_POSITION.setStorageAddress(_dao);
    }
}