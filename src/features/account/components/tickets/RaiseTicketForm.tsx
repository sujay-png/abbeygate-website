'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WooCommerceOrder } from '../../services/orders';
import {
  TICKET_CATEGORIES,
  type TicketCategory,
  type TicketPriority,
} from '../../types/ticket';
import { createCustomerTicket } from '../../services/tickets';

interface RaiseTicketFormProps {
  orders: WooCommerceOrder[];
  initialOrderId?: string;
}

export function RaiseTicketForm({ orders, initialOrderId }: RaiseTicketFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Find initial order if specified
  const matchedInitialOrder = initialOrderId
    ? orders.find((o) => String(o.id) === String(initialOrderId) || String(o.number) === String(initialOrderId))
    : undefined;

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    matchedInitialOrder ? String(matchedInitialOrder.id) : (initialOrderId || 'none')
  );

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [category, setCategory] = useState<TicketCategory>(
    matchedInitialOrder ? 'order_issue' : 'general'
  );
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<{ ticket_number: string; id: number } | null>(
    null
  );

  // The currently selected order object
  const currentOrder = orders.find((o) => String(o.id) === selectedOrderId);

  // Toggle item selection
  const handleItemToggle = (itemName: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
    );
  };

  const handleSelectAllItems = () => {
    if (!currentOrder) return;
    if (selectedItems.length === currentOrder.line_items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentOrder.line_items.map((i) => `${i.name} (Qty: ${i.quantity})`));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError('Please provide a subject for your ticket.');
      return;
    }

    if (!message.trim()) {
      setError('Please provide details about the issue or question.');
      return;
    }

    const orderIdNum = selectedOrderId !== 'none' ? Number(selectedOrderId) : undefined;
    const orderItemsSummary = selectedItems.length > 0 ? selectedItems.join('; ') : undefined;

    startTransition(async () => {
      const result = await createCustomerTicket({
        subject,
        message,
        category,
        order_id: orderIdNum,
        order_items: orderItemsSummary,
        priority,
      });

      if (result.success && result.ticket_number && result.ticket_id) {
        setCreatedTicket({
          ticket_number: result.ticket_number,
          id: result.ticket_id,
        });
      } else {
        setError(result.error || 'Failed to submit ticket. Please try again.');
      }
    });
  };

  // If ticket is created, show celebratory success screen
  if (createdTicket) {
    return (
      <div className="py-8 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
          Ticket Received
        </span>
        <h2 className="text-2xl font-bold text-brand-primary-dark mt-1 mb-2 font-sans">
          Ticket #{createdTicket.ticket_number}
        </h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Thank you. Your support ticket has been logged and our customer care team has been notified.
          You will receive an email confirmation and can track replies in your account.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/account/tickets/${createdTicket.id}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            View Ticket &rarr;
          </Link>
          <Link
            href="/account/tickets"
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            All Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/account/tickets" className="hover:text-brand-primary flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tickets
          </Link>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-brand-primary-dark font-sans tracking-tight">
          Raise a Support Ticket
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Have an enquiry about a past order, custom branding proof, or shipment? Fill in the details below.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {/* 1. SELECT ORDER (First-Class Feature) */}
      <div className="p-5 rounded-lg bg-brand-cream/40 border border-brand-border space-y-4">
        <div>
          <label htmlFor="orderSelect" className="block text-sm font-semibold text-brand-primary-dark mb-1">
            Is this enquiry related to an existing order?
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Selecting your past order helps our team locate your items, artwork proofs, and delivery tracking instantly.
          </p>
          <select
            id="orderSelect"
            value={selectedOrderId}
            onChange={(e) => {
              setSelectedOrderId(e.target.value);
              setSelectedItems([]);
              if (e.target.value !== 'none') {
                setCategory('order_issue');
              }
            }}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="none">General Enquiry (Not related to a specific order)</option>
            {orders.map((order) => {
              const orderDate = new Date(order.date_created).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const itemCount = order.line_items?.length || 0;
              return (
                <option key={order.id} value={String(order.id)}>
                  Order #{order.number} — Placed {orderDate} (£{parseFloat(order.total).toFixed(2)}) — {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </option>
              );
            })}
          </select>
        </div>

        {/* If Order is selected, show item checklist */}
        {currentOrder && currentOrder.line_items && currentOrder.line_items.length > 0 && (
          <div className="pt-3 border-t border-brand-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-brand-primary-dark">
                Which product(s) in this order are you contacting us about? (Optional)
              </span>
              <button
                type="button"
                onClick={handleSelectAllItems}
                className="text-xs text-brand-primary hover:underline font-medium"
              >
                {selectedItems.length === currentOrder.line_items.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {currentOrder.line_items.map((item) => {
                const itemString = `${item.name} (Qty: ${item.quantity})`;
                const isChecked = selectedItems.includes(itemString);

                return (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-brand-tint border-brand-soft text-brand-primary-dark font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleItemToggle(itemString)}
                      className="mt-0.5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="leading-snug">{item.name} <span className="text-gray-500 font-normal">× {item.quantity}</span></span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. CATEGORY & PRIORITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-1">
            Issue Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            required
          >
            {TICKET_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-semibold text-gray-900 mb-1">
            Urgency / Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="normal">Normal Priority</option>
            <option value="low">Low Priority (General question)</option>
            <option value="high">High Priority (Time sensitive delivery or event)</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* 3. SUBJECT */}
      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-1">
          Subject Line <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Courier delivery status, Logo debossing question, or Damaged cover on arrival"
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          required
        />
      </div>

      {/* 4. MESSAGE DESCRIPTION */}
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-1">
          Problem Description &amp; Details <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Please describe your query in detail. Include any tracking numbers, custom specifications, or questions.
        </p>
        <textarea
          id="message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please provide full details about your issue here..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          required
        />
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Link
          href="/account/tickets"
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Creating Ticket...
            </>
          ) : (
            <>Submit Support Ticket &rarr;</>
          )}
        </button>
      </div>
    </form>
  );
}
