export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketCategory =
  | 'order_issue'
  | 'delivery_tracking'
  | 'artwork_proof'
  | 'product_quality'
  | 'return_refund'
  | 'billing'
  | 'general';

export const TICKET_CATEGORIES: { id: TicketCategory; label: string; isOrderRelated?: boolean }[] = [
  { id: 'order_issue', label: 'Order Status & Fulfilment', isOrderRelated: true },
  { id: 'delivery_tracking', label: 'Delivery & Courier Tracking', isOrderRelated: true },
  { id: 'artwork_proof', label: 'Artwork, Foil & Logo Proofing', isOrderRelated: true },
  { id: 'product_quality', label: 'Product Quality or Damaged Item', isOrderRelated: true },
  { id: 'return_refund', label: 'Return or Refund Request', isOrderRelated: true },
  { id: 'billing', label: 'Invoice & Payment Enquiry' },
  { id: 'general', label: 'General / Other Enquiry' },
];

export interface TicketMessage {
  id: number | string;
  sender: 'customer' | 'staff';
  author_name: string;
  message: string;
  created_at: string;
}

export interface TicketListItem {
  id: number;
  ticket_number: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  order_id?: number | null;
  order_items?: string | null;
  created_at: string;
  updated_at: string;
  replies_count: number;
  last_reply_by: 'customer' | 'staff';
}

export interface TicketDetail extends TicketListItem {
  customer_name: string;
  messages: TicketMessage[];
}

export interface CreateTicketInput {
  subject: string;
  message: string;
  category: TicketCategory;
  order_id?: number;
  order_items?: string;
  priority?: TicketPriority;
}
