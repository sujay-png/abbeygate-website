'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag } from 'lucide-react';

const NAV_LINKS = [
  { label: 'DIARIES', href: '/diaries' },
  { label: 'NOTEBOOKS', href: '/notebooks' },
  { label: 'CUSTOM GIFTS', href: '/custom-gifts' },
  { label: 'OUR COLLECTION', href: '/collection' },
  { label: 'BESPOKE', href: '/bespoke' },
];

export const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    // Use capture phase (true) so it fires even if Swiper or other components stop propagation!
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, { capture: true, passive: true });
    document.addEventListener('pointerdown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, []);

  const handleSearchToggle = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // If it's already open, clicking the search icon should NOT close it.
      // Just keep focus on the input so they can keep typing.
      inputRef.current?.focus();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 xl:px-16">
        <div className="flex h-20 items-center">

          {/* Left Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[16px] tracking-wide text-[#1F2124] hover:text-gray-500 transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Logo — sits right next to the nav, not centered across the whole header */}
          <div className="flex items-center justify-center px-6 xl:px-10">
            <Link href="/" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/full-colour.png"
                alt="Abbeygate England"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Spacer pushes everything after it to the far right */}
          <div className="flex-1" />

          {/* Right Actions */}
          <div className="flex items-center gap-6">

            {/* Expandable Search */}
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
                  className={`w-48 shrink-0 bg-transparent outline-none pl-3 py-1 text-sm text-gray-800 transition-opacity duration-700 ${
                    isSearchOpen ? 'opacity-100 cursor-text delay-100' : 'opacity-0 cursor-default'
                  }`}
                  placeholder=""
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
              className="text-gray-800 hover:text-gray-500 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                className="w-[15px] h-[17px] fill-current"
              >
                <path d="M352 160v-32C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128v32H0v272c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V160h-96zm-192-32c0-35.29 28.71-64 64-64s64 28.71 64 64v32H160v-32zm160 120c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zm-192 0c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24z" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
