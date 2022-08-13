use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};
use std::convert::TryInto;

// Create the structure of the data
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Data {
    pub value: i32,
}

// Adding functionality to a struct happens outside the struct using 'impl' - use in production
// impl Data {
//     pub fn set_value(&mut self, input: i32) -> i32 {
//         self.value = input; //.value = input;
//         self.value
//     }
// }

// Declare and export the program's entrypoint
entrypoint!(simple_storage);

pub fn simple_storage(
    program_id: &Pubkey,      // Public key of the account the program was loaded into
    accounts: &[AccountInfo], // The account to store the data to
    instruction_data: &[u8], // the data to be stored 
) -> ProgramResult {

    // First find and verify the data-account's public key
    let accounts_iter = &mut accounts.iter(); // Iterating accounts is safer than indexing
    let account = next_account_info(accounts_iter)?; // Use the first account listed
    if account.owner != program_id {
        // The account must be owned by the program in order to modify its data
        msg!("This account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }
    
    // Next unpack the instruction data into an i32 value
    let instruction_array: Result<[u8 ; 4], _> = instruction_data[..4].try_into();
    let val:i32 = i32::from_le_bytes(instruction_array.unwrap()); // use MATCH pattern for production

    // Finally, access the data stored in the account and replace it with the instruction data 
    let mut storage = Data::try_from_slice(&account.data.borrow())?;
    storage.value = val;
    storage.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("The stored value is {}", storage.value);
    Ok(())
}


