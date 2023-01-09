import mongoose from 'mongoose';

export interface MetadataInput {
    utxo: string,
    txid: string,
    amount_in_lovelace: string,
    status: "pending" | "refund" | "refunded" | "correct_amount" | "minted",
    amount_in_ada?: string,
    metadata_pathname?: string,
    hashed_token_name?: string,
    sender_address?: string,
};

export interface MetadataDocument extends MetadataInput, mongoose.Document {
    _id: string,
    created_at: Date
};

const metadataSchema = new mongoose.Schema({
    utxo:{
        type: String
    },
    txid: {
        type: String
    },
    amount_in_lovelace: {
        type: String
    },
    status:{
        type: String,
        enum: ["pending", "refund", "refunded", "correct_amount", "minted"],
        default: "pending"
    },
    amount_in_ada:{
        type: String
    },
    metadata_pathname:{
        type: String
    },
    hashed_token_name:{
        type: String,
    },
    sender_address:{
        type: String
    },
    created_at: {
        type: Date,
        default: new Date()
    }
});

export default mongoose.model<MetadataDocument>('Metadata', metadataSchema);