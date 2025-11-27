export type PCStatus =
  | 'available'
  | 'in_use'
  | 'pending_payment'
  | 'pending_approval'
  | 'maintenance'
  | 'unavailable';

export interface PC {
  id: string;
  name: string;
  status: PCStatus;
  user?: string;
  session_start?: string;
  session_duration?: number;
}
