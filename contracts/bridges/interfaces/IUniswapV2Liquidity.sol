pragma solidity ^0.8.6;

interface IUniswapV2Liquidity {

    event INDEXPOOL_LIQUIDITY_ADD(
        address[] assetIn,
        uint256[] amountIn,
        address lpToken,
        uint256 liquidity
    );

    event INDEXPOOL_LIQUIDITY_REMOVE(
        address[] tokens,
        uint256[] amountOut,
        address lpToken,
        uint256 liquidity
    );

    function addLiquidity(
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[] calldata minAmounts
    ) external;

    function removeLiquidity(
        address[] calldata tokens,
        uint256 percentage,
        uint256[] calldata minAmounts
    ) external;
}