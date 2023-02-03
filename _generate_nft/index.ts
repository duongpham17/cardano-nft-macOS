import fs from 'fs';
import axios from 'axios';
import { PROJECT_NAME, TOTAL_MINT, get_policy_id } from '../variables';
import { createCanvas, loadImage } from 'canvas';
import { NFTStorage, Blob } from 'nft.storage';
import { layers, width, height, Layer } from './layers';
import { metadataDeleteAll } from '../_controller';

/* Variables - Replace with your own project **************************/

const fileExtension = "png";

const nft_storage_api_token = process.env.NFT_STORAGE_API_TOKEN;

/********************************************************************/

const totalMetadata = (): number => {
    const total = fs.readdirSync(`${__dirname}/../_nft/metadata`).length;
    return total;
}

const uploadNftToStorage = async (image: any): Promise<{ url: string; ipfs: string}> => {
    const storage = new NFTStorage({ token: nft_storage_api_token || "" });
    const blob = new Blob([image]);
    const cid = await storage.storeBlob(blob);
    return {
        url: `ipfs://${cid}`,
        ipfs: cid
    }
};

const selectRandomElement = (layer: string[]): string => {
    const total_elements = Number(layer.length);
    const element_index = Math.floor(Math.random() * total_elements);
    const element_selected = layer[element_index];
    return element_selected;
};

const layerTracker = (layers: Layer[], layer_created: string[] ) => {

    const tracker = JSON.parse(fs.readFileSync(`${__dirname}/../_nft/tracker.json`, 'utf-8'));

    const is_empty = Object.keys(tracker).length === 0;

    const updateTracker = (obj: any) => {
        const updated = {...obj};
        for(let i = 0; i <= layers.length - 1; i++) updated[layers[i].name][layer_created[i]] += 1;
        fs.writeFileSync(`${__dirname}/../_nft/tracker.json`, JSON.stringify(updated));
        return updated
    };

    const newTracker = () => {
        const new_tracker: any = {};
        for(let i = 0; i <= layers.length - 1; i++){
            new_tracker[layers[i].name] = {};
            layers[i].elements.forEach((element) => new_tracker[layers[i].name] = {
                ...new_tracker[layers[i].name],
                [element] : 0
            })
        };
        updateTracker(new_tracker);
    };

    if(is_empty) return newTracker();

    const updated_tracker = updateTracker(tracker);

    console.log("------------------------------------------------------------------------")
    console.log(updated_tracker);
};

const addMetaData = (mint_number: number, nft_layers: string[], ipfs: string): void => {

    const policy_id = get_policy_id() as string;

    const layer_name_order = layers.map((lay: Layer) => lay.name);

    const attributes = layer_name_order.reduce((obj, item: string, index: number) => Object.assign(obj, { [item]: nft_layers[index] }), {});

    // check this website for the latest metadata tempalte, https://cips.cardano.org/cips/cip25/
    const metadata = {
        "721": {
          [policy_id]: {
            [`${PROJECT_NAME}${mint_number}`]: {
                name: `${PROJECT_NAME} #${mint_number}`,
                ...attributes,
                image:["ipfs://", ipfs],
                website:'https://www.example.com',
                creator:'TD & LN',
                }   
            }
        }
    };

    //ensure the metadata.json file has no space E.g projectname 1.json is wrong do projectname1.json, will cause issue when minting nft, --out-file issues
    fs.writeFileSync(`${__dirname}/../_nft/metadata/${PROJECT_NAME}${mint_number}.json`, JSON.stringify(metadata));

    layerTracker(layers, nft_layers);

    console.log("------------------------------------------------------------------------")
    const total = totalMetadata();
    console.log(`Total NFT created: ${total}`);
};

const drawLayer = async (): Promise<void> => {        

    const total_metadata = fs.readdirSync(`${__dirname}/../_nft/metadata`).length;

    const total_layers = layers.length;

    const mint_number = total_metadata + 1;

    const nft_layers: string[] = [];

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    for(let layer of layers){
        const random_element: string = selectRandomElement(layer.elements);
        const element_location: string = `${layer.location}${random_element}.${fileExtension}`;
        const generate_layer = await loadImage(element_location);
        ctx.drawImage(generate_layer, 0, 0, width, height);

        nft_layers.push(random_element);

        const is_layered = nft_layers.length === total_layers;

        if(is_layered) {

            // create final image
            const buffer = canvas.toBuffer(`image/${fileExtension}`);

            // Save image to nft folder for looking at the nft, nothing else.
            fs.writeFileSync(`${__dirname}/../_nft/nft/${PROJECT_NAME}${mint_number}.${fileExtension}`, buffer);

            const storage = await uploadNftToStorage(buffer);

            addMetaData(mint_number, nft_layers, storage.ipfs);

        }
    };

    console.log("------------------------------------------------------------------------")
    console.log(`Layer created: ${nft_layers}`);
    console.log("------------------------------------------------------------------------")
};

export const mintImagesAndMetadata = async (): Promise<void> => {

    const isTrackerJSonFileExist = fs.existsSync(`${__dirname}/../_nft/tracker.json`);
    if(!isTrackerJSonFileExist) fs.writeFileSync(`${__dirname}/../_nft/tracker.json`, JSON.stringify({}));

    const isMetadataFolderExist = fs.existsSync(`${__dirname}/../_nft/metadata`);
    if(!isMetadataFolderExist) fs.mkdirSync(`${__dirname}/../_nft/metadata`, { recursive: true});

    const isNftExist = fs.existsSync(`${__dirname}/../_nft/nft`);
    if(!isNftExist) fs.mkdirSync(`${__dirname}/../_nft/nft`, { recursive: true});

    const is_max_mint = totalMetadata() === TOTAL_MINT;
    if(is_max_mint) return;
    for(let i = 0; i <= TOTAL_MINT; i++) await drawLayer();
    
};

export const cleanNftStorage = async (): Promise<void> => {

    const api = axios.create({
        baseURL: `https://api.nft.storage`,
        headers: { Authorization: `Bearer ${nft_storage_api_token}` }
    });

    setInterval(async () => {

        const {data} = await api.get("/");

        const storage = data.value;
        
        let accumulator = 0;
    
        for(let i of storage) {
            await api.delete(`/${i.cid}`);
            accumulator++;
    
            console.log("------------------------------------------------------------------------")
            console.log('deleted', i.cid)
            console.log(accumulator, "/", storage.length);
        }
    }, 30000);

};

/* 

    If you plan on deleting and restarting, make sure to run this function first then generate new payment policy keys

*/
export const clearAllNftsAndMetadata = async () => {
    const policy_id = get_policy_id();
    fs.rmSync(`${__dirname}/../_nft/tracker.json`, { recursive: true, force: true })
    fs.rmSync(`${__dirname}/../_nft/nft`, { recursive: true, force: true })
    fs.rmSync(`${__dirname}/../_nft/metadata`, { recursive: true, force: true });

    try{
        await metadataDeleteAll(policy_id);
    } catch(err){
        console.log("Database is not connected, nothing has been deleted from the database");
    }
    
    console.log("Deleted all nfts and metadata files and database, successful")
};
