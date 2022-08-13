
const borsh = require('borsh')
const solanaWeb3 = require('@solana/web3.js');
const solana_config = require('./solanaConfig.json') // This will only work after deploy.py has run from the ./Solana folder
const mainSolKey = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(solana_config['main_account'])) // Not used?
const dataSolKey = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(solana_config['data_account']))
const programId = new solanaWeb3.PublicKey(solana_config['program_id'])
const solClient = new solanaWeb3.Connection("http://127.0.0.1:8899")

// Create a class that matches the data structure of the on-chain data
class Data {constructor(fields = 0) {this.value = fields.value;}}

// Create a map object which Borsh recognizes as the schema of the class
const schema = new Map([[Data, { kind: 'struct', fields: [['value', 'u32']] }]]); // seems like i32 is not possible with borsh-js

async function getValue(){

  const solInfo = await solClient.getAccountInfo(dataSolKey.publicKey)
  const rawBuffer = Buffer.from(solInfo.data, 'base64')

  // run the deserializer function. Note: data has to be formatted exactly as is. u32 fieldType, and base64 decoding.
  const myval = borsh.deserialize(schema, Data, rawBuffer)

  // Must be sent as a string otherwise it gets confused with a HTTP response code
  return myval['value'].toString()
  }

async function setValue(val){
  // Format the input according to structure of the Data class
  const formattedVal = {"value": val}
  const myData = new Data(formattedVal)

  // Serialize the data and place it into the accountMeta structure
  const formattedData = borsh.serialize(schema, myData)
  const accountMeta = {isSigner: true, isWritable: true, pubkey: dataSolKey.publicKey} // NOTE: "pubkey" key is all lowercase

  // Create an instruction object
  const instruction = new solanaWeb3.TransactionInstruction({
    data: formattedData,
    keys: [accountMeta],
    programId: programId 
  })

  // Send according to these specs: https://solana-labs.github.io/solana-web3.js/modules.html#sendAndConfirmTransaction
  // NOTE: both keys must be sent, and in this exact order. (first one to pay fees, second one to confirm which account to operate on)
  const transaction = await solanaWeb3.sendAndConfirmTransaction(solClient, new solanaWeb3.Transaction().add(instruction), [mainSolKey, dataSolKey])
  return transaction
}

module.exports = {getValue, setValue}
