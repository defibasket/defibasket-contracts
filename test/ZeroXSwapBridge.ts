import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";
import { getFirstEvent } from "./utils";
import fetch from 'node-fetch';

describe("ZeroXSwapBridge", function () {
  let owner;
  let other;
  let zeroXSwapBridge;
  let wallet;

  const ADDRESSES = constants["POLYGON"];
  const TOKENS = constants["POLYGON"]["TOKENS"];
  const TOKEN_TO_TEST = "USDT";

  beforeEach(async function () {
    // Get 2 signers to enable to test for permission rights
    [owner, other] = await ethers.getSigners();

    // Instantiate Wallet
    let Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy();

    // Instantiate 0x bridge
    let ZeroXSwapBridgeFactory = await ethers.getContractFactory(
        "ZeroXSwapBridge"
    );
    zeroXSwapBridge = await ZeroXSwapBridgeFactory.deploy();

    // Transfer money to wallet (similar as DeFi Basket contract would have done)
    const transactionHash = await owner.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
    });
    await transactionHash.wait();
  });

  describe("Actions", function () {
    it("Test API", async function () {
      let req_0x = await fetch(`https://polygon.api.0x.org/swap/v1/quote?buyToken=0x8f3cf7ad23cd3cadbd9735aff958023239c6a063&sellToken=MATIC&sellAmount=1000000000000000000`)
      let data_0x = await req_0x.json()

      const _bridgeEncodedCalls = [zeroXSwapBridge.interface.encodeFunctionData(
          "swapETH",
          [
            ethers.utils.parseEther("1"),
            data_0x['data']
          ],
      )]

      let token = await ethers.getContractAt(
          "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
          "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"
      );

      await wallet.useBridges([zeroXSwapBridge.address], _bridgeEncodedCalls);

    // Wallet token amount should be 0

      let tokenBalance = await token.balanceOf(wallet.address);
      expect(tokenBalance).to.be.above(0);
    });
  });
});
