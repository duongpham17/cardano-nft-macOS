import Metadatas, { IMetadata } from '../_model/metadata';

export const metadataFindAll = async (): Promise<IMetadata[]> => {
    const metadata = await Metadatas.find();
    return metadata
};

export const metadataFind = async (status: string[]): Promise<IMetadata[]> => {
    const metadata = await Metadatas.find({status});
    return metadata
};

export const metadataFindUtxo = async (utxo: string): Promise<IMetadata | null> => {
    const metadata = await Metadatas.findOne({utxo});
    return metadata
};


export const metadataFindOne = async (utxo: string, status: string[]): Promise<IMetadata | null> => {
    const metadata = await Metadatas.findOne({utxo, status});
    return metadata;
};

export const metadataCreate = async (data: IMetadata): Promise<void> => {
    await Metadatas.create(data);
};

export const metadataUpdate = async (id: string, data: Partial<IMetadata>): Promise<IMetadata | null> => {
    const metadata = await Metadatas.findByIdAndUpdate(id, data, {new: true});
    return metadata;
};

export const metadataMintNumber = async (): Promise<number> => {
    const status = ["correct_amount", "minted"];
    const minted = await Metadatas.countDocuments({status});
    return minted
}

export const metadataDeleteAll = async (policy_id: string | undefined): Promise<void> => {
    if(policy_id) await Metadatas.deleteMany({policy_id});
}