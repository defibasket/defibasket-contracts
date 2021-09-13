pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAutofarmV2_CrossChain.sol";

/**
 * @title AutofarmDepositBridge
 * @author IndexPool
 *
 * @notice Deposits, withdraws and harvest rewards from AutofarmV2_CrossChain contract in Polygon.
 *
 * @dev This contract has 3 main functions:
 *
 * 1. Deposit in AutofarmV2_CrossChain (example: QUICK/ETH -> autofarm doesn't return a deposit token)
 * 2. Withdraw from AutofarmV2_CrossChain
 * 3. Harvest rewards from deposits (it is a withdraw of value 0)
 *
 */

contract AutofarmDepositBridge {
    // Hardcoded to make less variables needed for the user to check (UI will help explain/debug it)
    address constant autofarmAddress = 0x89d065572136814230A55DdEeDDEC9DF34EB0B76;
    address constant pAutoAddress = 0x7f426F6Dc648e50464a0392E60E1BB465a67E9cf;
    address constant wMaticAddress = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;

    /**
      * @notice Deposits into the Autofarm protocol.
      *
      * @dev Wraps the Autofarm deposit and generate the necessary events to communicate with IndexPool's UI and back-end.
      *
      * @param assetIn Address of the asset to be deposited into the Autofarm protocol
      * @param percentageIn Percentage of the balance of the asset that will be deposited
      */
    function deposit(address assetIn, uint256 percentageIn, uint256 poolId) external override {
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);

        uint256 amountIn = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(autofarmAddress, 0);
        IERC20(assetIn).approve(autofarmAddress, amountIn);

        autofarm.deposit(poolId, amountIn);

        // emit INDEXPOOL_STAKE_IN(assetIn, amountIn);
    }

    /**
      * @notice Withdraws from the Autofarm protocol.
      *
      * @dev Wraps the Autofarm withdraw and generate the necessary events to communicate with IndexPool's UI and
      * back-end.
      *
      * @param assetOut Address of the asset to be withdrawn from the Autofarm protocol
      * @param percentageOut Percentage of the balance of the asset that will be withdrawn
      */
    function withdraw(address assetOut, uint256 percentageOut, uint256 poolId) external override {
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);

        uint256 wMaticBalance = IERC20(wMaticAddress).balanceOf(address(this));
        uint256 pAutoBalance = IERC20(pAutoAddress).balanceOf(address(this));

        uint256 amountOut = autofarm.stakedWantTokens(poolId, address(this)) * percentageOut / 100000;
        autofarm.withdraw(poolId, amountOut);

        // emit INDEXPOOL_STAKE_OUT(assetOut, amountOut);

        // WMatic
        uint256 wMaticReward = IERC20(pAutoAddress).balanceOf(address(this)) - wMaticBalance;
        // emit INDEXPOOL_STAKE_OUT(wMaticAddress, wMaticReward);

        // PAuto
        uint256 pAutoReward = IERC20(pAutoAddress).balanceOf(address(this)) - pAutoBalance;
        // emit INDEXPOOL_STAKE_OUT(wMaticAddress, pAutoReward);
    }
}
