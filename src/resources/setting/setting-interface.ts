export interface ISetting {
    _id: string;
    key: string;
    value: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateSetting {
    key: string;
    value: string;
    description?: string;
}

export interface IUpdateSetting {
    value: string;
    description?: string;
}
