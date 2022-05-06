const express = require('express');
const app = express();
const bodyParser = require('body-parser'); // important to be able to read the body of a PUT or POST request

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

// Set up the web3 variables 
const config = require('./config.json'); // delete require.cache[require.resolve('./config.json')]
const address = config['contracts'][config['contracts'].length - 1]['address'];
const abi = config['contracts'][config['contracts'].length - 1]['abi'];
var Web3 = require('web3'); // create contract object

// Load the relevant contract
var w3 = new Web3(config['RPC']);
var simpleStorage = new w3.eth.Contract(abi, address); // Note: reverse order for web3.py
var acct = w3.eth.accounts.privateKeyToAccount(config['private_key'])
var myValue = simpleStorage.methods.retrieve(); // Callback to the retrieve function

// If the client sends a GET request, execute the callback to get the variable from the contract
app.get('/get-value', (req, res) => {
    myValue.call()
        .then((message) => {
            // console.log(message, typeof message);
            res.send(message);
        })
});

// If the client sends a PUT request, update the value in the smart contract
app.put('/set-value', (req, res) => {
    // read the body of the request for the input-field value
    var amount = parseFloat(req.body['inputField']);

    // then grab the nonce and gas price
    w3.eth.getTransactionCount(acct.address)
        .then((nonce) => {
            w3.eth.getGasPrice()
                .then((gas) => {

                    // Send back a text response for confirmation and troubleshooting
                    res.send(`received a PUT request for ${amount} from ${acct.address} and nonce ${nonce} and gasPrice ${gas}`)

                    // format the transaction parameters
                    var txnParam = {
                        "gasPrice": parseInt(gas),
                        "from": acct.address,
                        "nonce": parseInt(nonce)
                    }

                    // call the store() function of the contract and send the transaction
                    simpleStorage.methods.store(amount).send(txnParam)
                        .then((payload) => {
                            console.log("TransactionHash: " + payload['transactionHash']);
                        })
                })
        });
})