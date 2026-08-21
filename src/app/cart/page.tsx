'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { useCart } from '@/features/cart/context/CartContext';
import { Minus, Plus, X, Loader2 } from 'lucide-react';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

export default function CartPage() {
  const { items, subtotal, shippingCost, shippingLabel, vatCost, total, removeItem, updateQuantity } = useCart();
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

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
    <div className="py-10">
      <Container>
        <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
        <h1 className="text-3xl font-extrabold mt-6 mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-6">Your cart is empty.</p>
            <Link href="/notebooks" className="inline-block bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4 border-b border-gray-100 pb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="w-24 h-24 relative bg-gray-50 shrink-0 rounded">
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover rounded" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <Link href={item.slug ? `/product/${item.slug}` : '#'} className="font-medium text-gray-900 hover:underline">
                          {item.name}
                        </Link>
                        {item.attributes?.filter(attr => !['Custom Logo', 'Blocking', 'Foil Colour', 'Logo Scale', 'Logo'].includes(attr.name)).map((attr) => (
                          <p key={attr.name} className="text-sm text-gray-500 mt-1">
                            {attr.name}{attr.value ? `: ${attr.value}` : ''}
                          </p>
                        ))}
                        {item.customization?.enabled && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Custom Logo</p>
                            <p className="text-sm text-gray-600"><span className="font-medium">Blocking:</span> {item.customization.choice.replace(' blocked', '')}</p>
                            {item.customization.foilColor && (
                              <p className="text-sm text-gray-600"><span className="font-medium">Foil Colour:</span> {item.customization.foilColor}</p>
                            )}
                            {item.customization.fileName && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Logo:</span> {item.customization.fileName} —{' '}
                                <a href={item.customization.logoFile ? URL.createObjectURL(item.customization.logoFile) : '#'} target="_blank" rel="noopener noreferrer" className="text-black underline hover:text-gray-600">View file</a>
                              </p>
                            )}
                            {item.customization.logoPreviewUrl && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Preview:</span>{' '}
                                <button type="button" onClick={() => setPreviewItem(item)} className="text-black underline hover:text-gray-600">View preview</button>
                              </p>
                            )}
                            <p className="text-sm text-gray-600"><span className="font-medium">Position:</span> {item.customization.position}</p>
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => removeItem(item.key)} className="text-gray-400 hover:text-gray-600 shrink-0">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-200 rounded">
                        <button type="button" onClick={() => updateQuantity(item.key, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.key, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 h-fit">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal (ex VAT)</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{shippingLabel}</span>
                  <span className="font-medium text-gray-900">{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (20%)</span>
                  <span className="font-medium text-gray-900">{formatPrice(vatCost)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-200">
                  <span>Total (inc. VAT)</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-md font-medium mt-6 hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Syncing Cart...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>
            </div>
          </div>
        )}
      </Container>
      <ImagePreviewModal 
        isOpen={!!previewItem} 
        onClose={() => setPreviewItem(null)} 
        item={previewItem} 
        title="Customization Preview" 
      />
    </div>
  );
}
