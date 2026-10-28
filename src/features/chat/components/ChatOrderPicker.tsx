'use client';

import React, { useState } from 'react';
import type { WooCommerceOrder } from '@/features/account/services/orders';

interface ChatOrderPickerProps {
  orders: WooCommerceOrder[];
  isLoggedIn: boolean;
  onSelectOrder: (order: WooCommerceOrder | { id: number; number: string; line_items: any[] }) => void;
  onSkipOrder: () => void;
  onBack: () => void;
}

export function ChatOrderPicker({
  orders,
  isLoggedIn,
  onSelectOrder,
  onSkipOrder,
  onBack,
}: ChatOrderPickerProps) {
  const [manualOrderId, setManualOrderId] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(!isLoggedIn || orders.length === 0);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderId.trim() || isLookingUp) return;

    setLookupError(null);
    setIsLookingUp(true);

    try {
      const res = await fetch(`/api/chat/order-lookup?orderId=${encodeURIComponent(manualOrderId.trim())}`);
      const data = await res.json();

      if (data.success && data.order) {
        onSelectOrder(data.order);
      } else {
        // Even if lookup fails in test environments, still let customer proceed with their typed number
        onSelectOrder({
          id: parseInt(manualOrderId.replace(/\D/g, ''), 10) || 0,
          number: manualOrderId.trim(),
          line_items: [],
        });
      }
    } catch {
      // Fallback: proceed with typed number
      onSelectOrder({
        id: parseInt(manualOrderId.replace(/\D/g, ''), 10) || 0,
        number: manualOrderId.trim(),
        line_items: [],
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="mt-2 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500 font-sans">
          {orders.length > 0 && !showManual ? 'Select your order:' : 'Order details:'}
        </span>
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] text-[#4b2255] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          &larr; Change topic
        </button>
      </div>

      {orders.length > 0 && !showManual && (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {orders.map((order) => {
            const dateStr = order.date_created
              ? new Date(order.date_created).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '';
            const itemsCount =
              order.line_items?.reduce((sum, item) => sum + item.quantity, 0) ||
              order.line_items?.length ||
              0;
            const itemsSummary = order.line_items
              ?.map((i) => i.name)
              .slice(0, 2)
              .join(', ');

            return (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order)}
                className="w-full text-left p-2.5 rounded-lg border border-[#e5decb] bg-white hover:border-[#4b2255] hover:bg-[#faf6ee] transition-all duration-150 group shadow-2xs flex flex-col gap-1 cursor-pointer"
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
                  <span>Placed {dateStr}</span>
                  <span className="capitalize">{order.status || 'Processing'}</span>
                </div>

                {itemsSummary && (
                  <div className="text-[11px] text-gray-600 truncate mt-0.5">
                    📦 {itemsSummary}
                    {order.line_items.length > 2
                      ? ` +${order.line_items.length - 2} more`
                      : ''}{' '}
                    ({itemsCount} {itemsCount === 1 ? 'item' : 'items'})
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showManual ? (
        <form
          onSubmit={handleManualSubmit}
          className="space-y-2.5 bg-white p-3 rounded-lg border border-[#e5decb] shadow-2xs"
        >
          <label className="block text-[11px] font-semibold text-gray-700">
            Please enter your Order Number:
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
              disabled={!manualOrderId.trim() || isLookingUp}
              className="px-3.5 py-1.5 bg-[#4b2255] text-white text-[12px] font-bold rounded-md hover:bg-[#34143d] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              {isLookingUp ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Finding...</span>
                </>
              ) : (
                <span>Confirm</span>
              )}
            </button>
          </div>

          {lookupError && (
            <p className="text-[11px] text-red-600">{lookupError}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            {orders.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowManual(false)}
                className="text-[11px] text-[#4b2255] font-semibold underline hover:text-[#25102d] cursor-pointer"
              >
                &larr; Choose from my order list
              </button>
            ) : (
              <span className="text-[11px] text-gray-500">
                Found on your order confirmation email
              </span>
            )}
            <button
              type="button"
              onClick={onSkipOrder}
              className="text-[11px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
            >
              Skip order selection
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="text-[11px] font-medium text-[#4b2255] hover:underline cursor-pointer"
          >
            Different order number?
          </button>
          <button
            type="button"
            onClick={onSkipOrder}
            className="text-[11px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
          >
            Skip order selection
          </button>
        </div>
      )}
    </div>
  );
}
