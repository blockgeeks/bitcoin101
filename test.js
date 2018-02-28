
var wallet = require('./src/simplewallet');

wallet.createWallet("", "cVkzQCBmSqsVWnTNqWD2quK2moRYN651jD9cFV6uR5kBGwWdXLsy")
.then(w => {
    return wallet.sendBitcoin(0.1, "n1K2krh7PGK4XEh1ouZAbH44itvECJY9tP");
}).then(tx => console.log(tx));