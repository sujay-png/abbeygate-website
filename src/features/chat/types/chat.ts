import type { WooCommerceOrder } from '@/features/account/services/orders';
import type { TicketCategory, TicketMessage } from '@/features/account/types/ticket';

export type ChatTopic =
  | 'order_issue'
  | 'general'
  | 'artwork_proof'
  | 'billing';

export type OrderIssueType =
  | 'damaged_item'
  | 'replacement_request'
  | 'tracking_delay'
  | 'wrong_item'
  | 'return_refund'
  | 'other_order';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'staff';
  text: string;
  authorName?: string;
  createdAt: string;
  // Interactive options embedded in bot messages:
  topics?: Array<{ id: ChatTopic; label: string; icon: string; desc?: string }>;
  showOrderPicker?: boolean;
  showProductPicker?: boolean;
  showIssuePicker?: boolean;
  ticketMeta?: {
    ticketId: number;
    ticketNumber: string;
    status: string;
  };
}

export interface ChatSessionState {
  isOpen: boolean;
  isLoggedIn: boolean;
  userName?: string;
  userEmail?: string;
  orders: WooCommerceOrder[];
  // Selected context during guided flow
  selectedTopic: ChatTopic | null;
  selectedOrder: WooCommerceOrder | null;
  selectedItemName: string | null;
  selectedIssueType: OrderIssueType | null;
  // Current active ticket if created
  activeTicketId: number | null;
  activeTicketNumber: string | null;
}
