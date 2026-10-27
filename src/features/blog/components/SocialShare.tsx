"use client";

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';

interface SocialShareProps {
  title: string;
  url?: string;
  className?: string;
}

export function SocialShare({ title, url, className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  // In browser, fallback to window.location.href if not passed
  const currentUrl = typeof window !== 'undefined' ? (url || window.location.href) : (url || '');

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const sharePinterest = () => {
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&description=${encodeURIComponent(title)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`flex items-center justify-center gap-2.5 ${className}`}>
      {/* Facebook */}
      <button
        onClick={shareFacebook}
        aria-label="Share on Facebook"
        className="w-8 h-8 rounded-full border border-brand-border/60 hover:border-brand-primary-dark text-brand-body hover:bg-brand-soft/40 transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>

      {/* Pinterest */}
      <button
        onClick={sharePinterest}
        aria-label="Share on Pinterest"
        className="w-8 h-8 rounded-full border border-brand-border/60 hover:border-brand-primary-dark text-brand-body hover:bg-brand-soft/40 transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0a12 12 0 0 0-4.37 23.17c-.07-.98-.13-2.5.03-3.57.14-.97.94-6.42.94-6.42s-.24-.48-.24-1.2c0-1.12.65-1.96 1.46-1.96.69 0 1.02.52 1.02 1.14 0 .7-.44 1.74-.67 2.7-.19.81.4 1.47 1.2 1.47 1.44 0 2.55-1.52 2.55-3.71 0-1.94-1.4-3.3-3.39-3.3-2.31 0-3.66 1.73-3.66 3.52 0 .7.27 1.44.6 1.85.07.08.08.15.06.24l-.23.95c-.04.15-.12.18-.28.11-1.04-.48-1.69-2-1.69-3.21 0-2.61 1.9-5.01 5.48-5.01 2.88 0 5.11 2.05 5.11 4.79 0 2.86-1.8 5.16-4.3 5.16-.84 0-1.63-.44-1.9-.96l-.52 1.97c-.19.72-.7 1.63-1.04 2.18A12 12 0 1 0 12 0z" />
        </svg>
      </button>

      {/* Twitter / X */}
      <button
        onClick={shareTwitter}
        aria-label="Share on X"
        className="w-8 h-8 rounded-full border border-brand-border/60 hover:border-brand-primary-dark text-brand-body hover:bg-brand-soft/40 transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        aria-label="Copy link"
        className="relative w-8 h-8 rounded-full border border-brand-border/60 hover:border-brand-primary-dark text-brand-body hover:bg-brand-soft/40 transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Link2 className="w-3.5 h-3.5" />
        )}
        {copied && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-work font-medium px-2 py-0.5 rounded shadow whitespace-nowrap">
            Copied!
          </span>
        )}
      </button>
    </div>
  );
}
