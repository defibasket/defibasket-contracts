pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {ILendingPool} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import {ILendingPoolAddressesProvider} from "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import {IAaveIncentivesController} from "../interfaces/IAaveIncentivesController.sol";
import "hardhat/console.sol";

contract AaveV2DepositBridge {
    event Deposit (
        address assetIn,
        uint256 amountIn,
        address assetOut,
        uint256 amountOut
    );
    event Withdraw (
        address asset,
        uint256 amount,
        address claimedAssets,
        uint256 claimedRewards
    );

    function deposit(address assetIn, uint256 percentage)
        public
        payable
    {
        // Hardcoded to make call easier to understand for the user (UI will help explain/debug it)
        address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;

        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);

        uint256 amountIn = IERC20(assetIn).balanceOf(address(this)) * percentage / 100000;
        IERC20(assetIn).approve(aaveLendingPoolAddress, amountIn);
        _aaveLendingPool.deposit(assetIn, amountIn, address(this), 0);

        address assetOut = _aaveLendingPool.getReserveData(assetIn).aTokenAddress;
        uint256 amountOut = IERC20(assetOut).balanceOf(address(this)); // TODO do final balance - initial balance

        emit Deposit(
            assetIn,
            amountIn,
            assetOut,
            amountOut
        );
    }

    function withdraw(
        address asset, // DAI
        address[] calldata assets, // amDAI
        uint256 percentage
    ) public payable {
        // Hardcoded to make call easier to understand for the user (UI will help explain/debug it)
        address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;

        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);

        address incentivesControllerAddress = 0x357D51124f59836DeD84c8a1730D72B749d8BC23;
        IAaveIncentivesController distributor = IAaveIncentivesController(
            incentivesControllerAddress
        );
        uint256 amountToClaim = distributor.getRewardsBalance(
            assets,
            address(this)
        );
        uint256 claimedReward = distributor.claimRewards(assets, amountToClaim, address(this));

        uint256 balance = IERC20(assets[0]).balanceOf(address(this)) * percentage / 100000;
        _aaveLendingPool.withdraw(asset, balance, address(this));

        // TODO check if we can get the claimedAsset address from the distributor
        address claimedAsset = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270; // WMATIC address

        emit Withdraw(
            asset,
            balance,
            claimedAsset,
            claimedReward
        );
    }

    // function viewHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }

    // function viewEthHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }
}
