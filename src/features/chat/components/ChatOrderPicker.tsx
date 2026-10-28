'use client';

import React, { useState } from 'react';
import type { WooCommerceOrder } from '@/features/account/services/orders';

interface ChatOrderPickerProps {
  orders: WooCommerceOrder[];
  isLoggedIn: boolean;
  onSelectOrder: (order: WooCommerceOrder | { id: number; number: string; line_items: any[] }) => void;
  onSkipOrder: () => void;
}

export function ChatOrderPicker({
  orders,
  isLoggedIn,
  onSelectOrder,
  onSkipOrder,
}: ChatOrderPickerProps) {
  const [manualOrderId, setManualOrderId] = useState('');
  const [showManual, setShowManual] = useState(!isLoggedIn || orders.length === 0);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderId.trim()) return;

    onSelectOrder({
      id: parseInt(manualOrderId.replace(/\D/g, ''), 10) || 0,
      number: manualOrderId.trim(),
      line_items: [],
    });
  };

  return (
    <div className="mt-2 space-y-2.5">
      <div className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 font-sans">
        {orders.length > 0 ? 'Select your order:' : 'Order details:'}
      </div>

      {orders.length > 0 && !showManual && (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {orders.slice(0, 5).map((order) => {
            const dateStr = order.date_created
              ? new Date(order.date_created).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '';
            const itemsCount = order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || order.line_items?.length || 0;
            const itemsSummary = order.line_items?.map((i) => i.name).slice(0, 2).join(', ');

            return (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order)}
                className="w-full text-left p-2.5 rounded-lg border border-[#e5decb] bg-white hover:border-[#4b2255] hover:bg-[#faf6ee] transition-all duration-150 group shadow-sm flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#4b2255] group-hover:text-[#34143d] font-sans">
                    Order #{order.number || order.id}
                  </span>
                  <span className="text-[11px] font-bold text-gray-700">
                    £{parseFloat(order.total || '0').toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{dateStr}</span>
                  <span className="capitalize">{order.status || 'Processing'}</span>
                </div>

                {itemsSummary && (
                  <div className="text-[11px] text-gray-600 truncate mt-0.5">
                    📦 {itemsSummary} {order.line_items.length > 2 ? `+${order.line_items.length - 2} more` : ''} ({itemsCount} items)
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showManual ? (
        <form onSubmit={handleManualSubmit} className="space-y-2 bg-white p-3 rounded-lg border border-[#e5decb] shadow-sm">
          <label className="block text-[11px] font-medium text-gray-600">
            Enter your WooCommerce Order Number:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualOrderId}
              onChange={(e) => setManualOrderId(e.target.value)}
              placeholder="e.g. 10452 or AB-10452"
              className="flex-1 px-3 py-1.5 text-[12px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4b2255] focus:border-[#4b2255]"
              autoFocus
            />
            <button
              type="submit"
              disabled={!manualOrderId.trim()}
              className="px-3 py-1.5 bg-[#4b2255] text-white text-[12px] font-bold rounded-md hover:bg-[#34143d] transition-colors disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => setShowManual(false)}
              className="text-[11px] text-[#4b2255] underline hover:text-[#25102d]"
            >
              &larr; Choose from my recent orders
            </button>
          )}
        </form>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="text-[11px] font-medium text-[#4b2255] hover:underline"
          >
            Different order number?
          </button>
          <button
            type="button"
            onClick={onSkipOrder}
            className="text-[11px] text-gray-500 hover:text-gray-800 underline"
          >
            Skip order selection
          </button>
        </div>
      )}
    </div>
  );
}
