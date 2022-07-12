/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.8.10;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../core/IDAO.sol";
import "./AppStorage.sol";

// Free Function Approach...

// @dev Internal helper method to create a proxy contract based on the passed base contract address
// @param _logic The address of the base contract
// @param _data The constructor arguments for this contract
// @return addr The address of the proxy contract created
function createProxy(address _logic, bytes memory _data) returns(address payable addr) {
    return payable(address(new ERC1967Proxy(_logic, _data)));
}

contract UUPSProxy is ERC1967Proxy, AppStorage {
    constructor(
        address _dao,
        address _logic, 
        bytes memory _data
    ) ERC1967Proxy(_logic, _data) {
        if(_dao != address(0)) {
            setDAO(_dao);
        }
    }   
}