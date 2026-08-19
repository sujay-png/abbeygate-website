'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
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
    logoPosition: { x: 0, y: 0 },
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

  const handlePositionChange = useCallback((position: { x: number; y: number }) => {
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
          widthPercent = 25 * (customization.logoScale || 1);
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
                const productImg = new window.Image();
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
                  const logoImg = new window.Image();
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
                    // Embossed fallback - replicate edge highlights
                    const darkEdge = document.createElement('canvas');
                    darkEdge.width = logoW; darkEdge.height = logoH;
                    const dCtx = darkEdge.getContext('2d');
                    if (dCtx) {
                      dCtx.drawImage(logoImg, 0, 0, logoW, logoH);
                      dCtx.globalCompositeOperation = 'source-in';
                      dCtx.fillStyle = 'rgba(0,0,0,0.5)';
                      dCtx.fillRect(0, 0, logoW, logoH);
                      dCtx.globalCompositeOperation = 'destination-out';
                      dCtx.drawImage(logoImg, 1, 1, logoW, logoH);

                      ctx.save();
                      ctx.filter = 'blur(0.5px)';
                      ctx.globalCompositeOperation = 'multiply';
                      ctx.drawImage(darkEdge, logoX, logoY, logoW, logoH);
                      ctx.restore();
                    }

                    const lightEdge = document.createElement('canvas');
                    lightEdge.width = logoW; lightEdge.height = logoH;
                    const lCtx = lightEdge.getContext('2d');
                    if (lCtx) {
                      lCtx.drawImage(logoImg, 0, 0, logoW, logoH);
                      lCtx.globalCompositeOperation = 'source-in';
                      lCtx.fillStyle = 'rgba(255,255,255,0.3)';
                      lCtx.fillRect(0, 0, logoW, logoH);
                      lCtx.globalCompositeOperation = 'destination-out';
                      lCtx.drawImage(logoImg, -1, -1, logoW, logoH);

                      ctx.save();
                      ctx.filter = 'blur(0.5px)';
                      ctx.globalCompositeOperation = 'screen';
                      ctx.drawImage(lightEdge, logoX, logoY, logoW, logoH);
                      ctx.restore();
                    }
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
              position: `X: ${Math.round(customization.logoPosition?.x || 0)}, Y: ${Math.round(customization.logoPosition?.y || 0)}, Scale: ${Math.round((customization.logoScale || 1) * 100)}%`,
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
        <div className="relative z-10 lg:sticky lg:top-32 self-start flex flex-col md:flex-row gap-4 lg:gap-6">
          {product.images.length > 1 && (
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:max-h-[600px] pb-2 md:pb-0 scrollbar-hide shrink-0 order-2 md:order-1">
              {product.images.map((img, index) => {
                const thumb = img.thumbnail || img.src;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-20 w-20 lg:h-24 lg:w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${index === activeImageIndex ? 'border-[#4a346e]' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    style={{ backgroundColor: '#f9f9f9' }}
                  >
                    <Image
                      src={thumb}
                      alt={img.alt || product.name}
                      fill
                      sizes="96px"
                      className="object-contain p-2"
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div
            className="relative w-full flex-1 overflow-hidden rounded-xl border border-gray-100 flex items-center justify-center p-4 group order-1 md:order-2"
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

            {product.images && product.images.length > 0 ? (
              <div className="absolute inset-0 bg-gray-50" ref={previewContainerRef}>
                {product.images.map((img, idx) => {
                  const isActive = img.src === activeSrc;
                  return (
                    <Image
                      key={img.id || idx}
                      src={img.src}
                      alt={img.alt || product.name}
                      fill
                      priority={true}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className={`transition-all duration-500 object-contain p-4 scale-105 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    />
                  );
                })}
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
                <Image
                  src={activeImage?.src || activeSrc}
                  alt={activeImage?.alt || product.name}
                  fill
                  sizes="90vw"
                  className="object-contain"
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
        <div className="relative z-20 flex flex-col gap-5" style={{ backgroundColor: '#ffffff' }}>

          <div>
            <div className="text-[13px] font-bold tracking-widest text-[#4a346e] uppercase mb-2">
              {product.categories?.[0]?.name ? `${product.categories[0].name} COLLECTION` : 'COLLECTION'}
            </div>
            <h1
              className="text-2xl lg:text-[32px] font-bold leading-tight mb-2"
              style={{ color: '#1F2124' }}
            >
              {product.name}
            </h1>

            {product.short_description && (
              <div
                className="text-[15px] text-[#1F2124] mb-3"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}
          </div>

          {/* PRICE BLOCK */}
          <div>
            <div className="text-[20px] font-bold text-[#1F2124] mb-1">
              {formatGBP(priceDetails.unitPrice)} <span className="text-[14px] font-normal text-gray-500">(ex VAT)</span>
            </div>

            {priceDetails.statusText ? (
              <p
                className="text-[14px] font-semibold mt-1"
                style={{ color: priceDetails.statusColor }}
              >
                {priceDetails.statusText}
              </p>
            ) : (
              <div className="text-[13px] text-gray-500">
                {isGifts ? 'Excluding VAT' : 'Including logo branding'}
              </div>
            )}
          </div>

          <div className="text-[13px] text-gray-500 mb-2">
            SKU: {product.sku}
          </div>

          {/* Description Accordion */}
          <details className="group border border-gray-200 rounded-lg bg-white overflow-hidden mb-2">
            <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-[14px] text-[#1F2124] hover:bg-gray-50">
              <span>Description</span>
              <span className="transition group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <div className="p-4 border-t border-gray-200 text-[14px] text-gray-600">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p className="italic">No description available.</p>
              )}
            </div>
          </details>

          {/* Available Colours Section */}
          {colorVariants.length > 0 && (
            <div className="mt-2 mb-2">
              <span className="text-[14px] font-bold text-[#1F2124] block mb-3">Colour: {product.name.split(', ').pop() || 'Selected'}</span>
              <div className="flex flex-wrap items-center gap-2">
                {colorVariants.map((color) => {
                  const isActive = product.slug === color.slug;
                  return (
                    <Link
                      key={color.slug}
                      href={`/product/${color.slug}`}
                      title={color.name}
                      className={`w-7 h-7 rounded-full shadow-sm transition-transform hover:scale-110 ${isActive ? 'ring-2 ring-offset-2 ring-black scale-110' : 'border border-gray-300'
                        }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Box */}
          <div className="bg-transparent border border-gray-200 rounded-lg p-5 flex flex-col gap-4 mt-2">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <label className="text-[14px] font-bold text-[#1F2124]">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 bg-white rounded-md overflow-hidden h-[36px]">
                  <button type="button" className="px-3 hover:bg-gray-100 text-gray-600 transition" onClick={() => setQuantity(Math.max(isGifts ? 1 : CUSTOMIZATION_MIN_QTY, quantity - 1))}>-</button>
                  <input
                    type="number"
                    min={isGifts ? 1 : CUSTOMIZATION_MIN_QTY}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val >= 1) setQuantity(val);
                    }}
                    className="w-[50px] text-center font-bold text-[#1F2124] focus:outline-none"
                  />
                  <button type="button" className="px-3 hover:bg-gray-100 text-gray-600 transition" onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 pb-2">
              <div className="text-[15px] font-bold text-[#1F2124]">
                {formatGBP(priceDetails.unitPrice)} <span className="text-[13px] font-normal text-gray-500">per unit (ex VAT)</span>
              </div>
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

            {/* Savings Callout */}
            {!isGifts && tiers.length > 0 && (() => {
              const currentTierIndex = tiers.findIndex(t => quantity >= t.min && (t.max === null || quantity <= t.max));
              const nextTier = currentTierIndex >= 0 && currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

              if (nextTier) {
                const potentialSavings = (priceDetails.unitPrice - nextTier.price) * nextTier.min;
                if (potentialSavings > 0) {
                  return (
                    <div className="bg-[#e6f0ef] rounded-lg p-4 mb-2 mt-2 border border-[#d2e0de]">
                      <div className="font-bold text-[#1f6d63] text-[14px]">You could save {formatGBP(potentialSavings)}</div>
                      <div className="text-[13px] text-gray-600 mb-3">by ordering {nextTier.min} units ({formatGBP(nextTier.price)} per unit, ex VAT)</div>
                      <button
                        type="button"
                        onClick={() => setQuantity(nextTier.min)}
                        className="w-full py-2 bg-white rounded-md border border-[#1f6d63] text-[#1f6d63] text-[13px] font-bold hover:bg-[#d2e0de] transition"
                      >
                        Increase to {nextTier.min} units &rarr;
                      </button>
                    </div>
                  );
                }
              }
              return null;
            })()}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full h-[54px] text-[16px] font-bold rounded-lg text-white transition-all disabled:opacity-50 flex items-center justify-center bg-[#4a346e] hover:bg-[#392657] mt-2"
            >
              {isAdding ? 'Processing...' : 'Add to Basket \u2192'}
            </button>
          </div>

          <div className="text-[14px] text-gray-600 mt-2">
            Prices below include logo branding.
          </div>

          {/* VOLUME PRICING TABLE */}
          {!isGifts && tiers.length > 0 && (
            <div className="mt-2">
              <h3 className="text-[14px] font-bold tracking-widest text-[#1F2124] uppercase mb-4">PRICE BREAKS (PER UNIT)</h3>
              <div className="overflow-hidden bg-transparent border border-gray-200 rounded-lg">
                <table className="w-full text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-3 px-4 font-normal w-1/2">Quantity</th>
                      <th className="py-3 px-4 font-normal w-1/2 text-right">Price per unit (ex VAT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((tier) => {
                      const isActive = quantity >= tier.min && (tier.max === null || quantity <= tier.max);
                      return (
                        <tr
                          key={tier.min}
                          onClick={() => setQuantity(tier.min)}
                          className={`border-b last:border-b-0 border-gray-200 cursor-pointer transition-colors ${isActive ? 'bg-[#4a346e] text-white font-bold' : 'hover:bg-gray-100 text-[#1F2124]'
                            }`}
                        >
                          <td className="py-3 px-4">
                            {tier.max ? `${tier.min} - ${tier.max}` : `${tier.min}+`}
                          </td>
                          <td className="py-3 px-4 text-right">
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

          {/* Specifications Accordion */}
          <details className="group border border-gray-200 rounded-lg bg-white overflow-hidden mt-4">
            <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-[14px] text-[#1F2124] hover:bg-gray-50">
              <span>Specifications</span>
              <span className="transition group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <div className="p-4 border-t border-gray-200 text-[14px] text-gray-600">
              {product.attributes.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {product.attributes.map(attr => (
                    <li key={attr.id}><span className="font-semibold">{attr.name}:</span> {attr.terms.map(t => t.name).join(', ')}</li>
                  ))}
                </ul>
              ) : (
                <p className="italic">No additional specifications available.</p>
              )}
            </div>
          </details>

          {/* Delivery Accordion */}
          <details className="group border border-gray-200 rounded-lg bg-white overflow-hidden">
            <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-[14px] text-[#1F2124] hover:bg-gray-50">
              <span>Delivery</span>
              <span className="transition group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <div className="p-4 border-t border-gray-200 text-[14px] text-gray-600">
              Standard delivery takes 3-5 working days. For customized products, please allow an additional 5-7 working days.
            </div>
          </details>

        </div>
      </div>
    </div>
  );
};



