import { MongoClient } from 'mongodb';
const hre = require("hardhat");
const prompts = require("prompts");

async function main() {
    const networkName = hre.hardhatArguments.network;

    if (networkName === undefined) {
        console.log('Please set a network before deploying :D');
        return;
    }

    const response = await prompts(
        [
            {
                type: 'text',
                name: 'confirm1',
                message: `Are you sure you want to undeploy contracts from ${networkName}? Type Guybrush Threepwood to confirm.`,
                initial: ''
            },
            {
                type: 'confirm',
                name: 'confirm2',
                message: `Really really?`,
                initial: false
            }
        ]
    )
    if (response.confirm1 != 'Guybrush Threepwood' || !response.confirm2) {
        console.log('Aborted');
        return;
    }

    console.log(`Undeploying all contracts from ${networkName}`);

    const client = await MongoClient.connect(process.env.MONGODB_URI);
    await client.connect();

    // TODO should we create a backup of what is being undeployed?
    //  ... set active to false and change name to not conflict with unique index
    await client
        .db(process.env.MONGODB_DATABASE_NAME)
        .collection('contracts')
        .deleteMany(
            {
                networkName: networkName
            }
        );

    await client
        .db(process.env.MONGODB_DATABASE_NAME)
        .collection('transactions')
        .deleteMany(
            {
                networkName: networkName
            }
        );

    await client
        .db(process.env.MONGODB_DATABASE_NAME)
        .collection('portfolios')
        .deleteMany(
            {
                networkName: networkName
            }
        );

    console.log("Undeploy is done :D");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
