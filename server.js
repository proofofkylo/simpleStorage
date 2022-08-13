const express = require('express');
const app = express();
const bodyParser = require('body-parser'); // important to be able to read the body of a PUT or POST request

// const borsh = require('borsh')
// const solanaWeb3 = require('@solana/web3.js');
// const solana_config = require('./Solana/solana_config.json') // This will only work after deploy.py has run from the ./Solana folder
// const mainSolKey = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(solana_config['main_account'])) // Not used?
// const dataSolKey = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(solana_config['data_account']))
// const solClient = new solanaWeb3.Connection("http://127.0.0.1:8899")
// const solInfo = solClient.getAccountInfo(dataSolKey.publicKey).then((result) => {
//
//     const rawBuffer = Buffer.from(result.data, 'base64')
//
//     // Create a class that matches the data structure of the on-chain data
//     class Data {constructor(fields = 0) {this.value = fields.value;}}
//
//     // Create a map object which Borsh recognizes as the schema of the class
//     const schema = new Map([[Data, { kind: 'struct', fields: [['value', 'u32']] }]]); // seems like i32 is not possible with borsh-js
//
//     // run the deserializer function. Note: data has to be formatted exactly as is. u32 fieldType, and base64 decoding.
//     const myval = borsh.deserialize(schema, Data, rawBuffer)
//     console.log('here it is:', myval)
//
//     }
// )
//// Should match the names on the HTML page
Solana = require('./Solana/interact.js') 
Ethereum = require('./Ethereum/interact.js')

// support parsing of application/json type post data
app.use(bodyParser.json());

// Create port and confirm status to console
app.listen(3000, () => {
    console.log("App listening on 3000");
});

// Loading CSS
app.use(express.static(__dirname));

// create a homepage route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

// If the client sends a GET request, execute the callback to get the variable from the contract
app.get('/get-value', async (req, res) => {
    const chain = req.query.chain
    if (chain == "none"){
        res.send('No chain selected')
    } else {
    storedValue = await eval(chain).getValue();
    console.log(typeof(storedValue))
    res.send(storedValue)
    }
});

// If the client sends a PUT request, update the value in the smart contract
app.put('/set-value', async (req, res) => {
    const chain = req.query.chain
    if (chain == "none"){
        res.send('No chain selected')
    } else {
    // read the body of the request for the input-field value
    var amount = parseFloat(req.body['inputField']); 
    response = await eval(chain).setValue(amount)
    console.log(response)
    res.send("Updated")
    }
})
