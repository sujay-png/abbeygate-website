'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, Loader2 } from 'lucide-react';
import { AnimatePresence, motion, Transition } from 'framer-motion';
import { useCart } from '@/features/cart/context/CartContext';
import { useState } from 'react';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';

const OPEN_TRANSITION: Transition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] };
const CLOSE_TRANSITION: Transition = { duration: 0.35, ease: [0.7, 0, 0.84, 0] };

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

export const CartDrawer = () => {
  const { items, isOpen, isLoading, subtotal, shippingCost, shippingLabel, vatCost, total, closeCart, removeItem, updateQuantity } = useCart();
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsSyncing(true);
      
      const formData = new FormData();
      
      const payload = items.map((item, index) => {
        const outItem: any = {
          productId: item.productId,
          quantity: item.quantity
        };

        if (item.customization?.enabled) {
          outItem.customization = {
            blockingType: item.customization.choice,
            position: item.customization.position,
            foilColor: item.customization.foilColor,
          };
          if (item.customization.logoFile) {
            formData.append(`logo_${index}`, item.customization.logoFile);
            outItem.customization.hasLogo = true;
          }
          if (item.customization.fullPreviewUrl || item.customization.logoPreviewUrl) {
            try {
              const previewDataUrl = item.customization.fullPreviewUrl || item.customization.logoPreviewUrl!;
              const byteString = atob(previewDataUrl.split(',')[1]);
              const mimeString = previewDataUrl.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: mimeString });
              formData.append(`preview_${index}`, blob, 'preview.png');
              outItem.customization.hasPreview = true;
            } catch (e) {
              console.error('Failed to convert preview to blob', e);
            }
          }
        }
        return outItem;
      });

      formData.append('cart', JSON.stringify({ items: payload }));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Failed to sync cart');
      }

      window.location.href = 'https://corporate.abbeygate-england.com/checkout/';
    } catch (error) {
      console.error(error);
      alert('There was a problem syncing your cart. Please try again.');
      setIsSyncing(false);
    }
  };

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
              <h2 className="text-[15px] font-bold tracking-wide uppercase text-brand-body">
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
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6" data-lenis-prevent style={{ WebkitOverflowScrolling: 'touch' }}>
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
                  <ShoppingBag className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
                  <p className="text-[15px] text-gray-500 font-work">No products in the cart.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-6">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-4">
                      <div className="w-20 h-20 relative shrink-0 bg-transparent rounded">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover rounded"
                        />
                      </div>

                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[15px] text-brand-body font-medium leading-snug">{item.name}</p>
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
                          <div className="mt-3 p-3 bg-transparent rounded-lg border border-gray-100">
                            <p className="text-[13px] font-semibold text-gray-900 mb-1">Custom Logo</p>
                            <p className="text-[12px] text-gray-600"><span className="font-medium">Blocking:</span> {item.customization.choice.replace(' blocked', '')}</p>
                            {item.customization.foilColor && (
                              <p className="text-[12px] text-gray-600"><span className="font-medium">Foil Colour:</span> {item.customization.foilColor}</p>
                            )}
                            {item.customization.fileName && (
                              <p className="text-[12px] text-gray-600">
                                <span className="font-medium">Logo:</span> {item.customization.fileName} —{' '}
                                <a href={item.customization.logoFile ? URL.createObjectURL(item.customization.logoFile) : '#'} target="_blank" rel="noopener noreferrer" className="text-brand-primary-dark underline hover:text-gray-600">View file</a>
                              </p>
                            )}
                            {item.customization.logoPreviewUrl && (
                              <p className="text-[12px] text-gray-600">
                                <span className="font-medium">Preview:</span>{' '}
                                <button type="button" onClick={() => setPreviewItem(item)} className="text-brand-primary-dark underline hover:text-gray-600">View preview</button>
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
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-brand-primary-dark transition-colors disabled:opacity-40"
                            >
                              <Minus className="w-3 h-3" strokeWidth={2} />
                            </button>
                            <span className="w-8 text-center text-[14px] text-brand-body">{item.quantity}</span>
                            <button
                              aria-label="Increase quantity"
                              onClick={() => updateQuantity(item.key, item.quantity + 1)}
                              disabled={isLoading}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-brand-primary-dark transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" strokeWidth={2} />
                            </button>
                          </div>
                          <p className="text-[15px] text-brand-body font-medium">
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
                  <span className="text-[15px] text-brand-body font-work">Subtotal (ex VAT)</span>
                  <span className="text-[17px] text-brand-body font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-gray-600">{shippingLabel}</span>
                  <span className="text-[15px] text-brand-body font-medium">{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[14px] text-gray-600">VAT (20%)</span>
                  <span className="text-[15px] text-brand-body font-medium">{formatPrice(vatCost)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[15px] text-brand-body font-bold">Total (inc. VAT)</span>
                  <span className="text-[17px] text-brand-body font-bold">{formatPrice(total)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 w-full text-center bg-brand-primary text-white text-[15px] font-medium py-4 rounded-md hover:bg-brand-primary-dark transition-colors disabled:bg-gray-400"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing Cart...
                    </>
                  ) : (
                    'Checkout'
                  )}
                </button>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block w-full text-center text-[14px] text-gray-600 hover:text-brand-primary-dark transition-colors mt-3 underline underline-offset-4"
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

