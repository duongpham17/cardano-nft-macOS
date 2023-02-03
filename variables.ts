import fs from 'fs';
import path from 'path';
// Config accordingly

export const CARDANO_CLI: "cardano-cli" = "cardano-cli"; // OR manually enter it in cmd.runSync

export const CARDANO_NETWORK_TYPE: "--mainnet" | "--testnet-magic 1" = "--testnet-magic 1"; // --mainnet | --testnet-magic 1097911063

export const CARDANO_ERA: "--babbage-era" = "--babbage-era";

// Where all your cardano will be sent to after EACH nft is minted and sent to user. Important.
export const SEND_CHANGE_TO_ADDRESS = "addr_test1qpqzls20hwdc8p4m490as53g8qy0h534wgm0fq6afmq8a67v47w6mhmc0my3lr6kwnra5x6fr2heqva2au2nmd0pdatq3qqfas"; 

export const PROJECT_NAME: string = "Fatduck";

export const COST_OF_NFT: number = 1000000 * 10; // in Lovelace

export const TOTAL_MINT: number = 10000;

export const HOURS_BEFORE_CONTRACT_EXPIRES: number = 100;

export const get_wallet_address = () => {
    try{
        const wallet_address = fs.readFileSync(`${path.resolve(__dirname)}/_account/keys/payment.addr`, 'utf-8');
        return wallet_address
    } catch(err){
        console.log("Error no payment keys have been created. \n RUN \n npm run keys")
    }
}

export const get_slot_number = () => {
    try{
        const SLOT_NUMBER = JSON.parse(fs.readFileSync(`${path.resolve(__dirname)}/_account/policy/policy.script`, 'utf-8')).scripts[0].slot;
        return SLOT_NUMBER
    } catch(err){
        console.log("Error no policy keys have been created. \n RUN \n npm run policy")
    }
} 
  
export const get_policy_id = () => {
    try{
        const POLICY_ID = fs.readFileSync(`${path.resolve(__dirname)}/_account/policy/policyID`, 'utf-8');
        return POLICY_ID
    } catch(err){
        console.log("Error no policy keys have been created. \n RUN \n npm run policy")
    }
}    
  