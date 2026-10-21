'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { TicketListItem, TicketStatus } from '../../types/ticket';
import { TicketStatusBadge } from './TicketStatusBadge';

interface TicketsListProps {
  tickets: TicketListItem[];
}

export function TicketsList({ tickets }: TicketsListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const activeTickets = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_customer'
  );
  const resolvedTickets = tickets.filter(
    (t) => t.status === 'resolved' || t.status === 'closed'
  );

  const displayedTickets =
    filter === 'active'
      ? activeTickets
      : filter === 'resolved'
      ? resolvedTickets
      : tickets;

  const categoryLabels: Record<string, string> = {
    order_issue: 'Order Issue',
    delivery_tracking: 'Delivery & Tracking',
    artwork_proof: 'Artwork & Proofing',
    product_quality: 'Product Quality',
    return_refund: 'Return / Refund',
    billing: 'Billing & Invoice',
    general: 'General Enquiry',
  };

  return (
    <div className="space-y-6">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-brand-primary-dark font-sans tracking-tight">
            Support Tickets
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Need help with an order, artwork proof, or delivery? Track all your enquiries here.
          </p>
        </div>
        <Link
          href="/account/tickets/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-sm font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Raise a Ticket
        </Link>
      </div>

      {/* Summary Stat Chips - Mobile & Desktop Responsive */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <div className="p-3 sm:p-4 rounded-lg bg-brand-cream/50 border border-brand-border">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-semibold block truncate">
            Total Tickets
          </span>
          <span className="text-lg sm:text-2xl font-bold text-brand-primary-dark mt-1 block">
            {tickets.length}
          </span>
        </div>
        <div className="p-3 sm:p-4 rounded-lg bg-brand-tint/60 border border-brand-soft">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-brand-accent font-semibold block truncate">
            Active / In Progress
          </span>
          <span className="text-lg sm:text-2xl font-bold text-brand-primary mt-1 block">
            {activeTickets.length}
          </span>
        </div>
        <div className="p-3 sm:p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-700 font-semibold block truncate">
            Resolved
          </span>
          <span className="text-lg sm:text-2xl font-bold text-emerald-800 mt-1 block">
            {resolvedTickets.length}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-gray-200 text-sm font-medium overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'border-brand-primary text-brand-primary font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          All Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
            filter === 'active'
              ? 'border-brand-primary text-brand-primary font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Active ({activeTickets.length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
            filter === 'resolved'
              ? 'border-brand-primary text-brand-primary font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Resolved ({resolvedTickets.length})
        </button>
      </div>

      {/* Tickets List View */}
      {displayedTickets.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-lg border border-dashed border-gray-300 bg-white">
          <div className="w-12 h-12 rounded-full bg-brand-tint text-brand-primary flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {filter === 'all'
              ? 'No support tickets raised yet'
              : filter === 'active'
              ? 'No active support tickets'
              : 'No resolved tickets'}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
            If you have questions about your past order, custom branding, or need help with a delivery, our dedicated team is here to assist you.
          </p>
          <Link
            href="/account/tickets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Raise a Ticket
          </Link>
        </div>
      ) : (
        <>
          {/* 1. MOBILE CARDS VIEW (Clean & Spacious on mobile screens) */}
          <div className="block md:hidden space-y-3">
            {displayedTickets.map((ticket) => {
              const formattedDate = new Date(ticket.updated_at || ticket.created_at).toLocaleDateString(
                'en-GB',
                {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }
              );

              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-lg border border-gray-200 bg-white hover:border-brand-soft transition-all space-y-2.5"
                >
                  {/* Top Bar: Ticket Number & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/account/tickets/${ticket.id}`}
                      className="font-mono text-sm font-bold text-brand-primary hover:underline flex items-center gap-1.5"
                    >
                      #{ticket.ticket_number}
                      {ticket.replies_count > 0 && (
                        <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-full bg-brand-soft/60 text-brand-accent">
                          {ticket.replies_count} {ticket.replies_count === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                    </Link>
                    <TicketStatusBadge status={ticket.status as TicketStatus} />
                  </div>

                  {/* Subject */}
                  <div>
                    <Link
                      href={`/account/tickets/${ticket.id}`}
                      className="font-semibold text-gray-900 hover:text-brand-primary text-sm line-clamp-2 transition-colors"
                    >
                      {ticket.subject}
                    </Link>
                    {ticket.order_items && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {ticket.order_items}
                      </p>
                    )}
                  </div>

                  {/* Order & Category Info */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-600">
                    {ticket.order_id && (
                      <Link
                        href={`/account/orders/${ticket.order_id}`}
                        className="inline-flex items-center gap-1 font-medium text-brand-primary bg-brand-cream/70 px-2 py-0.5 rounded border border-brand-border/70 hover:underline"
                      >
                        Order #{ticket.order_id} ↗
                      </Link>
                    )}
                    <span className="text-gray-500">
                      {categoryLabels[ticket.category] || ticket.category}
                    </span>
                  </div>

                  {/* Bottom Footer: Date & Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-400">{formattedDate}</span>
                    <Link
                      href={`/account/tickets/${ticket.id}`}
                      className="font-semibold text-brand-primary hover:underline"
                    >
                      View &amp; Reply &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. DESKTOP SPACIOUS TABLE (Proper padding and breathing room, no squishing) */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200/80">
            <table className="w-full min-w-[850px] text-left text-sm border-collapse bg-white">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="py-3.5 px-4 w-36 whitespace-nowrap">Ticket Ref</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Subject</th>
                  <th className="py-3.5 px-4 w-40 whitespace-nowrap">Related Order</th>
                  <th className="py-3.5 px-4 w-36 whitespace-nowrap">Category</th>
                  <th className="py-3.5 px-4 w-28 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 w-32 whitespace-nowrap">Last Activity</th>
                  <th className="py-3.5 px-4 w-28 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedTickets.map((ticket) => {
                  const formattedDate = new Date(ticket.updated_at || ticket.created_at).toLocaleDateString(
                    'en-GB',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }
                  );

                  return (
                    <tr key={ticket.id} className="hover:bg-brand-cream/20 transition-colors">
                      <td className="py-4 px-4 font-mono font-medium text-brand-primary whitespace-nowrap">
                        <Link
                          href={`/account/tickets/${ticket.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          #{ticket.ticket_number}
                          {ticket.replies_count > 0 && (
                            <span className="text-[11px] font-sans px-1.5 py-0.5 rounded-full bg-brand-soft/60 text-brand-accent">
                              {ticket.replies_count}
                            </span>
                          )}
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          href={`/account/tickets/${ticket.id}`}
                          className="font-medium text-gray-900 hover:text-brand-primary transition-colors block max-w-sm truncate"
                          title={ticket.subject}
                        >
                          {ticket.subject}
                        </Link>
                        {ticket.order_items && (
                          <span className="text-xs text-gray-500 block truncate max-w-sm mt-0.5">
                            {ticket.order_items}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {ticket.order_id ? (
                          <Link
                            href={`/account/orders/${ticket.order_id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline bg-brand-cream/70 px-2.5 py-1 rounded border border-brand-border/70"
                          >
                            Order #{ticket.order_id} ↗
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">General Enquiry</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-gray-600 text-xs whitespace-nowrap">
                        {categoryLabels[ticket.category] || ticket.category}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <TicketStatusBadge status={ticket.status as TicketStatus} />
                      </td>

                      <td className="py-4 px-4 text-gray-500 text-xs whitespace-nowrap">
                        {formattedDate}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/account/tickets/${ticket.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-primary-dark hover:underline"
                        >
                          View &amp; Reply &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
