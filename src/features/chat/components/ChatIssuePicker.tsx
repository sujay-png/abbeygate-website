'use client';

import React from 'react';
import type { OrderIssueType } from '../types/chat';

interface ChatIssuePickerProps {
  onSelectIssue: (issue: OrderIssueType, label: string) => void;
}

const ISSUE_OPTIONS: Array<{
  id: OrderIssueType;
  label: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'damaged_item',
    label: 'Damaged item received',
    desc: 'Item arrived scratched, torn, or damaged in transit',
    icon: '🔨',
  },
  {
    id: 'replacement_request',
    label: 'Want a replacement',
    desc: 'Need a replacement unit dispatched to me',
    icon: '🔄',
  },
  {
    id: 'tracking_delay',
    label: 'Delivery / Tracking status',
    desc: 'Where is my parcel? Need tracking update',
    icon: '🚚',
  },
  {
    id: 'wrong_item',
    label: 'Wrong item or variation',
    desc: 'Received different colour, debossing, or product',
    icon: '❌',
  },
  {
    id: 'return_refund',
    label: 'Return or refund request',
    desc: 'Request return instructions or refund',
    icon: '↩️',
  },
  {
    id: 'other_order',
    label: 'Other question about this item',
    desc: 'Bespoke query, repeat order, or care advice',
    icon: '✍️',
  },
];

export function ChatIssuePicker({ onSelectIssue }: ChatIssuePickerProps) {
  return (
    <div className="mt-2 space-y-2">
      <div className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 font-sans">
        How can we assist with this item?
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {ISSUE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectIssue(opt.id, opt.label)}
            className="text-left p-2.5 rounded-lg border border-[#e5decb] bg-white hover:border-[#4b2255] hover:bg-[#faf6ee] transition-all duration-150 flex items-start gap-2.5 group shadow-2xs"
          >
            <span className="text-base shrink-0 mt-0.5">{opt.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-brand-body group-hover:text-[#4b2255] font-sans">
                {opt.label}
              </div>
              <div className="text-[11px] text-gray-500 truncate">
                {opt.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
