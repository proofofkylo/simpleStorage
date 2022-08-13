
// Set up the config parameters 
const config = require('./ethereumConfig.json');
const address = config['contracts'][config['contracts'].length - 1]['address'];
const abi = config['contracts'][config['contracts'].length - 1]['abi'];
var Web3 = require('web3'); // create contract object

// Load the relevant contract
var w3 = new Web3(config['RPC']);
var simpleStorage = new w3.eth.Contract(abi, address); // Note: reverse order for web3.py
var acct = w3.eth.accounts.privateKeyToAccount(config['private_key'])
async function getValue() {
  return await simpleStorage.methods.retrieve().call();
}
async function setValue(val){
  
  // then grab the nonce and gas price
  nonce = await w3.eth.getTransactionCount(acct.address)
  gas = await w3.eth.getGasPrice() 

  // Send back a text response for confirmation and troubleshooting
  response = `received a PUT request for ${val} from ${acct.address} and nonce ${nonce} and gasPrice ${gas}`
  
  // format the transaction parameters
  var txnParam = {
      "gasPrice": parseInt(gas),
      "from": acct.address,
      "nonce": parseInt(nonce)
  }

  // call the store() function of the contract and send the transaction
  payload = await simpleStorage.methods.store(val).send(txnParam)
  console.log("TransactionHash: " + payload['transactionHash']);

  return response
};

module.exports = {getValue, setValue}
