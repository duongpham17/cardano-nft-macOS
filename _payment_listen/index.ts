import { CARDANO_CLI_PATH, CARDANO_NETWORK_TYPE, COST_OF_NFT, WALLET_ADDRESS, TOTAL_MINT, PROJECT_NAME} from '../variables';
import { MetadataInput } from '../_model/metadata';
import { blockfrost } from '../_utils/blockfrost';
import { trackerFindAll, trackerUpdate, metadataCreate, metadataFindOne, metadataFindAll} from '../_utils/controller';

const cmd:any = require("node-cmd");

const isAmountCorrect = (amount: number | string): boolean => {
    return Number(amount) === (COST_OF_NFT);
};

const getSenderAddress = async (utxo: string): Promise<string> => {
    const response = await blockfrost.txsUtxos(utxo);
    return response.inputs[0].address;
};

const getUtxoTable = (): string[] => {
    const rawUtxoTable = cmd.runSync([
        CARDANO_CLI_PATH,
        "query utxo",
        CARDANO_NETWORK_TYPE,
        `--address ${WALLET_ADDRESS}`,
    ].join(" "));
    
    // Calculate total lovelace of the UTXO(s) inside the wallet address
    const utxoTableRows: string[] = rawUtxoTable.data.trim().split('\n').splice(2);

    console.log("************************************************************************");
    console.log(new Date());
    console.log("utxo length", utxoTableRows.length);

    return utxoTableRows;
};

interface MintTracker {
    metadata_pathname: string, 
    hashed_token_name?: string,
    mint_number: number, 
    is_max_mint: boolean,
}

const nft_tracker = async (): Promise<MintTracker> => {
    const { mint_number, _id } = await trackerFindAll();
    
    const updated_mint_number = mint_number+1;
    const project_metadata_id = `${PROJECT_NAME}${updated_mint_number}`;
    const metadata_pathname = `${project_metadata_id}.json`;
    const is_max_mint = updated_mint_number > TOTAL_MINT;

    const data: MintTracker = { 
        metadata_pathname, 
        mint_number: updated_mint_number, 
        is_max_mint
    };

    if(is_max_mint) return data;
    
    const hashed_token_name = Buffer.from(project_metadata_id, 'utf8').toString('hex');

    await trackerUpdate(_id, {mint_number: updated_mint_number});

    return {...data, hashed_token_name};
}

const listen_for_payment = async () => {

    const utxo_table = getUtxoTable();

    const max_iteration: number = utxo_table.length >= 100 ? 100 : utxo_table.length;

    for (let i = 0; i < max_iteration; i++) {

        const [utxo, txid, amount_in_lovelace] = utxo_table[i].split(" ").filter((s: string) => s);

        const is_metadata_processed = await metadataFindOne(utxo, ["refund", "refunded", "correct_amount", "minted"])

        if(is_metadata_processed) continue;

        const is_correct_amount = isAmountCorrect(amount_in_lovelace);

        const sender_address: string = await getSenderAddress(utxo);

        const data: MetadataInput = {
            utxo,
            txid,
            sender_address,
            amount_in_lovelace,
            status: "refund",
        };

        if(!is_correct_amount) return await metadataCreate(data);

        const {metadata_pathname, is_max_mint, hashed_token_name} = await nft_tracker();

        if(is_max_mint) return await metadataCreate(data);

        const data_correct: MetadataInput = {
            ...data,
            amount_in_ada: (Number(amount_in_lovelace) / 1000000).toFixed(6),
            metadata_pathname,
            hashed_token_name,
            status: "correct_amount"
        }

        await metadataCreate(data_correct);

    };

    const tracker = await trackerFindAll();

    const metadata = await metadataFindAll();

    const total = metadata.reduce((acc: any, curr) => {
        return {...acc, [curr.status]: acc[curr.status] + 1}
    }, {
        pending: 0,
        refund: 0,
        refunded: 0,
        correct_amount: 0,
        minted: 0
    });

    console.log("total", total);
    console.log("tracker mint number", tracker.mint_number);
}

setInterval(async () => {
    await listen_for_payment();
}, 15000);
