import { CARDANO_CLI, CARDANO_ERA, SEND_CHANGE_TO_ADDRESS, CARDANO_NETWORK_TYPE, get_policy_id, get_slot_number, get_wallet_address} from '../variables';
import { IMetadata } from '../_model/metadata';
import { metadataFind, metadataUpdate } from '../_controller';

const cmd: any = require("node-cmd");
const _account = './_account';

const calcMinimumFee = (): number => {

  const calculated_min_fee = cmd.runSync([
    CARDANO_CLI,
    "transaction calculate-min-fee",
    `--tx-body-file ${_account}/tx/matx.raw`,
    `--tx-in-count 1`,
    `--tx-out-count 1`,
    `--witness-count 1`,
    CARDANO_NETWORK_TYPE,
    `--protocol-params-file ${_account}/protocol.json`
  ].join(" "));

  const [minimum_lovelace_fee] = calculated_min_fee.data.split(" ");

  const minimum_utxo_lovelace_required = 2000000;

  const minimum_lovelace = Number(minimum_lovelace_fee) + Number(minimum_utxo_lovelace_required);

  return minimum_lovelace;
};

const buildRawTx = (data: IMetadata): void => {

  const [slot_number, policy_id] = [get_slot_number(), get_policy_id()];

  const {utxo, txid, sender_address, hashed_token_name, batched_tokens} = data;

  cmd.runSync([
    CARDANO_CLI,
    "transaction build-raw",
    `--tx-in ${utxo}#${txid}`,
    `--tx-out ${sender_address}+0+"1 ${policy_id}.${hashed_token_name}"${batched_tokens}`,
    `--fee 0`,
    `--invalid-hereafter ${slot_number}`,
    `--out-file ${_account}/tx/matx.raw`
  ].join(" "));
};

const buildRealTx = (data: IMetadata, minimum_lovelace: number): void => {
  const [slot_number, policy_id] = [get_slot_number(), get_policy_id() ];

  const {utxo, txid, sender_address, hashed_token_name, metadata_pathname, batched_tokens} = data;

  cmd.runSync([
    `${CARDANO_CLI} transaction build`,
    CARDANO_NETWORK_TYPE,
    CARDANO_ERA,
    `--tx-in ${utxo}#${txid}`,
    `--tx-out ${sender_address}+${minimum_lovelace}+"1 ${policy_id}.${hashed_token_name}"${batched_tokens}`,
    `--change-address ${SEND_CHANGE_TO_ADDRESS}`,
    `--mint="1 ${policy_id}.${hashed_token_name}"`,
    `--minting-script-file ${_account}/policy/policy.script`,
    `--metadata-json-file ./_nft/metadata/${metadata_pathname}`,
    `--invalid-hereafter ${slot_number}`,
    `--witness-override 2`,
    `--out-file ${_account}/tx/matx.raw`
  ].join(" "));
};

const signTx = (): void => {
  cmd.runSync([
    `${CARDANO_CLI} transaction sign`,
    `--signing-key-file ${_account}/keys/payment.skey `,
    `--signing-key-file ${_account}/policy/policy.skey `,
    `${CARDANO_NETWORK_TYPE} --tx-body-file ${_account}/tx/matx.raw`,
    `--out-file ${_account}/tx/matx.signed`
  ].join(" "));
};

const submit = async (): Promise<boolean> => {
  let status: boolean = false;
  try{
    const response = await cmd.runSync([
      `${CARDANO_CLI} transaction submit --tx-file ${_account}/tx/matx.signed ${CARDANO_NETWORK_TYPE}`
    ].join(" "));
    if(response.data.includes("success")) status = true;
  } catch(err){
    status = false
  };

  return status;
}

const mint_nft = async () => {

  const correct_amount = await metadataFind(["correct_amount"]);
  
  if(!correct_amount.length) return;

  const max_iteration: number = correct_amount.length >= 30 ? 30 : correct_amount.length;

  for(let i = 0; i < max_iteration; i++){

    const data = correct_amount[i];

    if(!data) continue;

    buildRawTx(data);

    const minimum_lovelace = calcMinimumFee();

    buildRealTx(data, minimum_lovelace);

    signTx();

    const status = await submit();

    if(!status) continue;
    
    await metadataUpdate(data._id, {status: "minted"});

    console.log("------------------------------------------------------------------------")
    console.log(`> ${data.metadata_pathname} sent to: \n${data.sender_address}`)
    console.log("------------------------------------------------------------------------")
  };

}

export const on_mint_nft = () => setInterval(async () => await mint_nft(), 10000);