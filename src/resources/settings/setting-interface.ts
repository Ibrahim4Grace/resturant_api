export interface ISetting {
    _id: string;
    tax_rate: number;
    delivery_fee: number;
    app_commission: number;
    rider_commission: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateSetting {
    tax_rate: number;
    delivery_fee: number;
    app_commission: number;
    rider_commission: number;
}

export interface IUpdateSetting {
    tax_rate: number;
    delivery_fee: number;
    app_commission: number;
    rider_commission: number;
}
