import * as dotenv from 'dotenv';
dotenv.config({path: process.cwd() + '/config.env'});

import { mintImagesAndMetadata, cleanNftStorage, clearAllNftsAndMetadata } from './_generate_nft';
import { database }    from './_mongodb';

import { on_payments } from './payment_listen'; // Run after setup has been invoked.
import { on_mint_nft } from './payment_mint';   // Run after setup has been invoked.
import { on_refund }   from './payment_refund'; // Run after setup has been invoked.

/* 
    ! IMPORTANT ! Creating payment and policy keys. Run these commands in order. 
    npm run keys
    npm run policy
*/

/* 
    ! IMPORTANT ! Once the above is created. You must generate your own nfts by running mintImagesAndMetadata()
    Make sure to comment everytning else out while your generating the nfts

    You can see the nfts metadata get minted by going to _nft/metadata and _/nft/nft
*/

// mintImagesAndMetadata

// database();

// on_payments();

// on_mint_nft();

// on_refund();