import fs from 'fs';
import { CARDANO_CLI, CARDANO_NETWORK_TYPE, HOURS_BEFORE_CONTRACT_EXPIRES } from '../variables';
const cmd: any = require("node-cmd");

(() => {
    const _account = "./_account";

    cmd.runSync([
        `${CARDANO_CLI} address key-gen`,
        `--verification-key-file ${_account}/policy/policy.vkey` ,
        `--signing-key-file ${_account}/policy/policy.skey`
    ].join(" "));

    const keyHashData = cmd.runSync([
        `${CARDANO_CLI} address key-hash`,
        `--payment-verification-key-file ${_account}/policy/policy.vkey`
    ].join(" "));

    const keyhash = keyHashData.data;

    const slotData = cmd.runSync([
        `${CARDANO_CLI} query tip ${CARDANO_NETWORK_TYPE}`
    ].join(" "));

    const {slot} = JSON.parse(slotData.data.split('\n').join(" ").replace("'", ""));

    const policy_script = {
        "type": "all",
        "scripts":
        [
            {
                "type": "before",
                "slot": Number(slot) + (Number(HOURS_BEFORE_CONTRACT_EXPIRES) * 3600)
            },
            {
                "type": "sig",
                "keyHash": keyhash.replace("\n", "")
            }
        ]
    };

    fs.writeFileSync(`${__dirname}/../_account/policy/policy.script`, JSON.stringify(policy_script));

    const response = cmd.runSync([
        CARDANO_CLI,
        "transaction policyid",
        `--script-file ${_account}/policy/policy.script`
    ].join(" "));

    const policy_id = response.data.replace('\n', "");

    fs.writeFileSync(`${__dirname}/../_account/policy/policyID`, policy_id);

    console.log("************************************************************")
    console.log(`Policy scripts created, successful`);
    console.log(`Policy ID - ${policy_id}`);
    console.log("************************************************************")
})()