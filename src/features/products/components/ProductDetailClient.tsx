'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { StoreProduct, PriceTier } from '../types/store-product';
import { ProductCustomizer, type CustomizationState } from './ProductCustomizer';
import { ProductCustomizationOverlay } from './ProductCustomizationOverlay';
import { useCart } from '@/features/cart/context/CartContext';
import { CUSTOMIZATION_MIN_QTY, formatGBP, isGiftsProduct } from '../utils/pricing';
import { TrustIndicators } from '@/components/home/TrustIndicators';
import { Send, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Link from 'next/link';

import type { CustomTab } from '@/features/products/services/store-products';

export type ColorVariant = {
  name: string;
  slug: string;
  hex: string;
};

type ProductDetailClientProps = {
  product: StoreProduct;
  tiers: PriceTier[];
  basePrice: number;
  colorVariants?: ColorVariant[];
  customTabs?: CustomTab[];
};

export const ProductDetailClient = ({
  product,
  tiers,
  basePrice,
  colorVariants = [],
  customTabs = [],
}: ProductDetailClientProps) => {
  const { addItem } = useCart();
  const isGifts = isGiftsProduct(product);
  
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(isGifts ? 1 : CUSTOMIZATION_MIN_QTY);
  const [priceDetails, setPriceDetails] = useState({
    unitPrice: basePrice,
    totalPrice: basePrice * (isGifts ? 1 : CUSTOMIZATION_MIN_QTY),
    statusText: '',
    statusColor: '',
    discountRate: 0,
    discountLabel: ''
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Description');
  const isCustomizationSurface = activeImageIndex === 0;
  const [customization, setCustomization] = useState<CustomizationState>({
    enabled: !isGifts,
    blockingType: 'Embossed',
    logoScale: 1,
    logoPosition: { x: 0, y: 0, label: 'Center' },
  });
  const [isAdding, setIsAdding] = useState(false);

  const handlePriceChange = useCallback((result: any) => {
    setPriceDetails({
      unitPrice: result.unitPrice,
      totalPrice: result.totalPrice,
      statusText: result.statusText || '',
      statusColor: result.statusColor || '',
      discountRate: result.discountRate || 0,
      discountLabel: result.discountLabel || ''
    });
  }, []);

  const handleCustomizationChange = useCallback((state: CustomizationState) => {
    setCustomization(state);
  }, []);

  const handlePositionChange = useCallback((position: { x: number; y: number; label: string }) => {
    setCustomization(prev => ({ ...prev, logoPosition: position }));
  }, []);

  const activeImage = product.images[activeImageIndex] ?? product.images[0];
  const activeSrc = activeImage?.src || activeImage?.thumbnail || '';

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  // Close preview on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPreviewOpen(false);
    };
    if (isPreviewOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isPreviewOpen]);

  const handleAddToCart = async () => {
    if (
      customization.enabled &&
      quantity < CUSTOMIZATION_MIN_QTY &&
      !isGifts
    ) {
      alert(
        `Minimum order quantity for customisable products with logos is ${CUSTOMIZATION_MIN_QTY}. Please increase your quantity or remove the customisation.`
      );
      return;
    }

    setIsAdding(true);
    try {
      const attributes: { name: string; value: string }[] = [];
      let leftPercent = 50;
      let topPercent = 50;
      let widthPercent = 20;
      let fullPreviewUrl: string | undefined = undefined;

      if (customization.enabled && !isGifts) {
        attributes.push({ name: 'Custom Logo', value: '' });
        
        if (customization.blockingType) {
          attributes.push({ name: 'Blocking', value: customization.blockingType.replace(' blocked', '') });
        }
        if (customization.blockingType === 'Foil blocked' && customization.foilColor) {
          attributes.push({ name: 'Foil Colour', value: customization.foilColor });
        }
        if (customization.logoScale) {
          const scale = Math.round((customization.logoScale || 1) * 100);
          attributes.push({
            name: 'Logo Scale',
            value: `${scale}%`,
          });
        }
        if (customization.logoFile) {
          attributes.push({ name: 'Logo', value: customization.logoFile.name });
        }
        
        // Calculate responsive percentages for the CartItemPreview
        if (previewContainerRef.current) {
          const rect = previewContainerRef.current.getBoundingClientRect();
          const cx = customization.logoPosition?.x || 0;
          const cy = customization.logoPosition?.y || 0;
          
          leftPercent = 50 + (cx / rect.width) * 100;
          topPercent = 50 + (cy / rect.height) * 100;
          widthPercent = ((120 * (customization.logoScale || 1)) / rect.width) * 100;
          // 1. Generate image using native canvas to avoid html2canvas CSS/CORS bugs
          try {
            const canvas = document.createElement('canvas');
            const CANVAS_SIZE = 800;
            canvas.width = CANVAS_SIZE;
            canvas.height = CANVAS_SIZE;
            const ctx = canvas.getContext('2d');
            
            if (ctx && activeSrc) {
              // Fill white background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

              // Get product image via proxy
              const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(activeSrc)}`);
              const data = await res.json();
              
              if (data.dataUrl) {
                const productImg = new Image();
                productImg.src = data.dataUrl;
                await new Promise((resolve) => {
                  productImg.onload = resolve;
                  productImg.onerror = resolve;
                });
                
                // Draw product image
                const imgAspect = productImg.width / productImg.height;
                let drawW = CANVAS_SIZE;
                let drawH = CANVAS_SIZE;
                let drawX = 0;
                let drawY = 0;
                if (imgAspect > 1) {
                  drawH = CANVAS_SIZE / imgAspect;
                  drawY = (CANVAS_SIZE - drawH) / 2;
                } else {
                  drawW = CANVAS_SIZE * imgAspect;
                  drawX = (CANVAS_SIZE - drawW) / 2;
                }
                ctx.drawImage(productImg, drawX, drawY, drawW, drawH);

                // Draw logo if exists
                if (customization.logoPreviewUrl) {
                  const logoImg = new Image();
                  logoImg.src = customization.logoPreviewUrl;
                  await new Promise((resolve) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = resolve;
                  });

                  const logoW = CANVAS_SIZE * (widthPercent / 100);
                  const logoH = logoW; // aspect 1:1
                  const logoX = CANVAS_SIZE * (leftPercent / 100) - (logoW / 2);
                  const logoY = CANVAS_SIZE * (topPercent / 100) - (logoH / 2);
                  
                  // Tint if foil
                  if (customization.blockingType === 'Foil blocked') {
                    const tintCanvas = document.createElement('canvas');
                    tintCanvas.width = logoW;
                    tintCanvas.height = logoH;
                    const tCtx = tintCanvas.getContext('2d');
                    if (tCtx) {
                      tCtx.drawImage(logoImg, 0, 0, logoW, logoH);
                      tCtx.globalCompositeOperation = 'source-in';
                      tCtx.fillStyle = customization.foilColor === 'Gold' ? '#D4AF37' : '#C0C0C0';
                      tCtx.fillRect(0, 0, logoW, logoH);
                      ctx.drawImage(tintCanvas, logoX, logoY, logoW, logoH);
                    }
                  } else {
                    // Embossed fallback
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
                    ctx.globalAlpha = 1.0;
                  }
                }
                
                fullPreviewUrl = canvas.toDataURL('image/png', 0.9);
              }
            }
          } catch (e) {
            console.error('Native canvas composition failed', e);
          }
        }
      }

      await addItem({
        productId: String(product.id),
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.thumbnail || product.images[0]?.src || '',
        price: priceDetails.unitPrice,
        quantity,
        attributes,
        customization:
          customization.enabled && !isGifts
            ? {
                enabled: true,
                choice: customization.blockingType,
                foilColor: customization.blockingType === 'Foil blocked' ? customization.foilColor : undefined,
                position: customization.logoPosition?.label || 'Center',
                fileName: customization.logoFile?.name,
                logoFile: customization.logoFile,
                logoPreviewUrl: customization.logoPreviewUrl,
                fullPreviewUrl: fullPreviewUrl,
                leftPercent,
                topPercent,
                widthPercent,
              }
            : undefined,
        categorySlugs: product.categories.map((c) => c.slug),
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:items-start"
        style={{ backgroundColor: '#ffffff', color: '#1F2124' }}
      >
        {/* Left: gallery */}
        <div className="relative z-10 lg:sticky lg:top-32 self-start">
          <div
            className="relative w-full overflow-hidden rounded-xl border border-gray-100 flex items-center justify-center p-4 group"
            style={{ aspectRatio: '1 / 1', backgroundColor: '#ffffff' }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPreviewOpen(true);
              }}
              className="absolute top-4 right-4 z-[30] p-2.5 rounded-full bg-white/90 backdrop-blur shadow-sm text-gray-600 hover:text-black hover:bg-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 border border-gray-200"
              title="Fullscreen Preview"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            {activeSrc ? (
              <div className="relative w-full h-full" ref={previewContainerRef}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSrc}
                  alt={activeImage?.alt || product.name}
                  referrerPolicy="no-referrer"
                  fetchPriority="high"
                  className="transition-transform duration-300 group-hover:scale-105"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
                {isCustomizationSurface && (
                  <ProductCustomizationOverlay 
                    product={product} 
                    customization={customization} 
                    onPositionChange={handlePositionChange} 
                  />
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, index) => {
                const thumb = img.thumbnail || img.src;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      index === activeImageIndex ? 'border-black' : 'border-transparent hover:border-gray-200'
                    }`}
                    style={{ backgroundColor: '#f9f9f9' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt={img.alt || product.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: 4,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
          {/* Available Colours Section */}
          {colorVariants.length > 0 && (
            <div className="mt-8 flex items-center gap-4">
              <span className="text-sm font-semibold text-[#1F2124]">Available Colours</span>
              <div className="flex items-center gap-3">
                {colorVariants.map((color) => {
                  const isActive = product.slug === color.slug;
                  return (
                    <Link
                      key={color.slug}
                      href={`/product/${color.slug}`}
                      title={color.name}
                      className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 ${
                        isActive ? 'border-2 border-black scale-110' : 'border border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-sm">
            <button 
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-[110]"
            >
              <X className="w-6 h-6 text-black" />
            </button>
            
            {product.images.length > 1 && (
              <>
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-6 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-[110]"
                >
                  <ChevronLeft className="w-6 h-6 text-black" />
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-6 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-[110]"
                >
                  <ChevronRight className="w-6 h-6 text-black" />
                </button>
              </>
            )}

            <div className="relative w-[90vw] h-[90vh] flex items-center justify-center p-4">
              <div className="relative max-h-full max-w-full aspect-square h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage?.src || activeSrc}
                  alt={activeImage?.alt || product.name}
                  className="absolute inset-0 w-full h-full object-contain"
                />
                {isCustomizationSurface && (
                  <ProductCustomizationOverlay 
                    product={product} 
                    customization={customization} 
                    onPositionChange={handlePositionChange} 
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right: details */}
        <div className="relative z-20" style={{ backgroundColor: '#ffffff' }}>
          <h1
            className="text-2xl lg:text-[32px] font-bold leading-tight mb-2"
            style={{ color: '#1F2124' }}
          >
            {product.name}
          </h1>
          <p className="text-sm mb-8" style={{ color: '#666666' }}>
            SKU: {product.sku}
          </p>

          {/* PRICE BLOCK */}
          <div className="mb-8">
            <div className="text-[26px] font-bold text-[#1F2124]">
               {formatGBP(priceDetails.unitPrice)} <span className="text-[14px] font-normal text-gray-500">/ unit</span>
            </div>
            
            {priceDetails.statusText ? (
              <p
                className="text-[16px] font-semibold mt-2"
                style={{ color: priceDetails.statusColor }}
              >
                {priceDetails.statusText}
              </p>
            ) : (
              <div className="text-[14px] text-gray-500 mt-1">
                 {isGifts ? 'Excluding VAT' : 'Including logo customisation · Excluding VAT'}
              </div>
            )}

            {priceDetails.discountRate > 0 && (
              <div
                className="mt-3 inline-block px-4 py-2 rounded-full font-bold text-[14px]"
                style={{
                  background: 'linear-gradient(135deg,#e6f7df,#d4f2c6)',
                  color: '#1c6d14',
                }}
              >
                {priceDetails.discountLabel}
              </div>
            )}
          </div>

          {!isGifts && (
            <ProductCustomizer
              product={product}
              tiers={tiers}
              basePrice={basePrice}
              quantity={quantity}
              customization={customization}
              onQuantityChange={setQuantity}
              onCustomizationChange={handleCustomizationChange}
              onPriceChange={handlePriceChange}
            />
          )}

          {/* PURCHASE CONTROLS */}
          <div className="flex flex-col gap-6 pt-6 border-t border-gray-100">
             <div className="flex justify-between items-end">
                <div>
                   <label className="block text-[14px] font-semibold text-[#1F2124] mb-2">Quantity</label>
                   <input
                      type="number"
                      min={isGifts ? 1 : CUSTOMIZATION_MIN_QTY}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val >= 1) setQuantity(val);
                      }}
                      className="w-[100px] h-[48px] text-[16px] border border-gray-300 rounded-lg text-center bg-white text-[#1F2124] focus:ring-1 focus:ring-black focus:border-black"
                   />
                </div>
                <div className="text-right">
                   <div className="text-[14px] text-gray-500 mb-1">Total</div>
                   <div className="text-[22px] font-bold text-[#1F2124]">{formatGBP(priceDetails.totalPrice)}</div>
                </div>
             </div>

             <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full h-[54px] text-[16px] font-bold rounded-xl text-white transition-all disabled:opacity-50 flex items-center justify-center bg-black hover:bg-gray-900"
              style={{ backgroundColor: '#7b5bc6' }}
            >
              {isAdding ? 'Adding...' : 'Add to Basket'}
            </button>
          </div>

          {/* VOLUME PRICING */}
          {!isGifts && tiers.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
               <h3 className="text-[14px] font-semibold text-[#1F2124] mb-4">Volume Pricing</h3>
               <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                 <table className="w-full text-left text-[14px]">
                   <thead>
                     <tr className="border-b border-gray-200 text-[#1F2124]">
                       <th className="py-3 px-4 font-bold w-1/2">Product Quantity</th>
                       <th className="py-3 px-4 font-bold border-l border-gray-200 w-1/2">Price per Unit</th>
                     </tr>
                   </thead>
                   <tbody>
                     {tiers.map((tier) => {
                       const isActive = quantity >= tier.min && (tier.max === null || quantity <= tier.max);
                       return (
                         <tr 
                           key={tier.min} 
                           onClick={() => setQuantity(tier.min)}
                           className={`border-b last:border-b-0 border-gray-200 cursor-pointer transition-colors ${
                             isActive ? 'bg-[#7b5bc6] text-white' : 'hover:bg-gray-50 text-[#666666]'
                           }`}
                         >
                           <td className="py-3 px-4 font-medium">
                             {tier.max ? `${tier.min} - ${tier.max}` : `${tier.min}+`}
                           </td>
                           <td className={`py-3 px-4 border-l ${isActive ? 'border-[#8e74d1]' : 'border-gray-200'}`}>
                             {formatGBP(tier.price)}
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* Bespoke Enquiry Section */}
          <div className="mt-8">
            <p className="text-[#1F2124] mb-4 text-[15px] font-medium">
              If you'd like a more bespoke look to your product, get in touch with our Team, we can advise, inspire or just give you a quote.
            </p>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[#d2e0de] hover:bg-[#b8d1ce] transition-colors border border-black rounded-md px-8 py-3 font-semibold text-black tracking-wide text-[15px] shadow-[0px_4px_15px_rgba(0,0,0,0.08)]">
              <Send className="w-4 h-4" />
              BESPOKE ORDER ENQUIRY
            </Link>
          </div>

          {/* Icons Row */}
          <div className="mt-8">
            <TrustIndicators compact={true} />
          </div>

          {/* Tabs Section */}
          <div className="mt-12 w-full">
            {(() => {
              const allTabs: string[] = [];
              
              const hasCustomDescription = customTabs.some(t => t.title.trim().toLowerCase() === 'description');
              if (product.description && !hasCustomDescription) {
                allTabs.push('Description');
              }
              
              allTabs.push('Additional information');
              
              customTabs.forEach(t => {
                const title = t.title.trim();
                if (!allTabs.includes(title)) {
                  allTabs.push(title);
                }
              });
              
              const activeCustomTab = customTabs.find(t => t.title.trim() === activeTab);

              return (
                <>
                  <div className="flex overflow-x-auto border-b border-gray-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-6">
                    {allTabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-[15px] font-semibold whitespace-nowrap transition-all duration-300 relative ${
                          activeTab === tab
                            ? 'text-black'
                            : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {tab}
                        {activeTab === tab && (
                          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black rounded-t-md"></span>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="py-8 min-h-[200px] animate-in fade-in duration-500">
                    {activeTab === 'Description' && !activeCustomTab && (
                      product.description ? (
                        <div
                          className="leading-relaxed prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-black hover:prose-a:text-gray-600"
                          dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                      ) : (
                        <p className="text-gray-500 italic">No description available.</p>
                      )
                    )}

                    {activeTab === 'Additional information' && (
                      product.attributes.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                          <table className="w-full text-[15px] text-left">
                            <tbody className="divide-y divide-gray-100">
                              {product.attributes.map((attr) => (
                                <tr key={attr.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 px-6 font-semibold text-gray-900 w-1/3">
                                    {attr.name}
                                  </td>
                                  <td className="py-4 px-6 text-gray-600">
                                    {attr.terms.map((t) => t.name).join(', ')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No additional information available.</p>
                      )
                    )}

                    {activeCustomTab && (
                      <div
                        className="leading-relaxed prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-black hover:prose-a:text-gray-600"
                        dangerouslySetInnerHTML={{ __html: activeCustomTab.content }}
                      />
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
