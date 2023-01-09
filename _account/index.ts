import fs from 'fs';
import { CARDANO_CLI_PATH, CARDANO_NETWORK_TYPE } from '../variables';
const cmd: any = require("node-cmd");

const _account = "./_account";

export const generatePayment = (): void => {
    cmd.runSync([
        CARDANO_CLI_PATH,
        "address key-gen",
        `--verification-key-file ${_account}/keys/payment.vkey` ,
        `--signing-key-file ${_account}/keys/payment.skey`
    ].join(" "));

    cmd.runSync([
        CARDANO_CLI_PATH,
        "address build",
        `--payment-verification-key-file ${_account}/keys/payment.vkey` ,
        `--out-file ${_account}/keys/payment.addr`,
        `${CARDANO_NETWORK_TYPE}`
    ].join(" "));

    cmd.runSync([
        CARDANO_CLI_PATH,
        "query protocol-parameters",
        `${CARDANO_NETWORK_TYPE}`,
        `--out-file ${_account}/protocol.json` ,
    ].join(" "));
};

export const generatePolicy = (hours: number): void => {

    cmd.runSync([
        CARDANO_CLI_PATH,
        "address key-gen",
        `--verification-key-file ${_account}/policy/policy.vkey` ,
        `--signing-key-file ${_account}/policy/policy.skey`
    ].join(" "));

    const keyHashData = cmd.runSync([
        CARDANO_CLI_PATH,
        "address key-hash",
        `--payment-verification-key-file ${_account}/policy/policy.vkey`
    ].join(" "));

    const keyhash = keyHashData.data;

    const slotData = cmd.runSync([
        CARDANO_CLI_PATH,
        "query tip",
        `${CARDANO_NETWORK_TYPE}`,
    ].join(" "));

    const {slot} = JSON.parse(slotData.data.split('\n').join(" ").replace("'", ""));

    const policy_script = {
        "type": "all",
        "scripts":
        [
        {
            "type": "before",
            "slot": Number(slot) + hours * 3600
        },
        {
            "type": "sig",
            "keyHash": keyhash.replace("\n", "")
        }
        ]
    };

    fs.writeFileSync(`${__dirname}/../_account/policy/policy.script`, JSON.stringify(policy_script));

    const response = cmd.runSync([
        CARDANO_CLI_PATH,
        "transaction policyid",
        `--script-file ${_account}/policy/policy.script`
    ].join(" "));

    fs.writeFileSync(`${__dirname}/../_account/policy/policyID`, response.data.replace('\n', ""));

};

