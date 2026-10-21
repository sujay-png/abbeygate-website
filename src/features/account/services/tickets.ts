'use server';

import { getSession } from '@/features/auth/utils/session';
import { revalidatePath } from 'next/cache';
import type {
  TicketListItem,
  TicketDetail,
  CreateTicketInput,
} from '../types/ticket';

function getStoreUrl(): string {
  return (
    process.env.WOOCOMMERCE_STORE_URL ||
    process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL ||
    'https://dashboard.abbeygate-england.com'
  ).replace(/\/$/, '');
}

function getHeadlessSecret(): string {
  return process.env.WP_HEADLESS_SECRET || 'a9718d4e0887ce1bc851ad90b0b4a39742623ce5eb94faf28a5bfe8abc584eb3';
}

/**
 * Fetch all support tickets belonging to the logged-in customer.
 */
export async function getCustomerTickets(userId: number): Promise<TicketListItem[]> {
  const session = await getSession();
  if (!session || Number(session.userId) !== Number(userId)) {
    return [];
  }

  try {
    const storeUrl = getStoreUrl();
    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets?customer_id=${userId}`, {
      method: 'GET',
      headers: {
        'x-headless-secret': getHeadlessSecret(),
      },
      next: { revalidate: 0 }, // fresh data on view
    });

    if (!res.ok) {
      console.error('Failed to fetch tickets:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return data.tickets || [];
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    return [];
  }
}

/**
 * Fetch full details and conversation thread of a specific ticket.
 */
export async function getTicketDetail(
  ticketIdOrNumber: string | number,
  userId: number
): Promise<TicketDetail | null> {
  const session = await getSession();
  if (!session || Number(session.userId) !== Number(userId)) {
    return null;
  }

  try {
    const storeUrl = getStoreUrl();
    const res = await fetch(
      `${storeUrl}/wp-json/headless/v1/tickets/${ticketIdOrNumber}?customer_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'x-headless-secret': getHeadlessSecret(),
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.ticket || null;
  } catch (error) {
    console.error('Error fetching ticket detail:', error);
    return null;
  }
}

/**
 * Create a new support ticket.
 */
export async function createCustomerTicket(
  input: CreateTicketInput
): Promise<{ success: boolean; ticket_id?: number; ticket_number?: string; error?: string }> {
  const session = await getSession();
  if (!session || !session.userId) {
    return { success: false, error: 'You must be logged in to raise a ticket.' };
  }

  if (!input.subject?.trim() || !input.message?.trim()) {
    return { success: false, error: 'Please enter a subject and describe your issue.' };
  }

  try {
    const storeUrl = getStoreUrl();
    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': getHeadlessSecret(),
      },
      body: JSON.stringify({
        customer_id: session.userId,
        subject: input.subject.trim(),
        message: input.message.trim(),
        category: input.category || 'general',
        order_id: input.order_id || null,
        order_items: input.order_items || null,
        priority: input.priority || 'normal',
      }),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data?.message || 'Failed to submit ticket. Please try again.' };
    }

    revalidatePath('/account/tickets');
    return {
      success: true,
      ticket_id: data.ticket_id,
      ticket_number: data.ticket_number,
    };
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return { success: false, error: error?.message || 'An unexpected error occurred.' };
  }
}

/**
 * Send a follow-up reply on a ticket from the customer.
 */
export async function replyCustomerTicket(
  ticketId: number | string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !session.userId) {
    return { success: false, error: 'You must be logged in to reply.' };
  }

  if (!message?.trim()) {
    return { success: false, error: 'Reply message cannot be empty.' };
  }

  try {
    const storeUrl = getStoreUrl();
    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': getHeadlessSecret(),
      },
      body: JSON.stringify({
        customer_id: session.userId,
        message: message.trim(),
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data?.message || 'Failed to send reply.' };
    }

    revalidatePath(`/account/tickets/${ticketId}`);
    revalidatePath('/account/tickets');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending ticket reply:', error);
    return { success: false, error: error?.message || 'Failed to send reply.' };
  }
}

/**
 * Mark a ticket as resolved by the customer.
 */
export async function closeCustomerTicket(
  ticketId: number | string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !session.userId) {
    return { success: false, error: 'You must be logged in.' };
  }

  try {
    const storeUrl = getStoreUrl();
    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets/${ticketId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': getHeadlessSecret(),
      },
      body: JSON.stringify({
        customer_id: session.userId,
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data?.message || 'Failed to update ticket.' };
    }

    revalidatePath(`/account/tickets/${ticketId}`);
    revalidatePath('/account/tickets');
    return { success: true };
  } catch (error: any) {
    console.error('Error closing ticket:', error);
    return { success: false, error: error?.message || 'Failed to close ticket.' };
  }
}
