// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;
import "hardhat/console.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

contract ZeroXSwapBridge {
    address constant zeroXAddress = 0xDef1C0ded9bec7F1a1670819833240f027b25EfF;

    function swapETH(
        uint256 ethAmount,
        bytes[] calldata encodedCall
    ) external {
        console.log('MATIC', address(this).balance);

        (bool isSuccess, bytes memory result) = zeroXAddress.call(abi.encode(encodedCall));

        if (!isSuccess) {
            assembly {
                let ptr := mload(0x40)
                let size := returndatasize()
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }
        console.log('MATIC', address(this).balance);

        console.log('DAI', IERC20(0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063).balanceOf(address(this)));
    }
}
