import { expect } from "chai";
import { ethers } from "hardhat";

import constants from "../constants";

describe("Withdraw", function () {
    let owner;
    let other;
    let aaveV2Bridge;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
      [owner, other] = await ethers.getSigners();

      UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
      uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();
      await uniswapV2SwapBridge.deployed();

      let AaveV2Bridge = await ethers.getContractFactory("AaveV2Bridge");
      aaveV2Bridge = (await AaveV2Bridge.deploy()).connect(owner);
      await aaveV2Bridge.deployed();

      let Wallet = await ethers.getContractFactory("Wallet");
      wallet = (await Wallet.deploy()).connect(owner);
      await wallet.deployed();
    });

    it("Buy DAI on Uniswap and deposit on Aave", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2Bridge.address,
        ];
        let pathUniswap = [
            TOKENS['WMAIN'],
            TOKENS['DAI'],
        ];
        let value = ethers.utils.parseEther("1.1");
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    1,
                    pathUniswap
                ],
            ),
            aaveV2Bridge.interface.encodeFunctionData(
                "deposit",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['DAI'],
                ]
            )
        ];

        let blockNumber = await ethers.provider.getBlockNumber();
        let overrides = { value: value };

        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        var filter = {
            address: wallet.address,
            fromBlock: blockNumber
        };
        let event = await ethers.provider.getLogs(filter)
            .then((events) => {
                return events
                    .map(event => UniswapV2SwapBridge.interface.parseLog(event))
                    .find(event => event.name == 'TradedFromETHToTokens');
            });
        
        expect(event.args.value).to.equal(value);
        expect(event.args.wallet).to.equal(wallet.address);
        expect(event.args.path).to.eql(pathUniswap);
        expect(event.args.amounts).to.be.an('array');
    })

    it("Buys DAI on Uniswap -> Sell DAI on Uniswap", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    1,
                    [
                        TOKENS['WMAIN'],
                        TOKENS['DAI'],
                    ]
                ],
            )
        ];

        let overrides = { value: ethers.utils.parseEther("1.1") };
        const receipt = await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromTokensToETH",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    1,
                    [
                        TOKENS['DAI'],
                        TOKENS['WMAIN'],
                    ]
                ],
            )
        ];

        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls
        );
    })

    it("Buys DAI on Uniswap and deposit on Aave and withdraw on Aave", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2Bridge.address,
            aaveV2Bridge.address,
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    1,
                    [
                        TOKENS['WMAIN'],
                        TOKENS['DAI'],
                    ]
                ],
            ),
            aaveV2Bridge.interface.encodeFunctionData(
                "deposit",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['DAI'],
                ]
            ),
            aaveV2Bridge.interface.encodeFunctionData(
                "withdraw",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['DAI'],
                    ["0x27F8D03b3a2196956ED754baDc28D73be8830A6e"],
                    "0x357D51124f59836DeD84c8a1730D72B749d8BC23"
                ]
            )
        ];

        let overrides = { value: ethers.utils.parseEther("1.1") };
        const receipt = await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );
    })

    it("Rejects write from other user", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2Bridge.address,
            aaveV2Bridge.address,
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    1,
                    [
                        TOKENS['WMAIN'],
                        TOKENS['DAI'],
                    ]
                ],
            ),
            aaveV2Bridge.interface.encodeFunctionData(
                "deposit",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['DAI'],
                ]
            ),
            aaveV2Bridge.interface.encodeFunctionData(
                "withdraw",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['DAI'],
                    ["0x27F8D03b3a2196956ED754baDc28D73be8830A6e"],
                    "0x357D51124f59836DeD84c8a1730D72B749d8BC23"
                ]
            )
        ];

        let overrides = {value: ethers.utils.parseEther("1.1")};

        await expect(wallet.connect(other).write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        )).to.be.revertedWith("WALLET: ONLY WALLET OWNER CAN CALL THIS FUNCTION");
    })

    it("Rejects failed bridge call", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2Bridge.address,
            aaveV2Bridge.address,
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    1,
                    [
                        TOKENS['WMAIN'],
                        TOKENS['DAI'],
                    ]
                ],
            ),
            aaveV2Bridge.interface.encodeFunctionData(
                "deposit",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['QUICK'],
                ]
            ),
            aaveV2Bridge.interface.encodeFunctionData(
                "withdraw",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['QUICK'],
                    [TOKENS['QUICK']],
                    "0x357D51124f59836DeD84c8a1730D72B749d8BC23"
                ]
            )
        ];

        let overrides = {value: ethers.utils.parseEther("1.1")};

        await expect(wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        )).to.be.revertedWith("WALLET: BRIDGE CALL MUST BE SUCCESSFUL");
    })
});