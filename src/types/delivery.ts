export interface ParcelInput {
  weight: number;
  dimensions: string;
}

export interface CreateDeliveryInput {
  courierId: string;
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
  country: string;
  comment?: string;
  parcel: ParcelInput[];
}

export interface UpdateDeliveryInput {
  status?: 'in-progress' | 'completed';
  address1?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  comment?: string;
  courierId?: string;
}
