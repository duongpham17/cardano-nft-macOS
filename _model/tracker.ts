// NOTE generate this file manually 

import mongoose from 'mongoose';

export interface TrackerInput {
    mint_number: number
};

export interface TrackerDocument extends TrackerInput, mongoose.Document {
    _id: string
};

const trackerSchema = new mongoose.Schema({
    mint_number: {
        type: Number,
        default: 0
    }
});

export default mongoose.model<TrackerDocument>('Tracker', trackerSchema);