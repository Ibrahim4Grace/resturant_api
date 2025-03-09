export interface ISetting {
    _id: string;
    tax_rate: number;
    delivery_fee: number;
    app_commission: number;
    rider_commission: number;
    restaurant_commission: number;
    dispute_window_hours: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateSetting {
    tax_rate: number;
    delivery_fee: number;
    app_commission: number;
    rider_commission: number;
    restaurant_commission: number;
    dispute_window_hours: number;
}

export interface IUpdateSetting {
    tax_rate: number;
    delivery_fee: number;
    app_commission: number;
    rider_commission: number;
    restaurant_commission: number;
    dispute_window_hours: number;
}
