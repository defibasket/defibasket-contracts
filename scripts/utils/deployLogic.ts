import { ethers } from "hardhat";
import { readFileSync } from "fs";
import { MongoClient } from 'mongodb';

type DeployLogicProps = {
    networkName: string,
    contractName: string,
    filePath: string
}

const deployLogic = async ({ networkName, contractName, filePath } : DeployLogicProps):Promise<boolean> => {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();

        let mongoContract = await client
            .db('indexpool')
            .collection('contracts')
            .findOne(
                {
                    'name': contractName,
                    'networkName': networkName
                }
            );        
    
        if (mongoContract !== undefined) {
            console.log(`${contractName} is already deployed on ${networkName}. If you want to redeploy it, please undeploy it first.`)
            return Promise.resolve(false);
        }
    
        console.log(`Deploying ${contractName}...`);
        let contractInterface = await ethers.getContractFactory(contractName);
    
        const deployedContract = await contractInterface.deploy();
    
        console.log(`${contractName} contract deployed on ${networkName} at: ${deployedContract.address}`);
    
        const contractFile = readFileSync(
            filePath,
            'utf8')
        const contract = JSON.parse(contractFile)
    
        let insertData = {
            networkName: networkName,
            name: contractName,
            address: deployedContract.address,
            abi: contract['abi']
        }
    
        await client
            .db('indexpool')
            .collection('contracts')
            .insertOne(insertData);
        
        console.log(`${contractName} on ${networkName} inserted into DB.`)
    
        return Promise.resolve(true);
    } finally {
        await client.close();
    }

}

export default deployLogic;