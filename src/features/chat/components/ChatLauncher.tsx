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
            ? `Open support chat (${unreadCount} unread ${unreadCount === 1 ? 'reply' : 'replies'})`
            : 'Open live customer support chat'
        }
        aria-expanded={isOpen}
        className={`group relative flex items-center justify-center transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 ${
          isOpen
            ? 'w-12 h-12 rounded-full bg-[#34143d] text-white hover:bg-[#25102d] shadow-lg scale-95 border border-[#d4af37]/30'
            : 'w-14 sm:w-16 h-10 sm:h-11 rounded-full bg-gradient-to-br from-[#4b2255] via-[#3a1843] to-[#250d2c] text-white hover:scale-108 shadow-[0_8px_25px_rgba(75,34,85,0.42)] hover:shadow-[0_12px_32px_rgba(75,34,85,0.58)] border border-[#d4af37]/50'
        }`}
      >
        {isOpen ? (
          // Close state icon
          <svg
            className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90 text-[#f7f1e2]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Small oval button containing just the animated "..." dots
          <div className="relative flex items-center justify-center w-full h-full">
            {/* The 3 Dots (...) */}
            <div className="flex items-center gap-1.5 px-2">
              <span className="w-2 h-2 rounded-full bg-[#f7f1e2] shadow-xs group-hover:scale-110 transition-transform animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-[#f7f1e2] shadow-xs group-hover:scale-110 transition-transform animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-[#f7f1e2] shadow-xs group-hover:scale-110 transition-transform animate-bounce" />
            </div>

            {/* Small subtle online dot on the bottom edge */}
            {unreadCount === 0 && (
              <span className="absolute bottom-1 right-2.5 flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
            )}
          </div>
        )}

        {/* UNREAD REPLIES BADGE: (1), (2), etc. */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-2.5 -right-2 flex items-center z-10 animate-bounce">
            {/* Glow ping ring */}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-60" />
            
            {/* Gold Pill Badge with (1) */}
            <span className="relative inline-flex items-center justify-center px-1.5 py-0.5 min-w-[22px] h-[20px] rounded-full bg-gradient-to-r from-[#edd999] via-[#d4af37] to-[#b3881b] text-[#250d2c] text-[11px] font-black font-sans shadow-md border-2 border-[#3a1843] leading-none">
              ({unreadCount})
            </span>
          </div>
        )}
      </button>
    </aside>
  );
}
