'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import type { TicketDetail, TicketStatus } from '../../types/ticket';
import { TicketStatusBadge } from './TicketStatusBadge';
import { replyCustomerTicket, closeCustomerTicket } from '../../services/tickets';

interface TicketDetailClientProps {
  ticket: TicketDetail;
}

export function TicketDetailClient({ ticket: initialTicket }: TicketDetailClientProps) {
  const [ticket, setTicket] = useState<TicketDetail>(initialTicket);
  const [replyText, setReplyText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isClosing, startClosingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isResolvedOrClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  const categoryLabels: Record<string, string> = {
    order_issue: 'Order Status & Fulfilment',
    delivery_tracking: 'Delivery & Courier Tracking',
    artwork_proof: 'Artwork, Foil & Logo Proofing',
    product_quality: 'Product Quality or Damaged Item',
    return_refund: 'Return or Refund Request',
    billing: 'Invoice & Payment Enquiry',
    general: 'General Enquiry',
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setError(null);

    const messageToSend = replyText.trim();

    startTransition(async () => {
      const result = await replyCustomerTicket(ticket.id, messageToSend);
      if (result.success) {
        // Optimistically add message to thread
        const newMessage = {
          id: Date.now(),
          sender: 'customer' as const,
          author_name: ticket.customer_name || 'You',
          message: messageToSend,
          created_at: new Date().toISOString(),
        };

        setTicket((prev) => ({
          ...prev,
          status: 'open',
          messages: [...prev.messages, newMessage],
        }));

        setReplyText('');
      } else {
        setError(result.error || 'Failed to send reply. Please try again.');
      }
    });
  };

  const handleCloseTicket = () => {
    if (!confirm('Are you sure you want to mark this ticket as resolved?')) return;
    setError(null);

    startClosingTransition(async () => {
      const result = await closeCustomerTicket(ticket.id);
      if (result.success) {
        setTicket((prev) => ({
          ...prev,
          status: 'resolved',
        }));
      } else {
        setError(result.error || 'Failed to close ticket.');
      }
    });
  };

  const formattedDate = new Date(ticket.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <Link
          href="/account/tickets"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Tickets
        </Link>

        {!isResolvedOrClosed && (
          <button
            type="button"
            onClick={handleCloseTicket}
            disabled={isClosing}
            className="text-xs font-semibold px-3 py-1.5 rounded border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            {isClosing ? 'Updating...' : '✓ Mark as Resolved'}
          </button>
        )}
      </div>

      {/* Ticket Header Summary */}
      <div className="bg-brand-cream/40 border border-brand-border rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-brand-primary bg-white px-2.5 py-1 rounded border border-brand-border">
              #{ticket.ticket_number}
            </span>
            <TicketStatusBadge status={ticket.status as TicketStatus} />
          </div>
          <span className="text-xs text-gray-500">Created on {formattedDate}</span>
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-brand-primary-dark font-sans tracking-tight mt-2">
          {ticket.subject}
        </h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 pt-3 border-t border-brand-border/60 text-xs text-gray-600">
          <div>
            <span className="font-semibold text-gray-800">Category: </span>
            {categoryLabels[ticket.category] || ticket.category}
          </div>

          {ticket.order_id && (
            <div>
              <span className="font-semibold text-gray-800">Linked Order: </span>
              <Link
                href={`/account/orders/${ticket.order_id}`}
                className="font-semibold text-brand-primary hover:underline"
              >
                Order #{ticket.order_id} ↗
              </Link>
            </div>
          )}

          {ticket.priority && (
            <div>
              <span className="font-semibold text-gray-800">Priority: </span>
              <span className="uppercase font-medium text-gray-700">{ticket.priority}</span>
            </div>
          )}
        </div>

        {ticket.order_items && (
          <div className="mt-2.5 pt-2 border-t border-brand-border/40 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Items Referenced: </span>
            <span>{ticket.order_items}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {/* Conversation Thread */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Conversation Thread ({ticket.messages.length})
        </h3>

        <div className="space-y-4">
          {ticket.messages.map((msg, index) => {
            const isStaff = msg.sender === 'staff';
            const msgDate = new Date(msg.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id || index}
                className={`p-5 rounded-lg border transition-all ${
                  isStaff
                    ? 'bg-brand-cream/60 border-brand-gold/70 border-l-4 border-l-brand-gold shadow-sm'
                    : 'bg-white border-gray-200 border-l-4 border-l-brand-primary shadow-sm'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {isStaff ? (
                      <>
                        <div className="w-7 h-7 rounded-full bg-brand-primary text-brand-gold flex items-center justify-center font-bold text-xs">
                          A
                        </div>
                        <div>
                          <span className="text-sm font-bold text-brand-primary-dark">
                            {msg.author_name || 'Abbeygate Customer Care'}
                          </span>
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-gold/20 text-brand-primary border border-brand-gold/30">
                            Support Team
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-brand-tint text-brand-primary flex items-center justify-center font-bold text-xs">
                          {ticket.customer_name ? ticket.customer_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {index === 0 ? `${msg.author_name || 'You'} (Original Request)` : (msg.author_name || 'You')}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{msgDate}</span>
                </div>

                <div className="text-sm text-brand-body whitespace-pre-wrap leading-relaxed pl-9">
                  {msg.message}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply Section */}
      <div className="pt-4 border-t border-gray-200">
        {isResolvedOrClosed && (
          <div className="p-3.5 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              This ticket is currently marked as <strong>{ticket.status}</strong>. If you still need help, sending a reply below will automatically reopen it for our support team.
            </span>
          </div>
        )}

        <form onSubmit={handleSendReply} className="space-y-3">
          <label htmlFor="replyText" className="block text-sm font-semibold text-gray-900">
            Write a Reply
          </label>
          <textarea
            id="replyText"
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your response or follow-up question here..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            required
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Our team will review your reply and you will receive an email update.
            </span>
            <button
              type="submit"
              disabled={isPending || !replyText.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending Reply...
                </>
              ) : (
                'Send Reply'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
