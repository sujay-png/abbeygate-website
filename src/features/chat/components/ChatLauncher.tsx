'use client';

import React from 'react';

interface ChatLauncherProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export function ChatLauncher({ isOpen, onClick, unreadCount = 0 }: ChatLauncherProps) {
  // When chat window is open, hide the launcher completely so it doesn't peek behind the chat window
  if (isOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Customer Support Chat"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={
          unreadCount > 0
            ? `Open Abbeygate customer care (${unreadCount} new reply)`
            : 'Open Abbeygate customer care chat'
        }
        aria-expanded={false}
        className="group relative flex items-center justify-center w-[54px] sm:w-[58px] h-[38px] sm:h-[40px] rounded-full bg-[#4b2255] hover:bg-[#3d1847] text-[#f7f1e2] shadow-[0_4px_18px_rgba(75,34,85,0.45)] hover:shadow-[0_6px_24px_rgba(75,34,85,0.6)] border-[1.5px] border-[#c5a059] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
      >
        {/* Crisp oval speech dots (...) */}
        <div className="flex items-center justify-center gap-[5px] px-2">
          <span className="w-[5px] h-[5px] rounded-full bg-[#f7f1e2] shadow-xs group-hover:scale-115 transition-transform" />
          <span className="w-[5px] h-[5px] rounded-full bg-[#f7f1e2] shadow-xs group-hover:scale-115 transition-transform" />
          <span className="w-[5px] h-[5px] rounded-full bg-[#f7f1e2] shadow-xs group-hover:scale-115 transition-transform" />
        </div>

        {/* UNREAD REPLIES BADGE: (1), (2), etc. */}
        {unreadCount > 0 && (
          <span className="absolute -top-2.5 -right-2 flex items-center justify-center px-1.5 py-0.5 min-w-[22px] h-[20px] rounded-full bg-[#d4af37] text-[#250d2c] text-[10px] font-black font-sans shadow-md border-2 border-white leading-none animate-pulse">
            ({unreadCount})
          </span>
        )}
      </button>
    </aside>
  );
}
