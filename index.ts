import * as dotenv from 'dotenv';
dotenv.config({path: process.cwd() + '/config.env'});

import { generatePolicy, generatePayment } from './_account';
import { cleanNftStorage, mintImagesAndMetadata } from './_generate_nft';

// cleanNftStorage();

require('./_mongodb');

require('./_payment_listen');

require('./_payment_refund');

require('./_payment_mint');