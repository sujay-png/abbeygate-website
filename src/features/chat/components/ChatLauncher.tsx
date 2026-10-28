'use client';

import React from 'react';

interface ChatLauncherProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export function ChatLauncher({ isOpen, onClick, unreadCount = 0 }: ChatLauncherProps) {
  return (
    <aside
      aria-label="Customer Support Chat"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={
          isOpen
            ? 'Close support chat'
            : unreadCount > 0
            ? `Open support chat (${unreadCount} new reply)`
            : 'Open live customer support chat'
        }
        aria-expanded={isOpen}
        className={`group relative flex items-center justify-center transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 ${
          isOpen
            ? 'w-10 h-10 rounded-full bg-[#34143d] text-[#f7f1e2] hover:bg-[#25102d] shadow-md border border-[#d4af37]/40 scale-95'
            : 'w-[56px] sm:w-[60px] h-[38px] sm:h-[40px] rounded-full bg-[#4b2255] hover:bg-[#3d1847] text-[#f7f1e2] shadow-[0_4px_16px_rgba(75,34,85,0.4)] hover:shadow-[0_6px_22px_rgba(75,34,85,0.55)] border-[1.5px] border-[#c5a059] hover:scale-105 active:scale-95'
        }`}
      >
        {isOpen ? (
          // Clean Close (✕)
          <svg
            className="w-4 h-4 text-[#f7f1e2] transition-transform duration-200 group-hover:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Small oval with 3 dots (...)
          <div className="flex items-center justify-center gap-1.5 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f7f1e2] shadow-xs group-hover:scale-110 transition-transform" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#f7f1e2] shadow-xs group-hover:scale-110 transition-transform" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#f7f1e2] shadow-xs group-hover:scale-110 transition-transform" />
          </div>
        )}

        {/* UNREAD REPLIES BADGE: (1), (2), etc. */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-2.5 -right-2 flex items-center justify-center px-1.5 py-0.5 min-w-[22px] h-[20px] rounded-full bg-[#d4af37] text-[#250d2c] text-[10px] font-black font-sans shadow-md border-2 border-white leading-none animate-pulse">
            ({unreadCount})
          </span>
        )}
      </button>
    </aside>
  );
}
