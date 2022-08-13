from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc.api import Client
from solana.transaction import Transaction, TransactionInstruction, AccountMeta
from solana.system_program import TransferParams, transfer, CreateAccountParams
import solana.system_program as SystemProgram
import os
import subprocess
import json


# NOTE: solana-test-validator must be running for this code to work.


os.system('cargo-build-bpf --manifest-path=./Cargo.toml --bpf-out-dir=./')

LAMPORT_PER_SOL = 1000000000
client = Client("http://127.0.0.1:8899") # Must have the solana-test-validator already running

# Generate Keypairs for transactions below -- Should return secret keys for this, so that the Keypairs can be recreated in web3.js on Node side
sender = Keypair()
receiver = Keypair()

# Deploy the contract via CLI to the test-validator
deploy_solana_cli = subprocess.run(['solana', 'program', 'deploy', 'simple_storage.so'], stdout=subprocess.PIPE) # https://stackabuse.com/executing-shell-commands-with-python/
pid = deploy_solana_cli.stdout.decode('utf-8').replace(' ', '').replace('\n', '').split(':')[1]
# pid = os.environ['SS_PROGRAM_ID'] # This line is no longer in use, as a manual call to EXPORT SS_PROGRAM_ID= is no longer used.
program_id = PublicKey(pid)

# Requesting airdrop returns an object with a signature inside the "result" key
# confirmation['result'] dicts have 3 items.
# 1. 'context' - example: {'slot': 5734}
# 2. 'value' - example: {'confirmationStatus': 'finalized', 'confirmations': None, 'err': None, 'slot': 5702, 'status': {'Ok': None}}
# 3. 'id' - example: 36
airdrop = client.request_airdrop(sender.public_key, 1 * LAMPORT_PER_SOL)
airdrop_signature = airdrop["result"]
airdrop_confirmation = client.confirm_transaction(airdrop_signature) #NOTE: Waits for the airdrop to be finalised before moving on
# print("airdrop:", airdrop_confirmation['result']['value'])

# Calculate the amount of rent based on the number of bytes to be stored
lamports_to_send = int(client.get_minimum_balance_for_rent_exemption(4)['result'])
print("before", f"sender {client.get_balance(sender.public_key)['result']['value']}", f"receiver {client.get_balance(receiver.public_key)['result']['value']}", f"to receive {lamports_to_send}")

# Create an object with parameters formatted for the account creation
params = CreateAccountParams(
    from_pubkey=sender.public_key,
    new_account_pubkey=receiver.public_key,
    lamports= lamports_to_send * 5, # multiple to cover transaction fees
    space = 4,
    program_id = program_id
    )

# Create the desired action object using the parameters
create_account = SystemProgram.create_account(params)

# create the transaction object, process the receipt, and send to the validator + wait for confirmation
transaction = Transaction().add(create_account)
transaction_receipt = client.send_transaction(transaction, sender, receiver) # NOTE: must add both sender and receiver if creating an account
transaction_confirmation = client.confirm_transaction(transaction_receipt['result']) # NOTE: waits for the transaction to be finalised (await)
# print(transaction_confirmation['result']['value'])

print("after", f"sender {client.get_balance(sender.public_key)['result']['value']}", f"receiver {client.get_balance(receiver.public_key)['result']['value']}")
# print('sender', sender.public_key, 'receiver', receiver.public_key)

# # Asking the program to add data to that new_account_pubkey we gave it and create an instruction object
import borsh
my_schema = {
        'Data': borsh.types.struct({
            'value': borsh.types.i32
            })
        }

my_data = {
        "Data": borsh.types.struct({"value": 555})
        }

value_to_send = borsh.serialize(my_schema, my_data)
account_object = AccountMeta(pubkey = receiver.public_key, is_signer = True, is_writable = True)
instructions = TransactionInstruction(keys = [account_object], program_id = program_id, data = value_to_send)

# Fee payer must be owned by SystemProgram and thus passed in at the init of transaction object
txn = Transaction(fee_payer=sender.public_key).add(instructions) 
txn_receipt = client.send_transaction(txn, receiver, sender) # Receiver first for the program to see, then sender to pay the fees
txn_confirmation = client.confirm_transaction(txn_receipt['result'])
# print(transaction_confirmation['result'])

config_dict = {
        'main_account': list(sender.secret_key),
        'data_account': list(receiver.secret_key),
        'program_id': pid 
        }

with open('solanaConfig.json', 'w') as file:
    file.write(json.dumps(config_dict))

print('Completed storing of keys')
