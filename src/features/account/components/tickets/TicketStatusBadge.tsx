import React from 'react';
import type { TicketStatus } from '../../types/ticket';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className = '' }: TicketStatusBadgeProps) {
  const configs: Record<
    TicketStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    open: {
      label: 'Open',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
    },
    waiting_customer: {
      label: 'Awaiting Your Reply',
      bg: 'bg-purple-50',
      text: 'text-brand-primary',
      border: 'border-brand-primary/20',
      dot: 'bg-brand-primary',
    },
    resolved: {
      label: 'Resolved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    closed: {
      label: 'Closed',
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      dot: 'bg-gray-400',
    },
  };

  const config = configs[status] || configs.open;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
