import React from 'react';
import type { TicketStatus } from '../../types/ticket';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className = '' }: TicketStatusBadgeProps) {
  const configs: Record<TicketStatus, { label: string; text: string }> = {
    open: {
      label: 'Open',
      text: 'text-amber-700',
    },
    in_progress: {
      label: 'In Progress',
      text: 'text-sky-700',
    },
    waiting_customer: {
      label: 'Awaiting Reply',
      text: 'text-brand-primary',
    },
    resolved: {
      label: 'Resolved',
      text: 'text-emerald-700',
    },
    closed: {
      label: 'Closed',
      text: 'text-gray-500',
    },
  };

  const config = configs[status] || configs.open;

  return (
    <span className={`font-semibold text-xs tracking-wide ${config.text} ${className}`}>
      {config.label}
    </span>
  );
}
