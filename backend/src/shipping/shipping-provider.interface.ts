export interface ShippingQuoteInput {
  postalCode: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface ShippingOption {
  provider: string;
  service: string;
  label: string;
  cost: string;
  currency: 'ARS';
  estimatedDeliveryDays: number;
}

export interface ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingOption[]>;
}
