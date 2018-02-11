'use strict';

var request = require('request');

class WebAPI {
    constructor() {
        this.api = "https://api.blockcypher.com/v1/btc/";
        this.network = "main";
    }

    changeNetwork(network) {
        if(network === "mainnet") {
            this.network = "main";
        } else if (network === "testnet") {
            this.network = "test3";
        }
    }

    getNetworkInfo() {
        var url = this.api + this.network;

        return new Promise((resolve, reject) => {
            request(url, (err, res, body) => {
                if(err) reject(err);
                resolve(JSON.parse(body));
            })
        })
    }
}

module.exports = WebAPI;