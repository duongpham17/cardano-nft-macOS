import TrackerModel, { TrackerDocument, TrackerInput } from '../_model/tracker';
import MetadataModel, { MetadataDocument, MetadataInput } from '../_model/metadata';

export const trackerCreate = async (): Promise<void> => {
    await TrackerModel.create({mint_number: 0});
    console.log("tracker document created");
};

export const trackerFindAll = async (): Promise<TrackerDocument> => {
    const tracker = await TrackerModel.find();
    return tracker[0]
};

export const trackerUpdate = async (_id: string, data: TrackerInput) => {
    await TrackerModel.findByIdAndUpdate(_id, data, {new: true});
};

export const metadataFindAll = async (): Promise<MetadataDocument[]> => {
    const metadata = await MetadataModel.find();
    return metadata
};

export const metadataFind = async (status: string[]): Promise<MetadataDocument[]> => {
    const metadata = await MetadataModel.find({status});
    return metadata
};

export const metadataFindOne = async (utxo: string, status: string[]): Promise<MetadataDocument | null> => {
    const metadata = await MetadataModel.findOne({utxo, status});
    return metadata;
};

export const metadataCreate = async (data: MetadataInput): Promise<void> => {
    await MetadataModel.create(data);
};

export const metadataUpdate = async (id: string, data: MetadataInput): Promise<MetadataDocument | null> => {
    const metadata = await MetadataModel.findByIdAndUpdate(id, data, {new: true});
    return metadata;
};