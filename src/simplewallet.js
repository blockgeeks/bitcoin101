'use strict';

var WebAPI = require('./webapi');
var keys = require('./keys');

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
}

module.exports = new SimpleWallet();