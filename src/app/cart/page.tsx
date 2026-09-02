'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { useCart, type CartItem } from '@/features/cart/context/CartContext';
import { Minus, Plus, X, Loader2 } from 'lucide-react';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { ColourPickerRow } from '@/features/cart/components/ColourPickerRow';
import { retryProof } from '@/features/cart/utils/add-colour-variant';
import { validateCustomisationMinimums } from '@/features/cart/utils/colour-group';
import { downloadCartItemProof, canDownloadProof } from '@/features/cart/utils/download-proof';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

export default function CartPage() {
  const { items: rawItems, pricedItems: items, isLoading, removeItem, updateQuantity, subtotal, shippingCost, vatCost, total, shippingLabel, updateItem, clearCart } = useCart();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const amendLine = (item: CartItem) => {
    if (!item.customization?.enabled) return;
    sessionStorage.setItem(`abbeygate-amend-${item.key}`, JSON.stringify({
      ...item.customization,
      quantity: item.quantity,
      logoFile: undefined, // Don't try to stringify the File
    }));
    window.location.href = `/product/${item.slug}?amend=${item.key}`;
  };

  const shortfalls = validateCustomisationMinimums(rawItems);
  const hasShortfalls = shortfalls.length > 0;

  const handleCheckout = async () => {
    if (hasShortfalls) {
      alert("Please resolve the minimum quantity requirements before checking out.");
      return;
    }

    try {
      setIsSyncing(true);
      
      const idb = await import('@/lib/idb');
      let currentCart = await idb.get<any[]>('abbeygate-cart') || [];
      let attempt = 0;
      while (currentCart.some(i => i.proofStatus === 'pending') && attempt < 20) {
        await new Promise(r => setTimeout(r, 500));
        currentCart = await idb.get<any[]>('abbeygate-cart') || [];
        attempt++;
      }

      if (currentCart.some(i => i.proofStatus === 'failed')) {
        if (!window.confirm("Some items could not generate a visual proof. Your order details are still complete. Proceed to checkout?")) {
          setIsSyncing(false);
          return;
        }
      }
      
      const formData = new FormData();
      
      const payload = currentCart.map((item: any, index: number) => {
        const outItem: any = {
          productId: item.productId,
          quantity: item.quantity
        };

        if (item.customization?.enabled) {
          outItem.customization = {
            blockingType: item.customization.choice,
            position: item.customization.position,
            foilColor: item.customization.foilColor,
            cornerEdges: item.customization.cornerEdges,
          };
          if (item.customization.logoFile) {
            formData.append(`logo_${index}`, item.customization.logoFile);
            outItem.customization.hasLogo = true;
          }
          if (item.customization.fullPreviewUrl) {
            try {
              const previewDataUrl = item.customization.fullPreviewUrl;
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

      window.location.href = 'https://dashboard.abbeygate-england.com/checkout/';
      setTimeout(() => setIsSyncing(false), 500);
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
            <Link href="/notebooks" className="inline-block bg-brand-primary text-white px-8 py-3 rounded-md font-medium hover:bg-brand-primary-dark transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[2.4fr_1fr] gap-8 lg:gap-10">
            <div className="flex flex-col space-y-0">
              {/* Header for Desktop */}
              <div className="hidden lg:grid grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_0.8fr] gap-4 pb-3 border-b border-[var(--brand-border)] text-[11px] font-bold tracking-widest text-gray-500 uppercase">
                <div>Item</div>
                <div>Customisation summary</div>
                <div>Unit price</div>
                <div>Quantity</div>
                <div className="text-right pr-2">Total</div>
              </div>

              {/* Rows */}
              <div className="flex flex-col w-full">
                {items.map((item) => {
                  const groupSize = rawItems.filter(i => (i.colourGroupId ?? i.key) === (item.colourGroupId ?? item.key)).length;
                  const isGrouped = groupSize > 1;
                  const shortfallData = shortfalls.find(s => s.groupId === (item.colourGroupId ?? item.key));
                  const unitPrice = item.lineTotal / item.quantity;
                  
                  return (
                  <div key={item.key} className={`py-6 border-b border-[var(--brand-border)] flex flex-col lg:grid lg:grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_0.8fr] gap-6 lg:gap-4 lg:items-start ${isGrouped ? 'border-l-4 border-l-gray-200 pl-4 lg:pl-0 lg:border-l-0' : ''}`}>
                    
                    {/* 1. Item */}
                    <div className="flex gap-4">
                      <div className="w-[84px] h-[116px] relative shrink-0 overflow-hidden">
                        <Image src={item.customization?.fullPreviewUrl || item.image || '/images/logo/abbeygate-logo.png'} alt={item.name} fill sizes="84px" className="object-cover mix-blend-multiply" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <Link href={item.slug ? `/product/${item.slug}` : '#'} className="font-josefin font-bold text-[18px] text-brand-primary-dark leading-tight hover:underline">
                          {item.name}
                        </Link>
                        <div className="text-[12px] text-gray-500 mt-1.5 space-y-0.5">
                          {item.attributes?.filter(attr => !['Custom Logo', 'Blocking', 'Foil Colour', 'Logo Scale', 'Logo', 'Corner Edges'].includes(attr.name)).map((attr) => (
                            <p key={attr.name}>{attr.value}</p>
                          ))}
                          <p className="pt-1 uppercase">SKU: {item.sku || item.productId}</p>
                        </div>

                        <div className="flex flex-col gap-1 mt-4 text-[12px] font-semibold text-brand-primary-dark tracking-wide">
                          {item.customization?.enabled && (
                            <button type="button" onClick={() => amendLine(item)} className="text-left hover:underline w-fit">
                              Amend customisation
                            </button>
                          )}
                          {canDownloadProof(item) && (
                            <button type="button" onClick={() => downloadCartItemProof(item)} className="text-left hover:underline w-fit">
                              Download proof
                            </button>
                          )}
                          {(item.colourOptions?.length ?? 0) > 1 && (
                            <button type="button" onClick={() => setPickerFor(pickerFor === item.key ? null : item.key)} className="text-left hover:underline w-fit">
                              + Order in another colour
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 2. Customisation */}
                    <div className="text-[13px] text-brand-body leading-relaxed">
                      {item.customization?.enabled ? (
                        <>
                          <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1 items-start">
                            <span className="font-bold text-gray-900">Branding</span>
                            <span>{item.customization.choice.replace(' blocked', ' blocking')}</span>
                            
                            {item.customization.foilColor && (
                              <>
                                <span className="font-bold text-gray-900">Foil colour</span>
                                <span>{item.customization.foilColor}</span>
                              </>
                            )}
                            
                            <span className="font-bold text-gray-900">Position</span>
                            <span>{item.customization.position}</span>
                            
                            {item.customization.cornerEdges && item.customization.cornerEdges !== 'None' && (
                              <>
                                <span className="font-bold text-gray-900">Corner edges</span>
                                <span>{item.customization.cornerEdges}</span>
                              </>
                            )}
                            
                            {item.customization.fileName && (
                              <>
                                <span className="font-bold text-gray-900">Logo</span>
                                <span className="break-all pr-4">
                                  {item.customization.fileName} —{' '}
                                  <a href={item.customization.logoFile ? URL.createObjectURL(item.customization.logoFile) : '#'} target="_blank" rel="noopener noreferrer" className="text-brand-primary-dark underline hover:text-gray-600 font-semibold inline-block">
                                    View file
                                  </a>
                                </span>
                              </>
                            )}
                            
                            {(item.proofStatus || 'ready') === 'pending' ? (
                              <>
                                <span className="font-bold text-gray-900">Preview</span>
                                <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Generating...</span>
                              </>
                            ) : item.proofStatus === 'failed' ? (
                              <>
                                <span className="font-bold text-red-600">Preview</span>
                                <span className="text-red-600">Failed <button type="button" className="underline ml-1" onClick={() => retryProof(item, updateItem)}>Retry</button></span>
                              </>
                            ) : item.customization.logoPreviewUrl ? (
                              <>
                                <span className="font-bold text-gray-900">Preview</span>
                                <button type="button" onClick={() => setPreviewItem(item)} className="text-brand-primary-dark underline hover:text-gray-600 w-fit text-left">View preview</button>
                              </>
                            ) : null}
                          </div>
                          <p className="mt-5 text-[11px] text-gray-500 max-w-[200px]">
                            Includes branding set-up (£0.00), branding application (£0.00) and extras (£0.00)
                          </p>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">No customisation</span>
                      )}
                    </div>
                    
                    {/* 3. Unit Price */}
                    <div className="flex justify-between lg:block">
                      <span className="lg:hidden font-bold text-[13px]">Unit Price</span>
                      <div>
                        <div className="font-bold text-[14px] text-gray-900">{formatPrice(unitPrice)}</div>
                        <div className="text-[11px] text-gray-500">ex VAT</div>
                      </div>
                    </div>
                    
                    {/* 4. Quantity */}
                    <div className="flex justify-between lg:block">
                      <span className="lg:hidden font-bold text-[13px]">Quantity</span>
                      <div className="flex flex-col items-start lg:items-center w-fit">
                        <div className="flex items-center border border-[var(--brand-border)] rounded overflow-hidden">
                          <button type="button" onClick={() => updateQuantity(item.key, item.quantity - 1)} className="w-[26px] h-[26px] flex items-center justify-center bg-[var(--brand-cream)] hover:bg-gray-100 transition-colors border-r border-[var(--brand-border)] shrink-0">
                            <Minus className="w-3 h-3" strokeWidth={3} />
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) updateQuantity(item.key, val);
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (isNaN(val) || val < 1) updateQuantity(item.key, 1);
                            }}
                            className="w-12 text-center text-[13px] font-bold bg-transparent outline-none focus:ring-1 focus:ring-brand-primary p-0 h-[26px]"
                          />
                          <button type="button" onClick={() => updateQuantity(item.key, item.quantity + 1)} className="w-[26px] h-[26px] flex items-center justify-center bg-[var(--brand-cream)] hover:bg-gray-100 transition-colors border-l border-[var(--brand-border)] shrink-0">
                            <Plus className="w-3 h-3" strokeWidth={3} />
                          </button>
                        </div>
                        <button type="button" onClick={() => removeItem(item.key)} className="text-[12px] text-brand-primary-dark font-semibold hover:underline mt-3 w-full text-center">
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    {/* 5. Total */}
                    <div className="flex justify-between lg:block lg:text-right pr-2">
                      <span className="lg:hidden font-bold text-[13px]">Total</span>
                      <div>
                        <div className="font-bold text-[14px] text-gray-900">{formatPrice(item.lineTotal)}</div>
                        <div className="text-[11px] text-gray-500 whitespace-nowrap">incl. branding &<br/>extras</div>
                        {item.groupQuantity > item.quantity && (
                          <div className="text-[10px] text-gray-400 mt-2 max-w-[120px] ml-auto leading-tight">
                            Priced at your {item.groupQuantity}-unit total across {groupSize} colours
                          </div>
                        )}
                      </div>
                    </div>

                    {shortfallData && (
                      <div className="lg:col-span-5 mt-3 text-[13px] text-red-600 font-medium bg-red-50 px-3 py-2 rounded">
                        This group needs {shortfallData.shortfall} more units to meet the minimum for customisation.
                      </div>
                    )}
                    
                    {pickerFor === item.key && (
                      <div className="lg:col-span-5 mt-4">
                        <ColourPickerRow item={item} onPick={() => setPickerFor(null)} />
                      </div>
                    )}
                  </div>
                )})}
              </div>
              
              {/* Table Footer Actions */}
              {items.length > 0 && (
                <div className="flex justify-between items-center pt-8">
                  <button type="button" onClick={clearCart} className="px-5 py-2.5 rounded-md border border-[var(--brand-border)] bg-white text-brand-primary-dark font-semibold text-[14px] tracking-wide hover:bg-gray-50 transition-colors">
                    Clear basket
                  </button>
                  <button type="button" className="px-5 py-2.5 rounded-md border border-[var(--brand-border)] bg-white text-brand-primary-dark font-semibold text-[14px] tracking-wide hover:bg-gray-50 transition-colors">
                    Save basket
                  </button>
                </div>
              )}
              
              {/* Trust Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 mt-8 border-t border-[var(--brand-border)]">
                <div>
                  <h4 className="text-[13px] font-bold text-brand-primary-dark mb-1">Manufactured in the UK</h4>
                  <p className="text-[12px] text-gray-500 leading-tight">Every piece made to order</p>
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-brand-primary-dark mb-1">Premium materials</h4>
                  <p className="text-[12px] text-gray-500 leading-tight">Soft-touch vegan leather</p>
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-brand-primary-dark mb-1">Low minimum order</h4>
                  <p className="text-[12px] text-gray-500 leading-tight">From 250 units</p>
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-brand-primary-dark mb-1">Reliable lead times</h4>
                  <p className="text-[12px] text-gray-500 leading-tight">2-3 weeks production</p>
                </div>
              </div>
            </div>

            <div className="border border-[var(--brand-border)] rounded-xl p-6 bg-white h-fit sticky top-[200px]">
              <h3 className="text-[15px] text-brand-primary-dark uppercase tracking-wide font-josefin font-semibold mb-4">
                Order Summary (ex VAT)
              </h3>
              
              <div className="flex flex-col mb-5">
                {items.map((item) => (
                  <div key={item.key} className="flex justify-between items-start py-2.5 border-b border-[var(--brand-border)] text-[14px] text-gray-500">
                    <span className="flex-1 pr-4">
                      {item.name}
                      <span className="block text-[11px] mt-0.5">(incl. branding & extras)</span>
                    </span>
                    <span className="font-medium shrink-0">{formatPrice(item.lineTotal)}</span>
                  </div>
                ))}
                
                <div className="flex justify-between font-bold text-gray-900 pt-4 pb-2 text-[14px]">
                  <span>Subtotal (ex VAT)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-gray-900 bg-brand-tint px-3.5 py-3 rounded-md mt-2 text-[14px]">
                  <span>Including VAT (20%)</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isSyncing || hasShortfalls}
                className="w-full flex items-center justify-center bg-brand-primary text-white py-3 rounded font-medium hover:bg-brand-primary-dark transition-colors disabled:bg-gray-400 text-[15px]"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Syncing Cart...
                  </>
                ) : hasShortfalls ? (
                  'Minimum requirement not met'
                ) : (
                  'Proceed to checkout'
                )}
              </button>
              
              <Link
                href="/notebooks"
                className="w-full flex items-center justify-center border border-gray-300 text-gray-700 bg-white py-3 rounded font-medium mt-3 hover:bg-gray-50 transition-colors text-[15px]"
              >
                Continue shopping
              </Link>
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
