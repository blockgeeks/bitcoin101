'use strict';

var WebAPI = require('./webapi');
var keys = require('./keys');
var tx = require('./transaction');
const COIN = 100000000; // constant that defines number of Satoshis per BTC

class SimpleWallet {
    constructor() {
        this.api = new WebAPI();
        this.wallet = {};
    }

    getWallet() {
        return this.wallet;
    }

    getBalance() {
        return this.api.getBalance(this.wallet.address);
    }

    createWallet(network="mainnet", key=0) {
        // When importing key, determine network automatically
        if(keys.getNetworkFromKey(key) !== "unknown") {
            network = keys.getNetworkFromKey(key);
        }
        this.api.changeNetwork(network);
        this.wallet = keys.createWallet(network, key);

        return new Promise((resolve, reject) => {
            resolve(this.wallet);
        });
    }

    sendBitcoin(amount, toAddr) {
        amount = (amount * COIN)/1; // convert to number of satoshis

        return new Promise((resolve, reject) => {
            this.api.getUtxos(this.wallet.address).then(utxo => {
                return tx.create(utxo, amount, toAddr, this.wallet);
            }).then(tx => {
                return this.api.sendTx(tx);
            }).then(result => {
                resolve(result);
            }).catch(err => reject(err));
        });
    }
}

module.exports = new SimpleWallet();