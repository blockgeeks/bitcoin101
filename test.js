
var WebAPI = require('./src/webapi');

var api = new WebAPI();

api.changeNetwork("testnet");
api.getNetworkInfo().then(info => console.log(info));