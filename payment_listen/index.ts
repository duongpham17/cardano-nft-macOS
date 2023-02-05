import { CARDANO_CLI, CARDANO_NETWORK_TYPE, COST_OF_NFT, TOTAL_MINT, PROJECT_NAME, get_wallet_address, get_policy_id} from '../variables';
import { IMetadata } from '../_model/metadata';
import { blockfrost } from '../_utils/blockfrost';
import { metadataMintNumber, metadataCreate, metadataFindAll, metadataFind, metadataFindUtxo} from '../_controller';

const cmd:any = require("node-cmd");

const isAmountCorrect = (amount: number | string): boolean => {
    return Number(amount) === (COST_OF_NFT);
};

const getSenderAddress = async (utxo: string): Promise<string> => {
    try{
        const response = await blockfrost.txsUtxos(utxo);
        return response.inputs[0].address;
    } catch(_) {
        console.log("Check blockfrost api, check if your using the correct api key for the environment")
        return ""
    }
};

const getUtxoTable = async(): Promise<string[]> => {

    const WALLET_ADDRESS = get_wallet_address();

    const gifted = await metadataFind(["gift"]);

    const rawUtxoTable = cmd.runSync([
        CARDANO_CLI,
        "query utxo",
        CARDANO_NETWORK_TYPE,
        `--address ${WALLET_ADDRESS}`,
    ].join(" "));
    
    const utxoTableRows: string[] = rawUtxoTable.data.trim().split('\n').splice(2);

    const gifted_ids = gifted.map(el => el.utxo);

    const utxos: string[] = [];

    if(gifted_ids.length){
        for(let x of utxoTableRows){
            for(let i of gifted_ids){
            const exist = x.includes(i);
            if(!exist) utxos.push(x)
            }
        };
    }

    console.log("------------------------------------------------------------------------")
    console.log(new Date());
    console.log("utxo length", utxos.length);

    return !utxos.length ? utxoTableRows : utxos;
};

interface MintTracker {
    metadata_pathname: string, 
    hashed_token_name?: string,
    mint_number: number, 
    is_max_mint: boolean,
}

const nft_tracker = async (): Promise<MintTracker> => {

    const mint_number = await metadataMintNumber();
    
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

    return {...data, hashed_token_name};
}

const payments = async () => {
    const policy_id = get_policy_id() as string;

    const utxo_table = await getUtxoTable();

    const max_iteration: number = utxo_table.length >= 100 ? 100 : utxo_table.length;

    for (let i = 0; i < max_iteration; i++) {

        const [utxo, txid, amount_in_lovelace] = utxo_table[i].split(" ").filter((s: string) => s);
        
        const config_tokens = utxo_table[i].split(" ").filter(s => s).slice(5, -1).filter(s => s !== "+");
        const batch_tokens_for_output = config_tokens.map((el: any, index: number, items: string[]) => index % 2 === 0 ? `+"${el} ${items[index+1]}"` : "").filter((s: any) => s).join("")
        
        const is_metadata_pending = await metadataFindUtxo(utxo)

        if(is_metadata_pending) continue;

        const sender_address: string = await getSenderAddress(utxo);

        const data: IMetadata = {
            policy_id,
            utxo,
            txid,
            sender_address,
            amount_in_lovelace,
            status: "refund",
            createdAt: new Date(),
            batched_tokens: batch_tokens_for_output
        };

        const is_under_lovelace_required_for_a_refund = 5000000 >= Number(amount_in_lovelace);
        if(is_under_lovelace_required_for_a_refund) return await metadataCreate({...data, status: "gift"});

        const is_correct_amount = isAmountCorrect(amount_in_lovelace);
        if(!is_correct_amount) return await metadataCreate(data);

        const {metadata_pathname, is_max_mint, hashed_token_name} = await nft_tracker();
        if(is_max_mint) return await metadataCreate(data);

        const data_correct: IMetadata = {
            ...data,
            amount_in_ada: (Number(amount_in_lovelace) / 1000000).toFixed(6),
            metadata_pathname,
            hashed_token_name,
            status: "correct_amount"
        }

        await metadataCreate(data_correct);

    };

    const metadata = await metadataFindAll();

    const total = metadata.reduce((acc: any, curr) => {
        return {...acc, [curr.status]: acc[curr.status] + 1}
    }, {
        pending: 0,
        refund: 0,
        refunded: 0,
        correct_amount: 0,
        minted: 0,
        gift: 0
    });

    console.log("Transactions", total);
}

export const on_payments = () => setInterval(async () => await payments(), 10000);
