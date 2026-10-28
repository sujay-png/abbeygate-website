'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChatLauncher } from './ChatLauncher';
import { ChatWindow } from './ChatWindow';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for unread staff replies on an active ticket
  const checkUnreadReplies = useCallback(async () => {
    try {
      const activeTicketId = localStorage.getItem('abbeygate_chat_ticket_id');
      if (!activeTicketId) {
        setUnreadCount(0);
        return;
      }

      const res = await fetch(`/api/chat/ticket?id=${activeTicketId}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && data.ticket && Array.isArray(data.ticket.messages)) {
        const staffMessages = data.ticket.messages.filter(
          (m: { sender: string }) => m.sender === 'staff'
        );
        const lastSeenCount = parseInt(
          localStorage.getItem('abbeygate_chat_seen_staff_count') || '0',
          10
        );

        if (isOpen) {
          // If window is open, mark all as seen
          localStorage.setItem(
            'abbeygate_chat_seen_staff_count',
            String(staffMessages.length)
          );
          setUnreadCount(0);
        } else {
          // If closed, calculate unread replies
          const unread = Math.max(0, staffMessages.length - lastSeenCount);
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      // Ignore background fetch error
    }
  }, [isOpen]);

  // Initial check on mount
  useEffect(() => {
    if (mounted) {
      checkUnreadReplies();
    }
  }, [mounted, checkUnreadReplies]);

  // Background polling every 15s when ticket is active
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      checkUnreadReplies();
    }, 15000);
    return () => clearInterval(interval);
  }, [mounted, checkUnreadReplies]);

  // When user opens the chat, mark replies as seen
  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    try {
      const activeTicketId = localStorage.getItem('abbeygate_chat_ticket_id');
      if (activeTicketId) {
        // Fetch to update seen count
        fetch(`/api/chat/ticket?id=${activeTicketId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.ticket?.messages) {
              const staffCount = data.ticket.messages.filter(
                (m: { sender: string }) => m.sender === 'staff'
              ).length;
              localStorage.setItem('abbeygate_chat_seen_staff_count', String(staffCount));
            }
          })
          .catch(() => {});
      }
    } catch {}
  };

  // Listen for Escape key to close chat window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <ChatLauncher
        isOpen={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpenChat())}
        unreadCount={unreadCount}
      />
      {mounted && (
        <ChatWindow
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onTicketResolved={() => setUnreadCount(0)}
        />
      )}
    </>
  );
}
