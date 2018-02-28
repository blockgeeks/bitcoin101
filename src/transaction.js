'use strict';

var keys = require('./keys');
var crypto = require('crypto');
var eccrypto = require('eccrypto');

var opcodes = {
    OP_DUP: '76',
    OP_HASH160: 'a9',
    OP_EQUALVERIFY: '88',
    OP_CHECKSIG: 'ac'
}

//==============================
// Helper Functions
//==============================

function addPadding(num, bytes) {
    // Each hex is 4 bits, so multiply bytes by 2 to get num hex digits
    while(num.length < bytes*2) num = "0" + num;
    return num;
}

function toLE(input) {
    // Split string into array of 2 characters each
    // then reverse and join back to string
    return input.match(/.{2}/g).reverse().join('');
}

function getFee() {
    return "10000"; // Return fixed value for now in satoshis
}

function seralizeObjVal(obj) {
    // Ignore all the keys and concat just the values
    var bin = Object.keys(obj).reduce((result, key) => {
        if (typeof obj[key] === 'object') {
            return result.concat(seralizeObjVal(obj[key]));
        } else {
            return result.concat(obj[key]);
        }
    }, []).join('');

    return bin;
}

function dsha256(data) {
    var bytes = Buffer.from(data, 'hex');
    var tmp = crypto.createHash('sha256').update(bytes).digest();
    var hash = crypto.createHash('sha256').update(tmp).digest();
    return hash;
}

//==============================
// Signing Transaction
//==============================

function ecdsa_sign(tx, priv) {
    // double sha256 hash the tx
    var dhash = dsha256(tx);

    // Extract out the 256 bit priv key and convert to bytes
    var key = Buffer.from(keys.decodePrivKey(priv), 'hex');

    // sign the tx with the private key
    return eccrypto.sign(key, dhash);
}

async function signInput(tx, indx, wallet) {
    // 1. Sanity check to make sure the publicKeyHash in the
    // locking script matches the publicKeyHash of the wallet
    var lockingKeyHash = tx.inputs[indx].unlockScript.slice(6,46);
    var pubKeyHash = keys.getKeyHashFromAddr(wallet.address);
    if (lockingKeyHash !== pubKeyHash) {
        throw new Error("Public key didn't match UTXO's locking requirement! Can't spend bitcoin!");
    }

    // 2. Make a deep copy of the tx and clear the script
    // and len field except for the tx currently being signed
    var newtx = JSON.parse(JSON.stringify(tx));
    for (var i = 0; i < newtx.inputs.length; i++) {
        if (i != indx) {
            newtx.inputs[i].scriptLength = '00';
            newtx.inputs[i].unlockScript = "";
        }
    }

    // 3. Add temporary hashcode to tx and convert it to binary
    // and sign it. Then add a hashcode suffix of 01 as well.
    newtx.hashcode = "01000000"; // SIGHASH_ALL in little-endian
    var binTx = seralizeObjVal(newtx);
    var signature = await ecdsa_sign(binTx, wallet.privateKey);
    signature = signature.toString('hex') + '01'; //SIGHASH_ALL

    // 4. Create the unlock script and insert it to the tx.inputs[indx]
    var sigLenInBytes = toLE(addPadding((signature.length/2).toString(16), 1));
    var pubKeyLenInBytes = toLE(addPadding((wallet.publicKey.length/2).toString(16), 1));
    var unlockScript = sigLenInBytes + signature + pubKeyLenInBytes + wallet.publicKey;
    tx.inputs[indx].unlockScript = unlockScript.toString(16);
    tx.inputs[indx].scriptLength = (unlockScript.length/2).toString(16);
}

//==============================
// Create Transaction
//==============================

function getNewTx(inputs, outputs) {
    return {
        version: "01000000", // 4 byte version in little-endian
        inputcount: toLE(addPadding(inputs.length.toString(16), 1)),
        inputs: inputs,
        outputcount: toLE(addPadding(outputs.length.toString(16), 1)),
        outputs: outputs,
        locktime: "00000000", // 4 byte default to 0s
    }
}

function createInputs(utxo, amount) {
    var inputs = [];
    var accum = 0;

    // Find a list of inputs that add up to the amount
    utxo.data.forEach(data => {
        if (accum < amount) {
            accum += data.value;
            inputs.push(data);
        }
    });

    // Create a new array of input data structures
    inputs = inputs.map(tx => {
        var obj = {};
        obj.previousHash = toLE(tx.hash);
        obj.previousIndex = toLE(addPadding(tx.index.toString(16), 4)); // in hex
        obj.scriptLength = (tx.script.length/2).toString(16); // length in bytes
        obj.unlockScript = tx.script; // Set to the locking script for now
        obj.sequence = 'ffffffff'; // use default value
        return obj;
    });

    inputs.push(accum); // Store the value of all inputs as last element
    return inputs;
}

function createSingleOutput(amount, toAddr) {
    // Create locking script
    var pubKeyHash = keys.getKeyHashFromAddr(toAddr);
    var keyHashInBytes = (pubKeyHash.length/2).toString(16); // # of bytes
    var script = opcodes.OP_DUP + opcodes.OP_HASH160 + keyHashInBytes
        + pubKeyHash + opcodes.OP_EQUALVERIFY + opcodes.OP_CHECKSIG;

    // Create output
    var output = {};
    output.value = toLE(addPadding(amount.toString(16), 8));
    output.length = (script.length/2).toString(16); // length in bytes
    output.script = script;

    return output;
}

function createOutputs(amount, toAddr, inputValue, wallet) {
    var outputs = [];

    // Create normal output
    outputs.push(createSingleOutput(amount, toAddr));

    // Create change output if necessary
    var change = inputValue - amount - getFee();
    if (change > 0) {
        outputs.push(createSingleOutput(change, wallet.address));
    }

    return outputs;
}

async function create(utxo, amount, toAddr, wallet) {
    var inputs = createInputs(utxo, amount);
    var inputValue = inputs.pop();
    var outputs = createOutputs(amount, toAddr, inputValue, wallet);
    var tx = getNewTx(inputs, outputs);

    // Sign all the inputs individually
    for (var i = 0; i < inputs.length; i++) {
        await signInput(tx, i, wallet);
    }

    return seralizeObjVal(tx);
}

module.exports = {
    create
}