/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "../utils/AragonApp.sol";

contract VotingTest is AragonApp {
    bytes32 public constant TEST_ROLE = keccak256("TEST_ROLE");

    function test() public auth(TEST_ROLE) {

    }
}
