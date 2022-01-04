import fetch from 'node-fetch';
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
    let owner;
    let other;
    let zeroXSwapBridge;
    let wallet;


    const ADDRESSES = constants["POLYGON"];
    const TOKENS = constants["POLYGON"]["TOKENS"];

    // Get 2 signers to enable to test for permission rights
    [owner] = await ethers.getSigners();

    let startingNonce = await owner.getTransactionCount();

    console.log('deploy wallet', owner.getAddress())

    // Instantiate Wallet
    wallet = await ethers.getContractAt("Wallet", "0xF769fAF86D97Ad387240900BA6336cbe8fdC6f3B");

    console.log('deploy 0x bridge', owner.address)

    // Instantiate 0x bridge
    zeroXSwapBridge = await ethers.getContractAt(
        "ZeroXSwapBridge","0xd15c7C5c469C8F0807c59b8Bd10fDf485129f368"
    );

    // Transfer money to wallet (similar as DeFi Basket contract would have done)

    let req_0x = await fetch("https://polygon.api.0x.org/swap/v1/quote?buyToken=0x8f3cf7ad23cd3cadbd9735aff958023239c6a063&sellToken=MATIC&sellAmount=100000000000000000")
    let data_0x = await req_0x.json()

    const _bridgeEncodedCalls = [zeroXSwapBridge.interface.encodeFunctionData(
        "swapETH",
        [
            ethers.utils.parseEther("0.001"),
            [data_0x['data']]
        ],
    )]

    // const transactionHash = await owner.sendTransaction({
    //     to: wallet.address,
    //     value: ethers.utils.parseEther("0.001"), //
    //     nonce: startingNonce // Sends exactly 1.0 ether
    // });

    let overrides = {gasLimit:1000000, nonce: startingNonce };

    console.log('tx sent')
    await wallet.useBridges([zeroXSwapBridge.address], _bridgeEncodedCalls, overrides);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

