import { CARDANO_CLI, CARDANO_NETWORK_TYPE } from '../variables';

const cmd: any = require("node-cmd");

(() => {
    const _account = "./_account";
    
    cmd.runSync([
        `${CARDANO_CLI} address key-gen`,
        `--verification-key-file ${_account}/keys/payment.vkey` ,
        `--signing-key-file ${_account}/keys/payment.skey`
    ].join(" "));

    cmd.runSync([
        `${CARDANO_CLI} address build`,
        `--payment-verification-key-file ${_account}/keys/payment.vkey` ,
        `--out-file ${_account}/keys/payment.addr`,
        `${CARDANO_NETWORK_TYPE}`
    ].join(" "));

    cmd.runSync([
        `${CARDANO_CLI} query protocol-parameters`,
        `${CARDANO_NETWORK_TYPE}`,
        `--out-file ${_account}/protocol.json` ,
    ].join(" "));

    console.log("************************************************************")
    console.log(`Payment keys created, successful`);
    console.log("************************************************************")
    
})();