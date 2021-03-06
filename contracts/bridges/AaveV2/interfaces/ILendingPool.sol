// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import {DataTypes} from '../libraries/DataTypes.sol';

interface ILendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;

    function withdraw(address asset, uint256 amount, address to) external returns (uint256);

    function getReserveData(address asset) external view returns (DataTypes.ReserveData memory);
}
