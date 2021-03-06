// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IUniswapV2Swap {
    event DEFIBASKET_UNISWAPV2_SWAP(
        uint256[] amounts
    );

    function swapTokenToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) external;
}
