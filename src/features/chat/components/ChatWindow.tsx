'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLenis } from 'lenis/react';
import type { WooCommerceOrder } from '@/features/account/services/orders';
import type { ChatTopic, OrderIssueType, ChatMessage } from '../types/chat';
import { ChatOrderPicker } from './ChatOrderPicker';
import { ChatProductPicker } from './ChatProductPicker';
import { ChatIssuePicker } from './ChatIssuePicker';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketResolved?: () => void;
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

export function ChatWindow({ isOpen, onClose, onTicketResolved }: ChatWindowProps) {
  const pathname = usePathname();
  const lenis = useLenis();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // User session state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [orders, setOrders] = useState<WooCommerceOrder[]>([]);

  // Prevent background scrolling while chat window is active
  useEffect(() => {
    if (!isOpen) return;

    lenis?.stop();
    const originalOverflow = document.body.style.overflow;
    if (window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      lenis?.start();
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, lenis]);

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
        }
        // Always populate orders (sorted latest first) so customer/tester can pick easily
        setOrders(data.orders || []);
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
        fetchTicketThread(Number(savedTicketId), savedTicketNum);
        return;
      }
    } catch {
      // LocalStorage not accessible
    }

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

  // Helper to strip technical metadata headers from customer messages
  const cleanCustomerMessage = (text: string) => {
    if (!text) return '';
    if (text.includes('CUSTOMER MESSAGE:')) {
      return text.split('CUSTOMER MESSAGE:').pop()?.trim() || text;
    }
    if (text.startsWith('📍 SOURCE:') || text.includes('📍 SOURCE:')) {
      const lines = text.split('\n');
      const idx = lines.findIndex((l) => l.includes('CUSTOMER MESSAGE'));
      if (idx !== -1) {
        return lines.slice(idx + 1).join('\n').trim();
      }
      const cleanLines = lines.filter(
        (l) =>
          !l.startsWith('📍 SOURCE:') &&
          !l.startsWith('Channel:') &&
          !l.startsWith('Page:') &&
          !l.startsWith('Customer Name:') &&
          !l.startsWith('Contact Email:') &&
          !l.startsWith('Order Reference:') &&
          !l.startsWith('Selected Item') &&
          !l.startsWith('Issue Type:') &&
          !l.startsWith('---')
      );
      return cleanLines.join('\n').trim();
    }
    return text;
  };

  // Helper to fetch full ticket thread from API
  const fetchTicketThread = async (ticketId: number, ticketNum: string) => {
    try {
      const res = await fetch(`/api/chat/ticket?id=${ticketId}`);
      const data = await res.json();
      if (data.success && data.ticket) {
        const ticket = data.ticket;
        setTicketStatus(ticket.status);

        const threadMessages: ChatMessage[] = [];

        if (ticket.messages && Array.isArray(ticket.messages) && ticket.messages.length > 0) {
          ticket.messages.forEach((msg: any) => {
            threadMessages.push({
              id: `ticket-msg-${msg.id}`,
              sender: msg.sender === 'staff' ? 'staff' : 'user',
              authorName: msg.author_name || (msg.sender === 'staff' ? 'Abbeygate Customer Care' : 'You'),
              text: cleanCustomerMessage(msg.message),
              createdAt: msg.created_at,
            });
          });
        } else if (ticket.message) {
          threadMessages.push({
            id: `ticket-initial-${ticket.id}`,
            sender: 'user',
            text: cleanCustomerMessage(ticket.message),
            createdAt: ticket.created_at,
          });
        }

        setMessages(threadMessages);
      }
    } catch (err) {
      console.warn('Error fetching ticket thread:', err);
    }
  };

  // Resolve chat and bring back option selector
  const handleResolveAndShowOptions = async () => {
    if (activeTicketId) {
      fetch('/api/chat/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: activeTicketId }),
      }).catch(() => {});
    }

    try {
      localStorage.removeItem('abbeygate_chat_ticket_id');
      localStorage.removeItem('abbeygate_chat_ticket_num');
      localStorage.removeItem('abbeygate_chat_seen_staff_count');
    } catch {}

    onTicketResolved?.();

    setActiveTicketId(null);
    setActiveTicketNumber(null);
    setTicketStatus(null);
    setSelectedTopic(null);
    setSelectedOrder(null);
    setSelectedItemName(null);
    setSelectedIssueType(null);
    setSelectedIssueLabel(null);

    const userSortedMsg: ChatMessage = {
      id: `msg-sorted-${Date.now()}`,
      sender: 'user',
      text: 'Thanks, all sorted!',
      createdAt: new Date().toISOString(),
    };

    const closingMsg: ChatMessage = {
      id: `msg-closing-${Date.now()}`,
      sender: 'bot',
      text: "You're very welcome! We're glad we could help. If you ever need anything else, our team is always here for you.\n\nPlease choose an option below if you have any other questions:",
      topics: TOPIC_SUGGESTIONS,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userSortedMsg, closingMsg]);
  };

  // Reset conversation completely
  const handleResetConversation = () => {
    try {
      localStorage.removeItem('abbeygate_chat_ticket_id');
      localStorage.removeItem('abbeygate_chat_ticket_num');
      localStorage.removeItem('abbeygate_chat_seen_staff_count');
    } catch {}

    onTicketResolved?.();

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
        text: 'Please select an option below or type your enquiry:',
        topics: TOPIC_SUGGESTIONS,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  // Go back to topic selection from anywhere
  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setSelectedOrder(null);
    setSelectedItemName(null);
    setSelectedIssueType(null);
    setSelectedIssueLabel(null);

    const botMsg: ChatMessage = {
      id: `msg-back-topics-${Date.now()}`,
      sender: 'bot',
      text: 'Please choose an option below, or feel free to type your enquiry directly:',
      topics: TOPIC_SUGGESTIONS,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  // Go back to order selection
  const handleBackToOrderSelect = () => {
    setSelectedOrder(null);
    setSelectedItemName(null);
    setSelectedIssueType(null);
    setSelectedIssueLabel(null);

    const botMsg: ChatMessage = {
      id: `msg-back-orders-${Date.now()}`,
      sender: 'bot',
      text: orders.length > 0
        ? 'Please select the order you need help with (latest first):'
        : 'Please enter your order number:',
      showOrderPicker: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  // Go back to product item selection
  const handleBackToProductSelect = () => {
    setSelectedItemName(null);
    setSelectedIssueType(null);
    setSelectedIssueLabel(null);

    if (selectedOrder) {
      const hasItems = selectedOrder.line_items && selectedOrder.line_items.length > 0;
      const botMsg: ChatMessage = {
        id: `msg-back-prods-${Date.now()}`,
        sender: 'bot',
        text: hasItems
          ? `Which item from Order #${selectedOrder.number || selectedOrder.id} is this regarding? (Select one, multiple, or all):`
          : `What item or part of Order #${selectedOrder.number || selectedOrder.id} would you like help with?`,
        showProductPicker: true,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } else {
      handleBackToOrderSelect();
    }
  };

  // Topic selection handler
  const handleTopicSelect = (topic: ChatTopic, label: string) => {
    setSelectedTopic(topic);

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
          ? 'Great, let’s get this sorted for you. Please select your order from the list below (latest first):'
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
        ? `Which item from Order #${order.number || order.id} is this regarding? (Select one, multiple, or all):`
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
  const handleSelectProduct = (productSummary: string) => {
    setSelectedItemName(productSummary);

    const userMsg: ChatMessage = {
      id: `msg-prod-${Date.now()}`,
      sender: 'user',
      text: `Item(s): ${productSummary}`,
      createdAt: new Date().toISOString(),
    };

    const botMsg: ChatMessage = {
      id: `msg-bot-issue-${Date.now()}`,
      sender: 'bot',
      text: 'What seems to be the issue with the selected item(s)?',
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

    if (!isLoggedIn && !guestEmail && !activeTicketId) {
      setShowGuestForm(true);
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setIsSubmitting(true);

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
          text: 'Thank you! Your message has reached our Abbeygate care team. A representative will review your enquiry and reply to you directly here.\n\nYou will also receive updates via email. Feel free to type further details anytime!',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, confirmationMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          sender: 'bot',
          text: `We couldn't send your message: ${data.error || 'Please try again or email enquiries@abbeygate-england.com'}.`,
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
      data-lenis-prevent="true"
      onMouseEnter={() => lenis?.stop()}
      onMouseLeave={() => {
        if (isOpen && window.innerWidth >= 768) lenis?.start();
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 z-50 flex flex-col w-full sm:w-[400px] h-full sm:h-[600px] max-h-[100dvh] sm:max-h-[85vh] bg-[#faf6ee] sm:rounded-2xl shadow-[0_20px_60px_rgba(37,16,45,0.45)] border border-[#d4af37]/35 overflow-hidden overscroll-contain animate-in fade-in zoom-in-95 duration-200"
    >
      {/* 1. CHAT HEADER - Minimalist & Elegant */}
      <div className="bg-[#4b2255] px-4 py-3.5 text-white flex items-center justify-between shrink-0 border-b border-[#d4af37]/30 shadow-xs">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-bold font-sans tracking-wide text-white">
            Abbeygate Customer Care
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {activeTicketId && (
            <button
              type="button"
              onClick={handleResetConversation}
              title="Start a new conversation"
              className="px-2 py-1 rounded-md text-[#e8dbbd] hover:text-white hover:bg-white/10 transition-colors text-[11px] font-medium flex items-center gap-1 mr-1 cursor-pointer"
            >
              <span>New Chat</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat window"
            className="p-1.5 rounded-lg text-[#e8dbbd] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* TOPIC NAVIGATION BAR (When an option is chosen, allows easily coming back to change option) */}
      {selectedTopic && !activeTicketId && (
        <div className="bg-[#f0e8d8] px-3.5 py-1.5 border-b border-[#dfd4c0] text-[11px] text-[#4b2255] flex items-center justify-between shrink-0 font-sans">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-gray-500 font-medium">Topic:</span>
            <span className="font-bold capitalize">{selectedTopic.replace('_', ' ')}</span>
            {selectedOrder && (
              <>
                <span className="text-gray-400">/</span>
                <span className="font-bold">Order #{selectedOrder.number || selectedOrder.id}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleBackToTopics}
            className="text-[11px] font-bold text-[#4b2255] hover:text-[#250d2c] underline ml-2 shrink-0 cursor-pointer"
          >
            &larr; Change topic
          </button>
        </div>
      )}

      {/* 2. CHAT MESSAGES BODY - Scroll Isolated */}
      <div
        data-lenis-prevent="true"
        className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-gray-300 overscroll-contain"
      >
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const isStaff = msg.sender === 'staff';
          const isLatestStaff = isStaff && index === messages.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in duration-200`}
            >
              {isStaff && (
                <span className="text-[10px] font-bold text-[#4b2255] uppercase tracking-wider ml-1">
                  {msg.authorName || 'Abbeygate Customer Care'}
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
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-gray-400 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Quick Actions after Staff Reply */}
              {isLatestStaff && activeTicketId && (
                <div className="mt-2 flex flex-wrap gap-2 pt-1 animate-in fade-in duration-200">
                  <button
                    type="button"
                    onClick={handleResolveAndShowOptions}
                    className="px-3.5 py-1.5 rounded-full bg-[#f0e8d8] hover:bg-[#e4d7bf] text-[#4b2255] border border-[#d8cbb0] text-[11px] font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Thanks, all sorted!</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.focus()}
                    className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#faf6ee] text-[#4b2255] border border-[#4b2255]/40 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>💬</span>
                    <span>I have another question</span>
                  </button>
                </div>
              )}

              {/* Interactive Topics Suggestions */}
              {msg.topics && !selectedTopic && !activeTicketId && (
                <div className="w-full mt-2 grid grid-cols-1 gap-2">
                  {msg.topics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTopicSelect(t.id, t.label)}
                      className="w-full text-left p-3 rounded-xl border border-[#e5decb] bg-white hover:border-[#4b2255] hover:bg-[#fbf8f0] transition-all duration-150 flex items-start gap-3 group shadow-2xs cursor-pointer"
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
                    onBack={handleBackToTopics}
                  />
                </div>
              )}

              {/* Product Picker Subcomponent with Multi-Selection */}
              {msg.showProductPicker && selectedOrder && !selectedItemName && !activeTicketId && (
                <div className="w-full">
                  <ChatProductPicker
                    lineItems={selectedOrder.line_items || []}
                    orderNumber={String(selectedOrder.number || selectedOrder.id)}
                    onSelectProducts={handleSelectProduct}
                    onBack={handleBackToOrderSelect}
                    onChangeTopic={handleBackToTopics}
                  />
                </div>
              )}

              {/* Issue Picker Subcomponent with Back Navigation */}
              {msg.showIssuePicker && selectedItemName && !selectedIssueType && !activeTicketId && (
                <div className="w-full">
                  <ChatIssuePicker
                    onSelectIssue={handleSelectIssue}
                    onBack={handleBackToProductSelect}
                    onChangeTopic={handleBackToTopics}
                  />
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

      {/* 3. GUEST CONTACT DETAILS MODAL/INLINE FORM */}
      {showGuestForm && !isLoggedIn && !activeTicketId && (
        <div className="p-3.5 bg-[#f5ede0] border-t border-[#e2d5bd] space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#4b2255] font-sans">
              Where should our team send our reply?
            </span>
            <button
              type="button"
              onClick={() => setShowGuestForm(false)}
              className="text-[11px] text-gray-500 hover:text-gray-800 cursor-pointer"
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
            className="w-full py-1.5 bg-[#4b2255] text-white text-[12px] font-bold rounded-md hover:bg-[#34143d] transition-colors disabled:opacity-50 cursor-pointer"
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
          className="w-10 h-10 rounded-xl bg-[#4b2255] text-white flex items-center justify-center hover:bg-[#34143d] transition-all disabled:opacity-40 disabled:hover:bg-[#4b2255] shrink-0 shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
