'use strict';

var crypto = require('crypto');
var base58 = require('bs58');
var ecurve = require('ecurve');
var BigInteger = require('bigi');
var getRandomValue = require('get-random-values');


function createPrivKey() {
    return Buffer.from(getRandomValue(new Uint8Array(32))).toString('hex');
}

function createKeyPair(key = 0) {
    var privateKey = (key === 0)? createPrivKey() : decodePrivKey(key);
    var elliptic = ecurve.getCurveByName('secp256k1');
    var publicKey = elliptic.G.multiply(BigInteger.fromHex(privateKey));
    publicKey = publicKey.getEncoded(true).toString('hex');

    return { private: privateKey, public: publicKey };
}

function generateAddr(publicKey, network="mainnet") {
    var bytes = Buffer.from(publicKey, 'hex');
    var tmp = crypto.createHash('sha256').update(bytes).digest();
    var pubKeyHash = crypto.createHash('rmd160').update(tmp).digest();

    var versionPrefix = (network === "testnet")? "6f" : "00";
    var input = versionPrefix + pubKeyHash.toString('hex');

    bytes = Buffer.from(input, 'hex');
    tmp = crypto.createHash('sha256').update(bytes).digest();
    var checksum = crypto.createHash('sha256').update(tmp).digest();

    // Take the first 4 byte of checksum
    var addr = input + checksum.toString('hex').substr(0,8);

    // Convert to base58
    bytes = Buffer.from(addr, 'hex');
    addr = base58.encode(bytes);
    return addr;
}

function getKeyHashFromAddr(addr) {
    var bytes = base58.decode(addr);
    bytes = bytes.slice(1,21); // remove 1 byte version prefix and 4 bytes checksum
    return bytes.toString('hex');
}

// Convert hex key to WIF-compressed key
function encodePrivKey(privateKey, network="mainnet") {
    var prefix = (network === "testnet")? "EF" : "80";
    var newKey = prefix + privateKey + "01";

    // Create checksum
    var bytes = Buffer.from(newKey, 'hex');
    var tmp = crypto.createHash('sha256').update(bytes).digest();
    var checksum = crypto.createHash('sha256').update(tmp).digest();

    // Add first 4 bytes of checksum
    newKey += checksum.toString('hex').substr(0,8);

    // Convert to base58
    bytes = Buffer.from(newKey, 'hex');
    const key = base58.encode(bytes);
    return key;
}

// Convert WIF-compressed key to hex
function decodePrivKey(key) {
    var bytes = base58.decode(key);

    // Remove 1 byte version prefix, 1 byte 01 suffix and 4 byte checksum
    bytes = bytes.slice(1,33);
    return bytes.toString('hex');
}

function getNetworkFromKey(key) {
    var network = "unknown";
    if (key !== 0) {
        var first = key.charAt(0);

        if (first === 'K' || first === 'L') {
            network = "mainnet";
        } else if (first === 'c') {
            network = "testnet";
        }
    }
    return network;
}

function createWallet(network="mainnet", importKey=0) {
    var keys = createKeyPair(importKey);
    var addr = generateAddr(keys.public, network);

    return {
        privateKey: encodePrivKey(keys.private, network),
        publicKey: keys.public,
        address: addr
    }
}

module.exports = {
    createWallet,
    getNetworkFromKey,
    getKeyHashFromAddr,
    decodePrivKey
}