'use client';

import React, { useState, useEffect } from 'react';
import { ChatLauncher } from './ChatLauncher';
import { ChatWindow } from './ChatWindow';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <ChatLauncher isOpen={isOpen} onClick={() => setIsOpen((prev) => !prev)} />
      {mounted && <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </>
  );
}
