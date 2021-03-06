// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "../Wallet.sol";

// This contract is used only for unit and Echidna tests 
contract TestWallet is Wallet {

    function getDeFiBasket() public view returns (address) {
        return _defibasketAddress;
    }
   
}