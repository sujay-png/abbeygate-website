'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { WooCommerceOrder } from '@/features/account/services/orders';
import type { ChatTopic, OrderIssueType, ChatMessage } from '../types/chat';
import { ChatOrderPicker } from './ChatOrderPicker';
import { ChatProductPicker } from './ChatProductPicker';
import { ChatIssuePicker } from './ChatIssuePicker';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOPIC_SUGGESTIONS: Array<{
  id: ChatTopic;
  label: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'order_issue',
    label: 'Order Issue or Enquiry',
    desc: 'Damaged item, replacement, tracking, or order question',
    icon: '📦',
  },
  {
    id: 'general',
    label: 'General or Product Question',
    desc: 'Notebooks, leather goods, pens, or lead times',
    icon: '💬',
  },
  {
    id: 'artwork_proof',
    label: 'Bespoke Branding & Proofing',
    desc: 'Foil blocking, blind debossing, or logo artwork',
    icon: '🎨',
  },
  {
    id: 'billing',
    label: 'Invoice & Payment Enquiry',
    desc: 'VAT invoice copy, payment queries, or receipts',
    icon: '🧾',
  },
];

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // User session state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [orders, setOrders] = useState<WooCommerceOrder[]>([]);

  // Guided flow state
  const [selectedTopic, setSelectedTopic] = useState<ChatTopic | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WooCommerceOrder | { id: number; number: string; line_items: any[] } | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<OrderIssueType | null>(null);
  const [selectedIssueLabel, setSelectedIssueLabel] = useState<string | null>(null);

  // Active ticket tracking (for live thread replies)
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [activeTicketNumber, setActiveTicketNumber] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);

  // Guest details state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);

  // Message input state
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load user session and orders
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/chat/session');
        const data = await res.json();
        if (data.isLoggedIn) {
          setIsLoggedIn(true);
          setUserName(data.user?.name || '');
          setUserEmail(data.user?.email || '');
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.warn('Failed to load chat session:', err);
      }
    }
    loadSession();
  }, []);

  // Initialize welcome messages or restore cached active ticket
  useEffect(() => {
    try {
      const savedTicketId = localStorage.getItem('abbeygate_chat_ticket_id');
      const savedTicketNum = localStorage.getItem('abbeygate_chat_ticket_num');
      const savedGuestEmail = localStorage.getItem('abbeygate_chat_guest_email');
      const savedGuestName = localStorage.getItem('abbeygate_chat_guest_name');

      if (savedGuestEmail) setGuestEmail(savedGuestEmail);
      if (savedGuestName) setGuestName(savedGuestName);

      if (savedTicketId && savedTicketNum) {
        setActiveTicketId(Number(savedTicketId));
        setActiveTicketNumber(savedTicketNum);
        // Load existing ticket thread
        fetchTicketThread(Number(savedTicketId), savedTicketNum);
        return;
      }
    } catch {
      // LocalStorage not accessible
    }

    // Default initial greeting if no active ticket
    const initialGreeting = userName ? `Hello ${userName}! 👋` : 'Hello! 👋';

    setMessages([
      {
        id: 'msg-welcome-1',
        sender: 'bot',
        text: `${initialGreeting} Welcome to Abbeygate England. How can our customer care team assist you today?`,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-welcome-2',
        sender: 'bot',
        text: 'Please choose an option below, or feel free to type your enquiry directly:',
        topics: TOPIC_SUGGESTIONS,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [userName]);

  // Poll ticket thread if an active ticket exists
  useEffect(() => {
    if (!activeTicketId || !isOpen) return;

    const interval = setInterval(() => {
      fetchTicketThread(activeTicketId, activeTicketNumber || '');
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTicketId, activeTicketNumber, isOpen]);

  // Helper to fetch full ticket thread from API
  const fetchTicketThread = async (ticketId: number, ticketNum: string) => {
    try {
      const res = await fetch(`/api/chat/ticket?id=${ticketId}`);
      const data = await res.json();
      if (data.success && data.ticket) {
        const ticket = data.ticket;
        setTicketStatus(ticket.status);

        const threadMessages: ChatMessage[] = [];

        // Initial ticket message from customer
        threadMessages.push({
          id: `ticket-initial-${ticket.id}`,
          sender: 'user',
          text: ticket.subject || 'Customer Enquiry',
          createdAt: ticket.created_at,
          ticketMeta: {
            ticketId: ticket.id,
            ticketNumber: ticketNum,
            status: ticket.status,
          },
        });

        // Thread replies (customer & staff)
        if (ticket.messages && Array.isArray(ticket.messages)) {
          ticket.messages.forEach((msg: any) => {
            threadMessages.push({
              id: `ticket-msg-${msg.id}`,
              sender: msg.sender === 'staff' ? 'staff' : 'user',
              authorName: msg.author_name || (msg.sender === 'staff' ? 'Abbeygate Team' : 'You'),
              text: msg.message,
              createdAt: msg.created_at,
            });
          });
        }

        setMessages(threadMessages);
      }
    } catch (err) {
      console.warn('Error fetching ticket thread:', err);
    }
  };

  // Reset conversation to start a new chat
  const handleResetConversation = () => {
    try {
      localStorage.removeItem('abbeygate_chat_ticket_id');
      localStorage.removeItem('abbeygate_chat_ticket_num');
    } catch {}

    setActiveTicketId(null);
    setActiveTicketNumber(null);
    setTicketStatus(null);
    setSelectedTopic(null);
    setSelectedOrder(null);
    setSelectedItemName(null);
    setSelectedIssueType(null);
    setSelectedIssueLabel(null);
    setShowGuestForm(false);
    setInputText('');

    setMessages([
      {
        id: 'msg-welcome-new-1',
        sender: 'bot',
        text: 'How else can our customer care team help you today?',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-welcome-new-2',
        sender: 'bot',
        text: 'Please select a topic below or type your message:',
        topics: TOPIC_SUGGESTIONS,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  // Topic selection handler
  const handleTopicSelect = (topic: ChatTopic, label: string) => {
    setSelectedTopic(topic);

    // Add user selection bubble
    const userMsg: ChatMessage = {
      id: `msg-topic-${Date.now()}`,
      sender: 'user',
      text: label,
      createdAt: new Date().toISOString(),
    };

    if (topic === 'order_issue') {
      const botResponse: ChatMessage = {
        id: `msg-bot-order-${Date.now()}`,
        sender: 'bot',
        text: orders.length > 0
          ? 'Great, let’s get this sorted for you. Please select the order you need help with:'
          : 'Please enter your order number so we can look up your details:',
        showOrderPicker: true,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg, botResponse]);
    } else {
      let promptText = 'Please describe your enquiry below so our team can immediately look into it:';
      if (topic === 'artwork_proof') {
        promptText = 'Our master blocking workshop handles all foil stamping and debossing proofing. What would you like to know about your logo or artwork?';
      } else if (topic === 'billing') {
        promptText = 'We can assist with VAT invoices, corporate receipts, or payment queries. Please let us know what you need:';
      }

      const botResponse: ChatMessage = {
        id: `msg-bot-prompt-${Date.now()}`,
        sender: 'bot',
        text: promptText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg, botResponse]);
      inputRef.current?.focus();
    }
  };

  // Order selection handler
  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);

    const userMsg: ChatMessage = {
      id: `msg-order-selected-${Date.now()}`,
      sender: 'user',
      text: `Order #${order.number || order.id}`,
      createdAt: new Date().toISOString(),
    };

    const hasItems = order.line_items && order.line_items.length > 0;
    const botMsg: ChatMessage = {
      id: `msg-bot-product-${Date.now()}`,
      sender: 'bot',
      text: hasItems
        ? `Which item from Order #${order.number || order.id} is this regarding?`
        : `What item or part of Order #${order.number || order.id} would you like help with?`,
      showProductPicker: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // Skip order selection
  const handleSkipOrder = () => {
    setSelectedOrder(null);
    const userMsg: ChatMessage = {
      id: `msg-skip-order-${Date.now()}`,
      sender: 'user',
      text: 'General question about an order',
      createdAt: new Date().toISOString(),
    };
    const botMsg: ChatMessage = {
      id: `msg-bot-skip-${Date.now()}`,
      sender: 'bot',
      text: 'No problem. Please describe your order enquiry or question below:',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    inputRef.current?.focus();
  };

  // Product selection handler
  const handleSelectProduct = (productName: string) => {
    setSelectedItemName(productName);

    const userMsg: ChatMessage = {
      id: `msg-prod-${Date.now()}`,
      sender: 'user',
      text: productName,
      createdAt: new Date().toISOString(),
    };

    const botMsg: ChatMessage = {
      id: `msg-bot-issue-${Date.now()}`,
      sender: 'bot',
      text: 'What seems to be the issue with this item?',
      showIssuePicker: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // Issue selection handler
  const handleSelectIssue = (issue: OrderIssueType, label: string) => {
    setSelectedIssueType(issue);
    setSelectedIssueLabel(label);

    const userMsg: ChatMessage = {
      id: `msg-issue-${Date.now()}`,
      sender: 'user',
      text: label,
      createdAt: new Date().toISOString(),
    };

    const botMsg: ChatMessage = {
      id: `msg-bot-type-${Date.now()}`,
      sender: 'bot',
      text: 'Understood. Please describe what happened below so our team can resolve this for you immediately:',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Handle message submission
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    // If guest and no contact info provided, open contact form
    if (!isLoggedIn && !guestEmail && !activeTicketId) {
      setShowGuestForm(true);
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setIsSubmitting(true);

    // If there is already an active ticket, send follow-up reply
    if (activeTicketId) {
      const userMsg: ChatMessage = {
        id: `msg-user-reply-${Date.now()}`,
        sender: 'user',
        text: messageText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch('/api/chat/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_id: activeTicketId,
            message: messageText,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.error || 'Failed to send reply. Please try again.');
        }
      } catch (err) {
        console.error('Failed to send reply:', err);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Otherwise, create a new support ticket
    const tempUserMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const payload = {
        message: messageText,
        category: selectedTopic || 'general',
        order_id: selectedOrder ? selectedOrder.id : undefined,
        order_items: selectedItemName || undefined,
        issue_type_label: selectedIssueLabel || undefined,
        page_url: typeof window !== 'undefined' ? window.location.href : pathname,
        guest_name: guestName.trim() || undefined,
        guest_email: guestEmail.trim() || undefined,
      };

      const res = await fetch('/api/chat/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.ticket_id && data.ticket_number) {
        setActiveTicketId(data.ticket_id);
        setActiveTicketNumber(data.ticket_number);
        setTicketStatus('open');

        try {
          localStorage.setItem('abbeygate_chat_ticket_id', String(data.ticket_id));
          localStorage.setItem('abbeygate_chat_ticket_num', data.ticket_number);
          if (guestEmail) localStorage.setItem('abbeygate_chat_guest_email', guestEmail);
          if (guestName) localStorage.setItem('abbeygate_chat_guest_name', guestName);
        } catch {}

        const confirmationMsg: ChatMessage = {
          id: `msg-confirm-${Date.now()}`,
          sender: 'bot',
          text: `Thank you! Your ticket reference is **#${data.ticket_number}**.\n\nOur customer care team has been notified and will review your message shortly. Updates will also be sent to your email. Feel free to send more messages here anytime!`,
          ticketMeta: {
            ticketId: data.ticket_id,
            ticketNumber: data.ticket_number,
            status: 'open',
          },
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, confirmationMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          sender: 'bot',
          text: `We couldn't log your ticket: ${data.error || 'Please try again or email enquiries@abbeygate-england.com'}.`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      console.error('Chat submit error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'bot',
        text: 'An unexpected connection error occurred. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customer Care Live Chat"
      className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 flex flex-col w-full sm:w-[400px] h-full sm:h-[620px] max-h-[100dvh] sm:max-h-[85vh] bg-[#faf6ee] sm:rounded-2xl shadow-[0_20px_60px_rgba(37,16,45,0.45)] border border-[#d4af37]/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      {/* 1. CHAT HEADER */}
      <div className="bg-gradient-to-r from-[#4b2255] via-[#3d1847] to-[#280c32] p-4 text-white flex items-center justify-between shrink-0 border-b border-[#d4af37]/40 shadow-md">
        <div className="flex items-center gap-3">
          {/* Avatar / Monogram */}
          <div className="relative w-10 h-10 rounded-full bg-white/10 border border-[#d4af37]/60 flex items-center justify-center shadow-inner">
            <span className="font-serif font-bold text-base text-[#f7f1e2] tracking-tighter">
              AG
            </span>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#4b2255]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-bold font-sans tracking-wide text-white">
                Abbeygate Customer Care
              </h3>
            </div>
            <p className="text-[11px] text-[#e8dbbd] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Human Support • Walsall, England
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {activeTicketId && (
            <button
              type="button"
              onClick={handleResetConversation}
              title="Start a new conversation"
              className="p-1.5 rounded-lg text-[#e8dbbd] hover:text-white hover:bg-white/10 transition-colors text-[11px] flex items-center gap-1 mr-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat window"
            className="p-1.5 rounded-lg text-[#e8dbbd] hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* TICKET STATUS BANNER (If Active) */}
      {activeTicketNumber && (
        <div className="bg-[#f0e8d8] px-4 py-2 border-b border-[#dfd4c0] text-[11px] text-[#4b2255] flex items-center justify-between shrink-0 font-sans">
          <div className="flex items-center gap-2">
            <span className="font-bold">Ticket #{activeTicketNumber}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#4b2255] text-white text-[10px] uppercase font-bold tracking-wider">
              {ticketStatus || 'Active'}
            </span>
          </div>
          <span className="text-[10px] text-gray-500">Live thread</span>
        </div>
      )}

      {/* 2. CHAT MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-gray-300">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isStaff = msg.sender === 'staff';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in duration-200`}
            >
              {/* Author header for staff */}
              {isStaff && (
                <span className="text-[10px] font-bold text-[#4b2255] uppercase tracking-wider ml-1">
                  {msg.authorName || 'Abbeygate Care Team'}
                </span>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed font-sans shadow-2xs whitespace-pre-line ${
                  isUser
                    ? 'bg-[#4b2255] text-white rounded-br-none'
                    : isStaff
                    ? 'bg-white text-brand-body border-2 border-[#4b2255]/30 rounded-bl-none shadow-sm'
                    : 'bg-white text-brand-body border border-[#e5decb] rounded-bl-none'
                }`}
              >
                {msg.text}

                {/* Ticket Meta Pill in confirmation bubble */}
                {msg.ticketMeta && (
                  <div className="mt-2.5 pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#4b2255]">
                      Ref: #{msg.ticketMeta.ticketNumber}
                    </span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Notification Sent
                    </span>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-gray-400 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Interactive Topics Suggestions */}
              {msg.topics && !selectedTopic && !activeTicketId && (
                <div className="w-full mt-2 grid grid-cols-1 gap-2">
                  {msg.topics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTopicSelect(t.id, t.label)}
                      className="w-full text-left p-3 rounded-xl border border-[#e5decb] bg-white hover:border-[#4b2255] hover:bg-[#fbf8f0] transition-all duration-150 flex items-start gap-3 group shadow-2xs"
                    >
                      <span className="text-lg shrink-0 mt-0.5">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-brand-body group-hover:text-[#4b2255] font-sans">
                          {t.label}
                        </div>
                        {t.desc && (
                          <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                            {t.desc}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Order Picker Subcomponent */}
              {msg.showOrderPicker && !selectedOrder && !activeTicketId && (
                <div className="w-full">
                  <ChatOrderPicker
                    orders={orders}
                    isLoggedIn={isLoggedIn}
                    onSelectOrder={handleSelectOrder}
                    onSkipOrder={handleSkipOrder}
                  />
                </div>
              )}

              {/* Product Picker Subcomponent */}
              {msg.showProductPicker && selectedOrder && !selectedItemName && !activeTicketId && (
                <div className="w-full">
                  <ChatProductPicker
                    lineItems={selectedOrder.line_items || []}
                    orderNumber={String(selectedOrder.number || selectedOrder.id)}
                    onSelectProduct={handleSelectProduct}
                  />
                </div>
              )}

              {/* Issue Picker Subcomponent */}
              {msg.showIssuePicker && selectedItemName && !selectedIssueType && !activeTicketId && (
                <div className="w-full">
                  <ChatIssuePicker onSelectIssue={handleSelectIssue} />
                </div>
              )}
            </div>
          );
        })}

        {isSubmitting && (
          <div className="flex items-center gap-2 text-gray-500 text-[12px] italic pl-2">
            <span className="w-2 h-2 rounded-full bg-[#4b2255] animate-ping" />
            Connecting with customer care team...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. GUEST CONTACT DETAILS MODAL/INLINE FORM (If not logged in) */}
      {showGuestForm && !isLoggedIn && !activeTicketId && (
        <div className="p-3.5 bg-[#f5ede0] border-t border-[#e2d5bd] space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#4b2255] font-sans">
              Where should our team send our reply?
            </span>
            <button
              type="button"
              onClick={() => setShowGuestForm(false)}
              className="text-[11px] text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="px-2.5 py-1.5 text-[12px] border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#4b2255]"
            />
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Your email address *"
              className="px-2.5 py-1.5 text-[12px] border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#4b2255]"
              required
            />
          </div>
          <button
            type="button"
            disabled={!guestEmail.trim()}
            onClick={() => {
              setShowGuestForm(false);
              handleSendMessage();
            }}
            className="w-full py-1.5 bg-[#4b2255] text-white text-[12px] font-bold rounded-md hover:bg-[#34143d] transition-colors disabled:opacity-50"
          >
            Confirm &amp; Send Message
          </button>
        </div>
      )}

      {/* 4. CHAT INPUT BAR */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t border-[#dfd4c0] flex items-end gap-2 shrink-0"
      >
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={1}
          placeholder={
            activeTicketId
              ? 'Type a reply to Abbeygate staff...'
              : selectedIssueType
              ? 'Describe what happened...'
              : 'Type your message here...'
          }
          className="flex-1 max-h-24 min-h-[40px] resize-none px-3.5 py-2.5 text-[13px] border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4b2255]/40 focus:border-[#4b2255] font-sans text-brand-body placeholder-gray-400"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSubmitting}
          aria-label="Send message"
          className="w-10 h-10 rounded-xl bg-[#4b2255] text-white flex items-center justify-center hover:bg-[#34143d] transition-all disabled:opacity-40 disabled:hover:bg-[#4b2255] shrink-0 shadow-sm"
        >
          <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
