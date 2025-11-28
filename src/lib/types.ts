export type PCStatus =
  | 'available'
  | 'in_use'
  | 'pending_payment'
  | 'pending_approval'
  | 'maintenance'
  | 'unavailable'
  | 'time_up';

export type PaymentMethod = 'GCash' | 'Maya' | 'QR Code';

export interface PC {
  id: string;
  name: string;
  status: PCStatus;
  user?: string;
  email?: string;
  session_start?: string;
  session_duration?: number;
  paymentMethod?: PaymentMethod;
}

export interface PricingTier {
  value: string;
  label: string;
  price: number;
}
