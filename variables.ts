import fs from 'fs';

// Config accordingly

/*****************/

export const CARDANO_CLI_PATH: string = "cardano-cli"; // OR manually enter it in cmd.runSync

export const CARDANO_NETWORK_TYPE: string = "--testnet-magic 1097911063"; // --mainnet | --testnet-magic 1097911063

export const CARDANO_ERA: string = "--babbage-era";

/*****************/

// Where all your cardano will be sent to after EACH nft is minted and sent to user. Important.
export const SEND_CHANGE_TO_ADDRESS = "addr_test1qpqzls20hwdc8p4m490as53g8qy0h534wgm0fq6afmq8a67v47w6mhmc0my3lr6kwnra5x6fr2heqva2au2nmd0pdatq3qqfas"; 

export const PROJECT_NAME: string = "Fatduck";

export const COST_OF_NFT: number = 1000000 * 50; // in Lovelace

export const TOTAL_MINT: number = 10000;

/*****************/

let wallet_address: string | undefined;
let policy_id: string | undefined;

try{
    wallet_address = fs.readFileSync(`${__dirname}/_account/keys/payment.addr`, 'utf-8')
    policy_id = fs.readFileSync(`${__dirname}/_account/policy/policyID`, 'utf-8');
} catch (err) {
    console.log("go to _account and generate payment and policy keys");
}

export const WALLET_ADDRESS = wallet_address;

export const POLICY_ID = policy_id || "Insert policy id";

export const SLOT_NUMBER: number = JSON.parse(fs.readFileSync(`${__dirname}/_account/policy/policy.script`, 'utf-8')).scripts[0].slot;