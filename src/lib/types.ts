export type PCStatus =
  | 'offline'
  | 'active'
  | 'warning'
  | 'pending_extension'
  | 'expired';

export interface PC {
  id: string;
  name: string;
  status: PCStatus;
}
