# Using web3.py with Ganache
# NOTE: Ganache needs to be running, and a top level "private_key" value must be stored in ./ethereumConfig.json for this file to work
# https://blog.blockmagnates.com/deploying-solidity-contract-with-python-and-ganache-4f386308b2a0

"""
#####################
###### COMPILE ###### 
#####################
"""

with open("./simpleStorage.sol", "r") as file:
    simple_storage_file = file.read()
    # print(contract_file)

from solcx import compile_standard
import json

# state the settings for the compile function
compiled_sol = compile_standard(
    {  # https://solcx.readthedocs.io/en/latest/using-the-compiler.html?#solcx.compile_standard
        "language": "Solidity",
        "sources": {"simpleStorage.sol": {"content": simple_storage_file}},
        "settings": {
            "outputSelection": {  # https://docs.soliditylang.org/en/latest/using-the-compiler.html#output-description
                "*": {
                    "*": [  # output needed to interact with and deploy contract
                        "abi",
                        "metadata",
                        "evm.bytecode",
                        "evm.bytecode.sourceMap",
                    ]
                }
            }
        },
    },
    solc_version="0.8.13",
)
# print(compiled_sol)  # check to see the settings are correct

# Save the settings in a json
with open("compiled_code.json", "w") as file:
    json.dump(compiled_sol, file)

# get bytecode: https://ethereum.stackexchange.com/questions/76334/what-is-the-difference-between-bytecode-init-code-deployed-bytedcode-creation
bytecode = compiled_sol["contracts"]["simpleStorage.sol"]["SimpleStorage"]["evm"]["bytecode"]["object"]
print("Bytecode:", bytecode, "\n---------------------------------")

# get abi: https://docs.soliditylang.org/en/v0.8.11/abi-spec.html
abi = json.loads(compiled_sol["contracts"]["simpleStorage.sol"]["SimpleStorage"]["metadata"])["output"]["abi"]
print("ABI:", abi, "\n---------------------------------")


"""
#####################
###### DEPLOY ####### 
#####################
"""

from web3 import Web3

# grab the config settings which have 3 keys: "private_key", "RPC", and "contracts"
with open("./ethereumConfig.json", "r") as file:
    config = json.load(file)

# connect to the blockchain
w3 = Web3(Web3.HTTPProvider(config['RPC']))
print("Connection:", w3.isConnected())

# grab the chain id: https://stackoverflow.com/a/70746420
chain_id = w3.eth.chain_id
print("chain_id:", chain_id)

# get account details
acct = w3.eth.account.from_key(config['private_key'])
wei_balance = w3.eth.getBalance(acct.address)
print("balance:", w3.fromWei(wei_balance, 'ether'))

# create the contract
SimpleStorage = w3.eth.contract(abi=abi, bytecode=bytecode)
nonce = w3.eth.getTransactionCount(acct.address) # the number of the latest transaction
print("nonce:", nonce)

# format the parameters
transaction_settings = {
        "chainId": chain_id,
        "gasPrice": w3.eth.gas_price,
        "from": acct.address,
        "nonce": nonce
    }

# build a transaction
txn = SimpleStorage.constructor().buildTransaction(transaction_settings)
print("Transaction:", txn)

# sign and send the transaction
signed_txn = w3.eth.account.signTransaction(txn, config['private_key'])
print("Signed:", signed_txn)

txn_hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
print('Submitted Hash:', txn_hash)

print("Waiting for transaction to finish...")

# a blocking function while the transaction processes
txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
print(f"Contract deployed to {txn_receipt.contractAddress}")

# format and save to disk. Note: JSON format crucial
config['contracts'].append({
    "address":txn_receipt.contractAddress,
    "abi": abi,
    "bytecode": bytecode
    })
with open("./ethereumConfig.json", "w") as file:
    json.dump(config, file)
