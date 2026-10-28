'use client';

import React from 'react';

interface ChatLauncherProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export function ChatLauncher({ isOpen, onClick, unreadCount = 0 }: ChatLauncherProps) {
  return (
    <aside aria-label="Customer Support Chat" className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={isOpen ? 'Close support chat' : 'Open live customer support chat'}
        aria-expanded={isOpen}
        className={`group relative flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-full shadow-[0_8px_30px_rgba(75,34,85,0.35)] transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 ${
          isOpen
            ? 'bg-[#34143d] text-white hover:bg-[#25102d] scale-95'
            : 'bg-gradient-to-r from-[#4b2255] via-[#3f1c48] to-[#2c1035] text-white hover:scale-105 hover:shadow-[0_12px_36px_rgba(75,34,85,0.48)] border border-[#d4af37]/40'
        }`}
      >
        {isOpen ? (
          // Close state icon
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90 text-[#f7f1e2]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-[13px] font-semibold tracking-wide font-sans text-[#f7f1e2]">Close</span>
          </div>
        ) : (
          // Open state with purple oval + bouncing "..." dots
          <div className="flex items-center gap-2.5">
            {/* Animated speech bubble with "..." */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f7f1e2] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#f7f1e2] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#f7f1e2] animate-bounce" />
              </div>

              {/* Online pulse dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#4b2255]" />
              </span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[13px] sm:text-[14px] font-bold tracking-wide font-sans text-white leading-tight">
                Chat with us
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#e8dbbd] font-medium leading-tight">
                Live Support • Human Team
              </span>
            </div>

            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#d4af37] text-[#25102d] rounded-full shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </button>
    </aside>
  );
}
