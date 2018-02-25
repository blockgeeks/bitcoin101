'use strict';

var request = require('request');
const COIN = 100000000; // constant that defines number of Satoshis per BTC

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

    getLastBlockNumber() {
        var url = this.api + this.network;

        return new Promise((resolve, reject) => {
            request(url, (err, res, body) => {
                if(err) reject(err);
                var result = JSON.parse(body)
                resolve(result.height);
            })
        })
    }

    getBlock(id) {
        var url = this.api + this.network + '/blocks/' + id;

        return new Promise((resolve, reject) => {
            request(url, (err, res, body) => {
                if(err) reject(err);
                var result = JSON.parse(body);
                resolve({
                    hash: result.hash,
                    number: result.height,
                    time: result.time
                })
            })
        })
    }

    getBalance(addr) {
        var url = this.api + this.network + '/addrs/' + addr + '/balance';

        return new Promise((resolve, reject) => {
            request(url, (err, res, body) => {
                if (err) reject(err);
                var result = JSON.parse(body);
                resolve(result.balance / COIN);
            })
        })
    }
}

module.exports = WebAPI;