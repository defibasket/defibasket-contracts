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
        .db('indexpool')
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

    let indexPool = await ethers.getContractAt("IndexPool",
        await getDeployedAddress("IndexPool", client));

    let uniswapV2SwapBridge = await ethers.getContractAt("QuickswapSwapBridge",
        await getDeployedAddress("QuickswapSwapBridge", client));

    let aaveV2DepositBridge = await ethers.getContractAt("AaveV2DepositBridge",
        await getDeployedAddress("AaveV2DepositBridge", client));

    const [deployer] = await ethers.getSigners();
    const balanceBegin = await deployer.getBalance();
    console.log("Deploying from:", deployer.address);
    console.log("Account balance:", weiToString(balanceBegin));

    const _bridgeAddresses = [
        aaveV2DepositBridge.address,
        uniswapV2SwapBridge.address,
    ];
    const _bridgeEncodedCalls = [
        aaveV2DepositBridge.interface.encodeFunctionData(
            "withdraw",
            [
                TOKENS['DAI'],
                100000
            ]
        ),
        uniswapV2SwapBridge.interface.encodeFunctionData(
            "tradeFromTokenToETH",
            [
                ADDRESSES['UNISWAP_V2_ROUTER'],
                100000,
                1,
                [
                    TOKENS['DAI'],
                    TOKENS['WMAIN']
                ]
            ],
        ),
    ];

    await indexPool.withdrawPortfolio(
        3,
        {'tokens': [], 'amounts': []},
        100000,
        _bridgeAddresses,
        _bridgeEncodedCalls,
        {gasLimit: 600000}
    );

    console.log("Withdraw succeeded:", weiToString(balanceBegin));
    console.log("Account balance:", weiToString(balanceBegin));

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });