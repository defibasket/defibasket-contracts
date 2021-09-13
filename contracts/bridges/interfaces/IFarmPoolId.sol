pragma solidity ^0.8.6;

interface IFarmPoolId {

    event INDEXPOOL_FARM_IN (
        address vaultAddress,
        address assetIn,
        uint256 amountIn
    );

    event INDEXPOOL_FARM_OUT (
        address vaultAddress,
        address assetOut,
        uint256 amountOut,
        uint256 wMaticReward,
        uint256 pAutoReward
    );

    function deposit(uint256 percentageIn, uint256 poolId) external;

    function withdraw(uint256 percentageOut, uint256 poolId) external;
}


