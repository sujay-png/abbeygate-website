'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, Variants, Transition } from 'framer-motion';
import { NAV_ITEMS } from '@/data/navigation';
import { useCart } from '@/features/cart/context/CartContext';

const CLOSE_DELAY = 200;

const OPEN_TRANSITION: Transition = { duration: 0.65, ease: [0.16, 1, 0.3, 1] };
const CLOSE_TRANSITION: Transition = { duration: 0.15, ease: [0.7, 0, 0.84, 0] };

const MOBILE_OPEN_TRANSITION: Transition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] };
const MOBILE_CLOSE_TRANSITION: Transition = { duration: 0.28, ease: [0.7, 0, 0.84, 0] };

const COLUMN_VARIANT: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);
  const { itemCount, openCart } = useCart();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (pathname === '/search') {
      const q = urlSearchParams.get('q');
      if (q) setSearchQuery(q);
    } else {
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  }, [pathname, urlSearchParams]);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, { capture: true, passive: true } as AddEventListenerOptions);
    document.addEventListener('pointerdown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollPositionRef.current);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      const t = setTimeout(() => setMobileExpandedId(null), 350);
      return () => clearTimeout(t);
    }
  }, [isMobileMenuOpen]);

  const handleSearchToggle = () => {
    if (isSearchOpen && searchQuery.trim()) {
      handleSearch();
    } else {
      setIsSearchOpen(!isSearchOpen);
      if (!isSearchOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openMenu = useCallback((id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenuId(id);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveMenuId(null), CLOSE_DELAY);
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const toggleMobileSection = (id: string) => {
    setMobileExpandedId((prev) => (prev === id ? null : id));
  };

  const activeItem = NAV_ITEMS.find((item) => item.id === activeMenuId);
  const isMenuOpen = Boolean(activeItem?.megaMenu?.columns?.length);

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm relative"
      onMouseLeave={scheduleClose}
    >
      <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 xl:px-16">
        <div className="flex h-20 items-center">

          {/* Mobile Hamburger */}
          <button
            aria-label="Open menu"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden text-gray-800 hover:text-gray-500 transition-colors -ml-1 p-1"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>

          {/* Left Navigation (desktop) */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-8">
            {NAV_ITEMS.map((item) => (
              <div key={item.id} className="h-20 flex items-center" onMouseEnter={() => openMenu(item.id)}>
                <Link
                  href={item.href}
                  className={`text-[16px] tracking-wide whitespace-nowrap transition-colors duration-300 ${
                    activeMenuId === item.id ? 'text-black' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>

          <div className="flex items-center justify-center px-6 xl:px-10 mx-auto lg:mx-0">
            <Link href="/" className="block">
              <Image
                src="/images/logo/abbeygate-logo.png"
                alt="Abbeygate England"
                width={200}
                height={48}
                className="h-12 w-auto object-contain" style={{ width: "auto" }}
                priority
              />
            </Link>
          </div>

          <div className="flex-1 hidden lg:block" />

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <div
              ref={searchContainerRef}
              className="relative flex items-center justify-end h-10"
              onMouseEnter={() => {
                if (!isSearchOpen) {
                  setIsSearchOpen(true);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }
              }}
            >
              <div
                className={`flex items-center justify-end transition-all duration-700 ease-in-out rounded overflow-hidden ${
                  isSearchOpen ? 'bg-[#F0F0F0] w-60' : 'bg-transparent w-10'
                }`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-48 shrink-0 bg-transparent outline-none pl-3 py-1 text-sm text-gray-800 transition-opacity duration-700 ${
                    isSearchOpen ? 'opacity-100 cursor-text delay-100' : 'opacity-0 cursor-default'
                  }`}
                  placeholder="Search products..."
                  onFocus={() => setIsSearchOpen(true)}
                />
                <button
                  aria-label="Search"
                  onClick={handleSearchToggle}
                  className={`w-10 h-10 shrink-0 transition-colors flex items-center justify-center cursor-pointer ${
                    isSearchOpen ? 'text-black' : 'text-gray-800'
                  }`}
                >
                  <Search className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <button
              aria-label="Shopping Bag"
              onClick={openCart}
              className="relative text-gray-800 hover:text-gray-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-[15px] h-[17px] fill-current">
                <path d="M352 160v-32C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128v32H0v272c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V160h-96zm-192-32c0-35.29 28.71-64 64-64s64 28.71 64 64v32H160v-32zm160 120c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zm-192 0c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24z" />
              </svg>
              {isMounted && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Mega Menu Panel */}
      <div
        onMouseEnter={() => activeMenuId && openMenu(activeMenuId)}
        className="hidden lg:block absolute left-0 top-full w-full overflow-hidden"
      >
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key={activeItem?.id}
              initial={{ height: 0 }}
              animate={{ height: 'auto', transition: OPEN_TRANSITION }}
              exit={{ height: 0, transition: CLOSE_TRANSITION }}
              className="w-full bg-white border-b border-gray-100 shadow-[0_18px_40px_rgba(0,0,0,0.08)] overflow-hidden"
            >
              <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 xl:px-16 py-10">
                <div className="flex flex-wrap gap-x-16 gap-y-8">
                  {activeItem?.megaMenu?.columns?.map((column) => (
                    <div key={column.id} className="min-w-[180px]">
                      {column.title && (
                        <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-4">
                          {column.title}
                        </h4>
                      )}
                      <ul className="flex flex-col gap-3">
                        {column.links.map((link) => (
                          <li key={link.id}>
                            <Link
                              href={link.href}
                              className="text-[15px] text-[#1F2124] hover:text-gray-500 transition-colors duration-300"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Off-Canvas Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ x: '-100%' }}
            animate={{ x: 0, transition: OPEN_TRANSITION }}
            exit={{ x: '-100%', transition: CLOSE_TRANSITION }}
            style={{
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
            className="lg:hidden fixed inset-0 z-[60] bg-white flex flex-col overscroll-contain"
          >
            <div className="flex items-center h-20 px-6 border-b border-gray-100 shrink-0">
              <button
                aria-label="Close menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-800 hover:text-gray-500 transition-colors -ml-1 p-1"
              >
                <X className="w-6 h-6" strokeWidth={2} />
              </button>

              <div className="flex-1 flex items-center justify-center">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <Image
                    src="/images/logo/abbeygate-logo.png"
                    alt="Abbeygate England"
                    width={160}
                    height={40}
                    className="h-10 w-auto object-contain" style={{ width: "auto" }}
                    priority
                  />
                </Link>
              </div>

              <button
                aria-label="Shopping Bag"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openCart();
                }}
                className="relative text-gray-800 hover:text-gray-500 transition-colors -mr-1 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-[15px] h-[17px] fill-current">
                  <path d="M352 160v-32C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128v32H0v272c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V160h-96zm-192-32c0-35.29 28.71-64 64-64s64 28.71 64 64v32H160v-32zm160 120c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zm-192 0c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24z" />
                </svg>
                {isMounted && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            <nav
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-6"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {NAV_ITEMS.map((item) => {
                const hasSubmenu = Boolean(item.megaMenu?.columns?.length);
                const isExpanded = mobileExpandedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="border-b border-gray-100 last:border-b-0"
                    style={{ contain: 'layout paint' }}
                  >
                    <div className="flex items-center justify-between py-4">
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[15px] font-medium tracking-wide text-[#1F2124] uppercase"
                      >
                        {item.label}
                      </Link>
                      {hasSubmenu && (
                        <button
                          aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                          onClick={() => toggleMobileSection(item.id)}
                          className="p-2 -mr-2 text-gray-500"
                        >
                          <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="block"
                            style={{ willChange: 'transform' }}
                          >
                            <ChevronDown className="w-4 h-4" strokeWidth={2} />
                          </motion.span>
                        </button>
                      )}
                    </div>

                    {hasSubmenu && (
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto', transition: MOBILE_OPEN_TRANSITION }}
                            exit={{ height: 0, transition: MOBILE_CLOSE_TRANSITION }}
                            style={{ willChange: 'height' }}
                            className="overflow-hidden"
                          >
                            <motion.div
                              variants={COLUMN_VARIANT}
                              initial="hidden"
                              animate="visible"
                              className="pb-4 pl-4 flex flex-col gap-5"
                            >
                              {item.megaMenu?.columns?.map((column) => (
                                <div key={column.id}>
                                  {column.title && (
                                    <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-3">
                                      {column.title}
                                    </h4>
                                  )}
                                  <ul className="flex flex-col gap-3">
                                    {column.links.map((link) => (
                                      <li key={link.id}>
                                        <Link
                                          href={link.href}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                          className="text-[15px] text-[#1F2124]"
                                        >
                                          {link.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
