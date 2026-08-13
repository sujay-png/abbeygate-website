'use client';

import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion, Transition } from 'framer-motion';
import { useCart } from '@/features/cart/context/CartContext';
import { useState } from 'react';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';

const OPEN_TRANSITION: Transition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] };
const CLOSE_TRANSITION: Transition = { duration: 0.35, ease: [0.7, 0, 0.84, 0] };

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

export const CartDrawer = () => {
  const { items, isOpen, isLoading, subtotal, shippingCost, shippingLabel, total, closeCart, removeItem, updateQuantity } = useCart();
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            onClick={closeCart}
            className="fixed inset-0 z-[70] bg-black/40"
          />

          {/* Panel */}
          <motion.div
            key="cart-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0, transition: OPEN_TRANSITION }}
            exit={{ x: '100%', transition: CLOSE_TRANSITION }}
            style={{
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
            className="fixed inset-y-0 right-0 z-[80] w-full sm:w-[420px] bg-white shadow-[-18px_0_40px_rgba(0,0,0,0.12)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100 shrink-0">
              <h2 className="text-[15px] font-bold tracking-wide uppercase text-[#1F2124]">
                Your Bag {items.length > 0 && `(${items.length})`}
              </h2>
              <button
                aria-label="Close cart"
                onClick={closeCart}
                className="text-gray-800 hover:text-gray-500 transition-colors p-1"
              >
                <X className="w-6 h-6" strokeWidth={2} />
              </button>
            </div>

            {/* Line Items */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
                  <ShoppingBag className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
                  <p className="text-[15px] text-gray-500 font-work">No products in the cart.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-6">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded shrink-0 bg-gray-50"
                      />

                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[15px] text-[#1F2124] font-medium leading-snug">{item.name}</p>
                          <button
                            aria-label={`Remove ${item.name}`}
                            onClick={() => removeItem(item.key)}
                            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>

                        {item.attributes && item.attributes.length > 0 && (
                          <div className="text-[13px] text-gray-500 mt-1.5 space-y-0.5">
                            {item.attributes.filter(attr => !['Custom Logo', 'Blocking', 'Foil Colour', 'Logo Scale', 'Logo'].includes(attr.name)).map((a, i) => (
                              <p key={i}>
                                {a.name}{a.value ? `: ${a.value}` : ''}
                              </p>
                            ))}
                          </div>
                        )}
                        
                        {item.customization?.enabled && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[13px] font-semibold text-gray-900 mb-1">Custom Logo</p>
                            <p className="text-[12px] text-gray-600"><span className="font-medium">Blocking:</span> {item.customization.choice.replace(' blocked', '')}</p>
                            {item.customization.foilColor && (
                              <p className="text-[12px] text-gray-600"><span className="font-medium">Foil Colour:</span> {item.customization.foilColor}</p>
                            )}
                            {item.customization.fileName && (
                              <p className="text-[12px] text-gray-600">
                                <span className="font-medium">Logo:</span> {item.customization.fileName} —{' '}
                                <a href={item.customization.logoFile ? URL.createObjectURL(item.customization.logoFile) : '#'} target="_blank" rel="noopener noreferrer" className="text-black underline hover:text-gray-600">View file</a>
                              </p>
                            )}
                            {item.customization.logoPreviewUrl && (
                              <p className="text-[12px] text-gray-600">
                                <span className="font-medium">Preview:</span>{' '}
                                <button type="button" onClick={() => setPreviewItem(item)} className="text-black underline hover:text-gray-600">View preview</button>
                              </p>
                            )}
                            <p className="text-[12px] text-gray-600"><span className="font-medium">Position:</span> {item.customization.position}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-200 rounded">
                            <button
                              aria-label="Decrease quantity"
                              onClick={() => updateQuantity(item.key, item.quantity - 1)}
                              disabled={isLoading}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-black transition-colors disabled:opacity-40"
                            >
                              <Minus className="w-3 h-3" strokeWidth={2} />
                            </button>
                            <span className="w-8 text-center text-[14px] text-[#1F2124]">{item.quantity}</span>
                            <button
                              aria-label="Increase quantity"
                              onClick={() => updateQuantity(item.key, item.quantity + 1)}
                              disabled={isLoading}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-black transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" strokeWidth={2} />
                            </button>
                          </div>
                          <p className="text-[15px] text-[#1F2124] font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-6 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#1F2124] font-work">Subtotal</span>
                  <span className="text-[17px] text-[#1F2124] font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-gray-600">{shippingLabel}</span>
                  <span className="text-[15px] text-[#1F2124] font-medium">{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[15px] text-[#1F2124] font-bold">Total</span>
                  <span className="text-[17px] text-[#1F2124] font-bold">{formatPrice(total)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full text-center bg-black text-white text-[15px] font-medium py-4 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block w-full text-center text-[14px] text-gray-600 hover:text-black transition-colors mt-3 underline underline-offset-4"
                >
                  View full cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    <ImagePreviewModal 
      isOpen={!!previewItem} 
      onClose={() => setPreviewItem(null)} 
      item={previewItem} 
      title="Customization Preview" 
    />
    </>
  );
};
