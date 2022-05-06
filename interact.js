// // USED FOR CLIENT JAVASCRIPT
// var config
// var address
// var abi
// fetch("./config.json")
//     .then(response => response.json())
//     .then(json => { config = json })
//     .then(() => {
//         address = config['contracts'][config['contracts'].length - 1]['address'];
//         abi = config['contracts'][config['contracts'].length - 1]['abi'];
//     });
// import * as Web from 'web3';

// USED FOR NODE.JS
const config = require('./config.json'); // delete require.cache[require.resolve('./config.json')]
const address = config['contracts'][config['contracts'].length - 1]['address'];
const abi = config['contracts'][config['contracts'].length - 1]['abi'];
var Web3 = require('web3'); // create contract object

var w3 = new Web3(config['RPC']);
var simpleStorage = new w3.eth.Contract(abi, address); // Note: reverse order for web3.py

// Callback to the retrieve function 
var myValue = simpleStorage.methods.retrieve()


// const showResults = document.querySelector('results')
// const getButton = document.querySelector('get-button')
//getButton.addEventListener('click', myvalue.call().then((message) => { console.log(message) }))

// getButton.addEventListener('click', console.log(showResults))

// export { myValue }