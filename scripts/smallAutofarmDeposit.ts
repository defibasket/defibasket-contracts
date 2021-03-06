import {ethers} from "hardhat";
import constants from "../constants";
import {BigNumber} from "ethers";
import {MongoClient} from "mongodb";

const weiToString = (wei) => {
    return wei
        .div(
            BigNumber.from(10).pow(14)
        )
        .toNumber() / Math.pow(10, 4);
}

const getDeployedAddress = async (contractName, client) => {
    return (await client
        .db(process.env.MONGODB_DATABASE_NAME)
        .collection('contracts')
        .findOne(
            {
                'name': contractName
            }
        ))['address'];
}

async function main() {
    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    let defibasket = await ethers.getContractAt("DeFiBasket",
        await getDeployedAddress("DeFiBasket", client));

    let uniswapV2SwapBridge = await ethers.getContractAt("QuickswapSwapBridge",
        await getDeployedAddress("QuickswapSwapBridge", client));

    let aaveV2DepositBridge = await ethers.getContractAt("AaveV2DepositBridge",
        await getDeployedAddress("AaveV2DepositBridge", client));

    let wMaticBridge = await ethers.getContractAt("WMaticWrapBridge",
        await getDeployedAddress("WMaticWrapBridge", client));

    let quickswapLiquidityBridge = await ethers.getContractAt("QuickswapLiquidityBridge",
        await getDeployedAddress("QuickswapLiquidityBridge", client));

    let autofarm = await ethers.getContractAt("AutofarmDepositBridge",
        await getDeployedAddress("AutofarmDepositBridge", client));

    const [deployer] = await ethers.getSigners();
    const balanceBegin = await deployer.getBalance();
    console.log("Deploying from:", deployer.address);
    console.log("Account balance:", weiToString(balanceBegin));

    var _bridgeAddresses = [
        wMaticBridge.address,
        uniswapV2SwapBridge.address,
        uniswapV2SwapBridge.address,
        quickswapLiquidityBridge.address,
        autofarm.address,
    ];
    var _bridgeEncodedCalls = [
        wMaticBridge.interface.encodeFunctionData(
            "wrap",
            [
                100000
            ],
        ),
        uniswapV2SwapBridge.interface.encodeFunctionData(
            "swapTokenToToken",
            [
                50000,
                1,
                [TOKENS['WMAIN'], TOKENS['WETH']]
            ],
        ),
        uniswapV2SwapBridge.interface.encodeFunctionData(
            "swapTokenToToken",
            [
                50000,
                1,
                [TOKENS['WMAIN'], TOKENS['QUICK']]
            ],
        ),
        quickswapLiquidityBridge.interface.encodeFunctionData(
            "addLiquidity",
            [
                [TOKENS['WETH'], TOKENS['QUICK'],], // address[] tokens,
                [100000, 100000,], // uint256[] percentages,
                [1, 1,], // uint256[] minAmounts
            ],
        ),
        autofarm.interface.encodeFunctionData(
            "deposit",
            [
                8, // uint256 poolId
                100000, // uint256 percentageIn
            ],
        ),
    ];

    let startingNonce = await deployer.getTransactionCount();

    let overrides = {value: ethers.utils.parseEther("0.000001"), gasLimit:2000000, nonce:startingNonce};
    await defibasket.createPortfolio(
        {'tokens': [], 'amounts': []},
        _bridgeAddresses,
        _bridgeEncodedCalls,
        overrides
    );
    console.log("Mint succeeded:", weiToString(balanceBegin));
    console.log("Account balance:", weiToString(balanceBegin));

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
