import { expect } from "chai";
import { ethers } from "hardhat";

describe("Oracle", function () {

  let owner;
  let oracle;

  let Pool;
  let hardhatPool;

  const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
  const ONEINCH_TOKEN = "0x111111111117dc0aa78b770fa6a738034120c302";
  const LINK_TOKEN = "0x514910771af9ca656af840dff83e8264ecf986ca";
  const CRYTPOCOM_TOKEN = "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b";
  const SYNTHETIX_TOKEN = "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f";
  const COMPOUND_TOKEN = "0xc00e94cb662c3520282e6f5717214004a7f26888";
  const GRAPH_TOKEN = "0xc944e90c64b2c07662a292be6244bdf05cda44a7";
  const DEV_TOKEN = "0x5cAf454Ba92e6F2c929DF14667Ee360eD9fD5b26";
  const RLC_TOKEN = "0x607F4C5BB672230e8672085532f7e901544a7375";
  const SUSHI_TOKEN = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const ETH = "0x0000000000000000000000000000000000000000";

  const tokens = [UNI_TOKEN, ONEINCH_TOKEN, LINK_TOKEN, CRYTPOCOM_TOKEN, SYNTHETIX_TOKEN,
    COMPOUND_TOKEN, GRAPH_TOKEN, DEV_TOKEN, RLC_TOKEN, SUSHI_TOKEN, ETH]

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    let Oracle = await ethers.getContractFactory("OraclePath");

    oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner);

    await oracle.updateOracles([WETH, UNI_TOKEN]);
    await oracle.updateOracles([WETH, UNI_TOKEN]);

    await oracle.consult([WETH, UNI_TOKEN]);

    Pool = await ethers.getContractFactory("Pool");

    hardhatPool = (await Pool.deploy(UNI_ROUTER, oracle.address)).connect(owner)

    await hardhatPool.create_index(
      tokens.map(() => 1000000000),  // uint256[] _allocation,
      tokens, // address[] _tokens
      tokens.map(x => [x, WETH]), // paths
    );

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("10.") };
    await hardhatPool.deposit(
      0, // _index_id
      tokens.map(x => [WETH, x]), // paths
      overrides
    );

  });

  it("Oracle", async function () {
    1 + 1;
  })

})

