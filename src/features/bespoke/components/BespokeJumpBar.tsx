'use client';

import { useState, useEffect, useRef } from 'react';
import { useLenis } from 'lenis/react';
import { JumpBarItem } from '../types';

interface BespokeJumpBarProps {
  items: JumpBarItem[];
}

export function BespokeJumpBar({ items }: BespokeJumpBarProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || '');
  const [isStuck, setIsStuck] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const isManualScrollRef = useRef(false);
  const activeIdRef = useRef(activeId);
  const lenis = useLenis();

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Scroll smoothly to a target section by calculating exact absolute scrollY
  const scrollToTarget = (targetId: string, smooth = true) => {
    const el = document.getElementById(targetId);
    if (!el) return;

    const header = document.querySelector('header');
    const headerH = header ? header.offsetHeight : (window.innerWidth >= 1024 ? 162 : 80);
    const jumpBarH = barRef.current ? barRef.current.offsetHeight : 54;
    const totalOffset = headerH + jumpBarH + 20;

    const rect = el.getBoundingClientRect();
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = Math.max(0, Math.round(rect.top + currentScroll - totalOffset));

    isManualScrollRef.current = true;
    setActiveId(targetId);

    if (lenis) {
      lenis.scrollTo(targetY, {
        immediate: !smooth,
        duration: smooth ? 0.8 : 0,
        force: true,
      });
    } else {
      window.scrollTo({
        top: targetY,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }

    setTimeout(() => {
      isManualScrollRef.current = false;
    }, 1200);
  };

  // Keep active tab in view horizontally on mobile
  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const activeBtn = navRef.current.querySelector(`[data-id="${activeId}"]`) as HTMLElement | null;
    if (activeBtn) {
      const navRect = navRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      if (btnRect.left < navRect.left + 16 || btnRect.right > navRect.right - 16) {
        navRef.current.scrollTo({
          left: activeBtn.offsetLeft - navRef.current.offsetWidth / 2 + activeBtn.offsetWidth / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [activeId]);

  // Handle header measurement, scroll spy, and sticky state
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    const handleScroll = () => {
      setIsStuck(window.scrollY > 150);

      if (isManualScrollRef.current) return;

      const header = document.querySelector('header');
      const headerH = header ? header.offsetHeight : (window.innerWidth >= 1024 ? 162 : 80);
      const jumpBarH = barRef.current ? barRef.current.offsetHeight : 54;
      const line = headerH + jumpBarH + 40;

      let currentActive = items[0]?.id || '';
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= line) {
            currentActive = item.id;
          }
        }
      }

      if (currentActive && currentActive !== activeIdRef.current) {
        setActiveId(currentActive);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [items]);

  // Handle initial arriving hash and bespoke-jump custom events
  useEffect(() => {
    const handleHashJump = (smooth = true) => {
      const rawHash = window.location.hash.replace('#', '');
      if (rawHash && items.some((item) => item.id === rawHash)) {
        setTimeout(() => {
          scrollToTarget(rawHash, smooth);
        }, 200);
      }
    };

    // Arriving with hash in URL
    handleHashJump(false);

    const onCustomJump = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setTimeout(() => {
          scrollToTarget(customEvent.detail, true);
        }, 50);
      }
    };
    window.addEventListener('bespoke-jump', onCustomJump);

    return () => {
      window.removeEventListener('bespoke-jump', onCustomJump);
    };
  }, [items, lenis]);

  return (
    <div
      ref={barRef}
      style={{ top: headerHeight !== null ? `${headerHeight}px` : undefined }}
      className={`sticky top-[80px] lg:top-[162px] z-30 bg-brand-cream/95 backdrop-blur-sm py-3 transition-shadow duration-200 ${
        isStuck ? 'shadow-[0_4px_12px_rgba(37,23,41,0.06)]' : ''
      }`}
    >
      <div className="w-full max-w-[1296px] mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          ref={navRef}
          aria-label="On this page"
          className="flex items-center justify-start md:justify-center overflow-x-auto scrollbar-none gap-2.5 md:gap-3 py-1 -my-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-id={item.id}
                onClick={() => scrollToTarget(item.id, true)}
                className={`inline-flex items-center justify-center whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded text-[11px] md:text-xs font-bold tracking-wider uppercase transition-colors duration-150 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-brand-primary-dark text-white border border-brand-primary-dark shadow-sm'
                    : 'bg-white text-brand-primary-dark border border-brand-primary-dark/40 hover:bg-brand-primary-dark hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

