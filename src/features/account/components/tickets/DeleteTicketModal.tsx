'use client';

import React, { useEffect, useState } from 'react';

interface DeleteTicketModalProps {
  isOpen: boolean;
  ticketNumber: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteTicketModal({
  isOpen,
  ticketNumber,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteTicketModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-ticket-title"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Badge - Soft muted wine red */}
        <div className="w-14 h-14 rounded-full bg-[#fbf5f5] text-[#8a333d] flex items-center justify-center mx-auto mb-4 border border-[#edd8db]">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        {/* Modal Heading & Text */}
        <div className="text-center">
          <h3 id="delete-ticket-title" className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight font-sans">
            Delete Support Ticket?
          </h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Are you sure you want to delete ticket{' '}
            <span className="font-semibold text-brand-primary font-mono">{ticketNumber}</span>?
            This ticket and its conversation history will be permanently removed from your account.
          </p>
        </div>

        {/* Action Buttons - Symmetrically centered & balanced */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-brand-cream/60 active:bg-brand-cream rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#8a333d] hover:bg-[#732831] active:bg-[#5f2028] rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </>
            ) : (
              'Yes, Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
