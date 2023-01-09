import { CARDANO_CLI_PATH, CARDANO_NETWORK_TYPE } from '../variables';
import { MetadataDocument } from '../_model/metadata';
import { metadataFind, metadataUpdate } from '../_utils/controller';

const cmd: any = require("node-cmd");

const _account = "./_account";

interface Refund {
    refund_amount: number, 
    minimum_lovelace_fee: number
}

const buildRawTx = (data: MetadataDocument): void => {
    const {utxo, txid, sender_address} = data;
    cmd.runSync([
        CARDANO_CLI_PATH,
        "transaction build-raw",
        `--tx-in ${utxo}#${txid}`,
        `--tx-out ${sender_address}+0`,
        `--fee 0`,
        `--out-file ${_account}/tx/tx.draft`
    ].join(" "));
};

const calcMinimumFee = (amount_in_lovelace: number | string): Refund => {
    const calculated_fee = cmd.runSync([
        CARDANO_CLI_PATH,
        "transaction calculate-min-fee",
        `--tx-body-file ${_account}/tx/tx.draft`,
        `--tx-in-count 1`,
        `--tx-out-count 1`,
        `--witness-count 1`,
        CARDANO_NETWORK_TYPE,
        `--protocol-params-file ${_account}/protocol.json`
    ].join(" "));

    const [minimum_lovelace_fee] = calculated_fee.data.split(" ");

    const refund_amount = Number(amount_in_lovelace) - Number(minimum_lovelace_fee);

    return {
        refund_amount,
        minimum_lovelace_fee
    }
};

const buildRealTx = (data: MetadataDocument, refund: Refund): void => {
    const {utxo, txid, sender_address} = data;
    const {refund_amount, minimum_lovelace_fee} = refund;
    cmd.runSync([
        CARDANO_CLI_PATH,
        "transaction build-raw",
        `--tx-in ${utxo}#${txid}`,
        `--tx-out ${sender_address}+${refund_amount}`,
        `--fee ${Number(minimum_lovelace_fee)}`,
        `--out-file ${_account}/tx/tx.draft`
    ].join(" "));
};

const signTx = (): void => {
    cmd.runSync([
        CARDANO_CLI_PATH,
        "transaction sign",
        `--tx-body-file ${_account}/tx/tx.draft`,
        `--signing-key-file ${_account}/keys/payment.skey`,
        `${CARDANO_NETWORK_TYPE}`,
        `--out-file ${_account}/tx/tx.signed`
    ].join(" "));
};

const submitTx = async (): Promise<boolean> => {
    let status: boolean = false;
    
    try{
        const response = await cmd.runSync([
            CARDANO_CLI_PATH,
            "transaction submit",
            `--tx-file ${_account}/tx/tx.signed`,
            `${CARDANO_NETWORK_TYPE}`
        ].join(" "));
      if(response.data.includes("success")) status = true;
    } catch(err){
      status = false
    };
  
    return status;
  }

const refund_payments = async () => {

    const refunds = await metadataFind(["refund"]);

    const max_iteration: number = refunds.length >= 30 ? 30 : refunds.length;

    for(let i = 0; i < max_iteration; i++){

        const data = refunds[i];
        
        buildRawTx(data);

        const refund = calcMinimumFee(data.amount_in_lovelace);

        buildRealTx(data, refund);

        signTx();

        const status = await submitTx();
        
        if(!status) continue;

        data.status = "refunded";
        await metadataUpdate(data._id, data);
        console.log(`${data.amount_in_lovelace} Refunded to, ${data.sender_address}`);
    }

};

setInterval(async () => {
    await refund_payments();
}, 15000);