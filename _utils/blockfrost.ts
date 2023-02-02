import { BlockFrostAPI } from "@blockfrost/blockfrost-js";

const blockfrost_api_token: any = process.env.BLOCKFROST_API_TOKEN;

export const blockfrost = new BlockFrostAPI({ projectId: blockfrost_api_token});

console.log("Blockfrost (API) connection successful!")
