'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { StoreProduct, PriceTier } from '../types/store-product';
import { ProductCustomizer, type CustomizationState } from './ProductCustomizer';
import { ProductCustomizationOverlay } from './ProductCustomizationOverlay';
import { useCart } from '@/features/cart/context/CartContext';
import { CUSTOMIZATION_MIN_QTY, formatGBP, isGiftsProduct } from '../utils/pricing';
import { getLogoAnchors, getImageBoundingBox } from '../utils/product-helpers';
import { getConfiguredImageBounds } from '../utils/product-image-bounds';
import { TrustIndicators } from '@/components/home/TrustIndicators';
import { Send, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Link from 'next/link';

import type { CustomTab } from '@/features/products/services/store-products';

const ImageWithFallback = ({ src, fallbackSrc = '/images/logo/abbeygate-logo.png', ...rest }: any) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...rest}
      src={imgSrc || fallbackSrc}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
};

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
  const activeColorHex = colorVariants.find(c => c.slug === product.slug)?.hex;

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const customizerSectionRef = useRef<HTMLDivElement>(null);
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
  const [isCustomizingStarted, setIsCustomizingStarted] = useState(false);
  const isCustomizationSurface = activeImageIndex === 0;
  const [customization, setCustomization] = useState<CustomizationState>({
    enabled: !isGifts,
    blockingType: 'Embossed',
    logoScale: 0.8,
    logoPosition: { x: 0, y: 0 },
    cornerEdges: 'None',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [imageBounds, setImageBounds] = useState<{top: number, bottom: number, left: number, right: number} | null>(null);

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

  useEffect(() => {
    if (activeSrc) {
      const configuredBounds = getConfiguredImageBounds(activeSrc);
      if (configuredBounds) {
        setImageBounds(configuredBounds);
        return;
      }

      getImageBoundingBox(activeSrc).then(bounds => {
        console.log('[DEBUG] imageBounds for', activeSrc, ':', bounds);
        if (bounds) setImageBounds(bounds);
      });
    }
  }, [activeSrc]);

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


  const generateProof = async (): Promise<Partial<CustomizationState> | null> => {
    if (!activeSrc || !customization.enabled || isGifts) return null;

    let fullPreviewUrl: string | undefined = undefined;
    let finalBounds: any = null;
    let leftPercent = 50;
    let topPercent = 50;
    let widthPercent = 25 * (customization.logoScale || 1);

    try {
      const CANVAS_SIZE = 800;
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(activeSrc)}`);
        const data = await res.json();

        if (data.dataUrl) {
          const productImg = new window.Image();
          productImg.src = data.dataUrl;
          await new Promise(r => { productImg.onload = r; productImg.onerror = r; });

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

          const bounds = getConfiguredImageBounds(activeSrc) ?? await getImageBoundingBox(activeSrc);
          if (bounds) finalBounds = bounds;

          const anchors = getLogoAnchors(product);
          const bookLeft = finalBounds ? finalBounds.left : anchors.bookLeft;
          const bookRight = finalBounds ? finalBounds.right : anchors.bookRight;
          const bookTop = finalBounds ? finalBounds.top : anchors.bookTop;
          const bookBottom = finalBounds ? finalBounds.bottom : anchors.bookBottom;

          const bookWidth = bookRight - bookLeft;
          const bookHeight = bookBottom - bookTop;
          const marginX = bookWidth * 0.08;
          const marginY = bookHeight * 0.05;

          const safeLeft = bookLeft + marginX;
          const safeRight = bookRight - marginX;
          const safeTop = bookTop + marginY;
          const safeBottom = bookBottom - marginY;

          if (customization.logoPreviewUrl) {
            const logoImg = new window.Image();
            logoImg.src = customization.logoPreviewUrl;
            await new Promise(r => { logoImg.onload = r; logoImg.onerror = r; });

            const posLabel = customization.logoPosition?.label || 'center';
            let boxLeft = 50 - 12.5;
            let boxTop = 50 - 12.5;

            if (posLabel === 'top-left') { boxLeft = safeLeft; boxTop = safeTop; }
            else if (posLabel === 'top-center') { boxLeft = 50 - 12.5; boxTop = safeTop; }
            else if (posLabel === 'top-right') { boxLeft = safeRight - 25; boxTop = safeTop; }
            else if (posLabel === 'center-left') { boxLeft = safeLeft; boxTop = 50 - 12.5; }
            else if (posLabel === 'center-right') { boxLeft = safeRight - 25; boxTop = 50 - 12.5; }
            else if (posLabel === 'bottom-left') { boxLeft = safeLeft; boxTop = safeBottom - 25; }
            else if (posLabel === 'bottom-center') { boxLeft = 50 - 12.5; boxTop = safeBottom - 25; }
            else if (posLabel === 'bottom-right') { boxLeft = safeRight - 25; boxTop = safeBottom - 25; }

            const scaledBoxWidth = 25 * (customization.logoScale || 1);
            const scaledBoxHeight = 25 * (customization.logoScale || 1);
            
            if (posLabel.includes('right')) boxLeft = boxLeft + 25 - scaledBoxWidth;
            else if (!posLabel.includes('left')) boxLeft = boxLeft + 12.5 - scaledBoxWidth / 2;

            if (posLabel.includes('bottom')) boxTop = boxTop + 25 - scaledBoxHeight;
            else if (!posLabel.includes('top')) boxTop = boxTop + 12.5 - scaledBoxHeight / 2;

            const logoImgAspect = logoImg.width / logoImg.height;
            let drawLogoW = scaledBoxWidth;
            let drawLogoH = scaledBoxHeight;
            if (logoImgAspect > 1) {
              drawLogoH = scaledBoxWidth / logoImgAspect;
            } else {
              drawLogoW = scaledBoxHeight * logoImgAspect;
            }

            let logoDrawXPercent = boxLeft;
            let logoDrawYPercent = boxTop;
            
            if (posLabel.includes('right')) logoDrawXPercent = boxLeft + scaledBoxWidth - drawLogoW;
            else if (!posLabel.includes('left')) logoDrawXPercent = boxLeft + (scaledBoxWidth - drawLogoW) / 2;

            if (posLabel.includes('bottom')) logoDrawYPercent = boxTop + scaledBoxHeight - drawLogoH;
            else if (!posLabel.includes('top')) logoDrawYPercent = boxTop + (scaledBoxHeight - drawLogoH) / 2;
            
            leftPercent = logoDrawXPercent + (drawLogoW / 2);
            topPercent = logoDrawYPercent + (drawLogoH / 2);
            widthPercent = drawLogoW;

            const logoX = CANVAS_SIZE * (logoDrawXPercent / 100);
            const logoY = CANVAS_SIZE * (logoDrawYPercent / 100);
            const logoW = CANVAS_SIZE * (drawLogoW / 100);
            const logoH = CANVAS_SIZE * (drawLogoH / 100);

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
            } else if (customization.blockingType === 'Embossed') {
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
            } else {
              ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
            }
          }

          if (customization.cornerEdges && customization.cornerEdges !== 'None') {
            try {
              if (finalBounds) {
                const offset = CANVAS_SIZE * 0.004;
                const clipW = CANVAS_SIZE * 0.06;
                const clipH = clipW;
                
                const bookRightPx = drawX + (finalBounds.right / 100) * drawW;
                const bookTopPx = drawY + (finalBounds.top / 100) * drawH;
                const bookBottomPx = drawY + (finalBounds.bottom / 100) * drawH;

                const clipPath = new Path2D('M 0 0 L 32 0 Q 36 0 36 4 L 36 36 L 28 36 L 28 12 Q 28 8 24 8 L 0 8 Z');

                const drawCorner = (x: number, y: number, rotation: number) => {
                  ctx.save();
                  ctx.translate(x, y);
                  ctx.shadowColor = 'rgba(0,0,0,0.3)';
                  ctx.shadowBlur = 4;
                  ctx.shadowOffsetY = 2;
                  ctx.translate(clipW/2, clipH/2);
                  ctx.rotate(rotation * Math.PI / 180);
                  ctx.translate(-clipW/2, -clipH/2);
                  ctx.scale(clipW/36, clipH/36);
                  const grad = ctx.createLinearGradient(0, 0, 36, 36);
                  if (customization.cornerEdges === 'Gold') {
                    grad.addColorStop(0, '#F3E5AB');
                    grad.addColorStop(0.5, '#D4AF37');
                    grad.addColorStop(1, '#AA7C11');
                  } else {
                    grad.addColorStop(0, '#F5F5F5');
                    grad.addColorStop(0.5, '#C0C0C0');
                    grad.addColorStop(1, '#808080');
                  }
                  ctx.fillStyle = grad;
                  ctx.fill(clipPath);
                  ctx.restore();
                };

                drawCorner(bookRightPx + offset - clipW, bookTopPx - offset, 0);
                drawCorner(bookRightPx + offset - clipW, bookBottomPx + offset - clipH, 90);
              }
            } catch (e) {
              console.error('Failed to draw corners on canvas', e);
            }
          }

          fullPreviewUrl = canvas.toDataURL('image/png', 0.9);
        }
      }
    } catch (e) {
      console.error('Native canvas composition failed', e);
    }

    return {
      fullPreviewUrl,
      imageBounds: finalBounds,
      leftPercent,
      topPercent,
      widthPercent
    };
  };
  const handleAddToCart = async () => {
    // If not customizing yet, the button will act as "Start customising"
    if (customization.enabled && !isCustomizingStarted && !isGifts) {
      setIsCustomizingStarted(true);
      // The customizer is below the gallery on mobile, so scrolling to the
      // page top leaves it out of view. Wait for it to render, then target it.
      requestAnimationFrame(() => {
        customizerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

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
      let finalBounds: { top: number, bottom: number, left: number, right: number } | null = null;

      if (customization.enabled && !isGifts) {
        attributes.push({ name: 'Custom Logo', value: '' });

        if (customization.blockingType) {
          attributes.push({ name: 'Blocking', value: customization.blockingType.replace(' blocked', '') });
        }
        if (customization.blockingType === 'Foil blocked' && customization.foilColor) {
          attributes.push({ name: 'Foil Colour', value: customization.foilColor });
        }
        if (customization.logoFile) {
          attributes.push({ name: 'Logo', value: customization.logoFile.name });
        }
        if (customization.cornerEdges !== 'None') {
          attributes.push({ name: 'Corner Edges', value: customization.cornerEdges });
        }


        let fullPreviewUrl = customization.fullPreviewUrl;
        let finalBounds = customization.imageBounds;

        if (!fullPreviewUrl) {
          const result = await generateProof();
          if (result) {
            fullPreviewUrl = result.fullPreviewUrl;
            finalBounds = result.imageBounds;
            if (result.leftPercent !== undefined) leftPercent = result.leftPercent;
            if (result.topPercent !== undefined) topPercent = result.topPercent;
            if (result.widthPercent !== undefined) widthPercent = result.widthPercent;
          }
        } else {
           if (customization.leftPercent !== undefined) leftPercent = customization.leftPercent;
           if (customization.topPercent !== undefined) topPercent = customization.topPercent;
           if (customization.widthPercent !== undefined) widthPercent = customization.widthPercent;
        }
      } // closing the if(customization.enabled) block!

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
              cornerEdges: customization.cornerEdges,
              position: (customization.logoPosition?.label || 'center').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              fileName: customization.logoFile?.name,
              logoFile: customization.logoFile,
              logoPreviewUrl: customization.logoPreviewUrl,
              fullPreviewUrl: fullPreviewUrl,
              leftPercent,
              topPercent,
              widthPercent,
              imageBounds: finalBounds || undefined,
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
        {/* Left: gallery and customizer */}
        <div className="relative z-10 lg:sticky lg:top-32 self-start flex flex-col gap-8 w-full">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6 w-full">
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
                      <ImageWithFallback
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
                  <div className="absolute inset-0 p-4 scale-105">
                    <div className="relative w-full h-full">
                      {product.images.map((img, idx) => {
                        const isActive = img.src === activeSrc;
                        return (
                          <ImageWithFallback
                            key={img.id || idx}
                            src={img.src}
                            alt={img.alt || product.name}
                            fill
                            priority={true}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className={`transition-all duration-500 object-contain ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                          />
                        );
                      })}
                      {isCustomizationSurface && (
                        <ProductCustomizationOverlay
                          product={product}
                          customization={customization}
                          onPositionChange={handlePositionChange}
                          imageBounds={imageBounds}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
          </div>
          
          {/* Customizer underneath the gallery on the left */}
          {!isGifts && isCustomizingStarted && customization.enabled && (
            <div ref={customizerSectionRef}>
              <ProductCustomizer
                product={product}
                tiers={tiers}
                basePrice={basePrice}
                quantity={quantity}
                customization={customization}
                onQuantityChange={setQuantity}
                onCustomizationChange={handleCustomizationChange}
                onPriceChange={handlePriceChange}
                activeColorHex={activeColorHex}
                activeImageUrl={activeSrc}
                onGenerateProof={generateProof}
                onAddToCart={handleAddToCart}
                isAdding={isAdding}
              />
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
                <ImageWithFallback
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
                    imageBounds={imageBounds}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customisation order sidebar: replaces the product-detail panel once
            the customer starts the multi-step customisation flow. */}
        {isCustomizingStarted && customization.enabled && (
          <aside className="relative z-20 flex h-fit flex-col gap-5 lg:sticky lg:top-32">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-[#4a346e]">{product.categories?.[0]?.name ? `${product.categories[0].name} collection` : 'Collection'}</p>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-[#1F2124] lg:text-[32px]">{product.name}</h2>
              {product.sku && <p className="mt-2 text-[13px] text-gray-500">SKU: {product.sku}</p>}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-transparent p-5">
              <span className="text-[14px] font-bold text-[#1F2124]">Quantity</span>
              <div className="flex h-9 items-center overflow-hidden rounded-md border border-gray-300 bg-white">
                <button type="button" aria-label="Decrease quantity" className="px-3 text-gray-600 hover:bg-gray-100" onClick={() => setQuantity(Math.max(CUSTOMIZATION_MIN_QTY, quantity - 1))}>−</button>
                <span className="w-10 text-center text-[14px] font-bold text-[#1F2124]">{quantity}</span>
                <button type="button" aria-label="Increase quantity" className="px-3 text-gray-600 hover:bg-gray-100" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <dl className="rounded-lg border border-gray-200 bg-transparent p-5 space-y-2.5 text-[13px] text-gray-600">
              <div className="flex justify-between gap-4"><dt>Unit price (ex VAT)</dt><dd className="font-medium text-[#1F2124]">{formatGBP(priceDetails.unitPrice)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Branding</dt><dd className="text-right font-medium text-[#1F2124]">{customization.blockingType}</dd></div>
              <div className="flex justify-between gap-4"><dt>Corner edges</dt><dd className="font-medium text-[#1F2124]">{customization.cornerEdges}</dd></div>
              <div className="flex justify-between gap-4 border-t border-gray-200 pt-3"><dt>Subtotal (ex VAT)</dt><dd className="font-semibold text-[#1F2124]">{formatGBP(priceDetails.totalPrice)}</dd></div>
            </dl>

            {!isGifts && tiers.length > 0 && (() => {
              const activeTierIndex = tiers.findIndex(tier => quantity >= tier.min && (tier.max === null || quantity <= tier.max));
              const nextTier = activeTierIndex >= 0 ? tiers[activeTierIndex + 1] : null;
              const savings = nextTier ? (priceDetails.unitPrice - nextTier.price) * nextTier.min : 0;

              if (!nextTier || savings <= 0) return null;

              return (
                <div className="mt-5 rounded-lg border border-[#d2e0de] bg-[#e6f0ef] p-4">
                  <p className="text-[14px] font-bold text-[#1f6d63]">You could save {formatGBP(savings)}</p>
                  <p className="mt-1 text-[12px] text-gray-600">by ordering {nextTier.min} units ({formatGBP(nextTier.price)} per unit, ex VAT)</p>
                  <button type="button" onClick={() => setQuantity(nextTier.min)} className="mt-3 w-full rounded-md border border-[#1f6d63] bg-white px-3 py-2 text-[12px] font-bold text-[#1f6d63] transition-colors hover:bg-[#d2e0de]">
                    Increase to {nextTier.min} units →
                  </button>
                </div>
              );
            })()}

            <button type="button" onClick={handleAddToCart} disabled={isAdding} className="mt-5 flex h-[50px] w-full items-center justify-center rounded-lg bg-[#4a346e] text-[15px] font-bold text-white transition-colors hover:bg-[#392657] disabled:opacity-50">
              {isAdding ? 'Processing...' : 'Add to Basket →'}
            </button>
            <p className="mt-3 text-[12px] leading-relaxed text-gray-500">All prices shown exclude VAT. Applicable VAT is calculated at checkout. A final digital proof is provided for approval before production.</p>

            {!isGifts && tiers.length > 0 && (
              <div className="mt-5 border-t border-gray-200 pt-5">
                <h3 className="mb-3 text-[12px] font-bold tracking-widest text-[#1F2124]">PRICE BREAKS (PER UNIT)</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-white text-gray-500">
                      <tr><th className="px-3 py-2.5 font-medium">Quantity</th><th className="px-3 py-2.5 text-right font-medium">Price (ex VAT)</th></tr>
                    </thead>
                    <tbody>
                      {tiers.map(tier => {
                        const active = quantity >= tier.min && (tier.max === null || quantity <= tier.max);
                        return (
                          <tr key={tier.min} onClick={() => setQuantity(tier.min)} className={`cursor-pointer border-t border-gray-200 ${active ? 'bg-[#4a346e] font-bold text-white' : 'text-[#1F2124] hover:bg-gray-50'}`}>
                            <td className="px-3 py-2.5">{tier.max ? `${tier.min} - ${tier.max}` : `${tier.min}+`}</td>
                            <td className="px-3 py-2.5 text-right">{formatGBP(tier.price)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Right: normal product details */}
        <div className={`relative z-20 flex flex-col gap-5 ${isCustomizingStarted && customization.enabled ? 'hidden' : ''}`} style={{ backgroundColor: '#ffffff' }}>

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
              {(() => {
                  const customDesc = customTabs.find(t => t.title.trim().toLowerCase() === 'description');
                  const descHtml = customDesc ? customDesc.content : product.description;
                  if (descHtml) {
                    return (
                      <div 
                        className="leading-relaxed prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-black hover:prose-a:text-gray-600"
                        dangerouslySetInnerHTML={{ __html: descHtml }} 
                      />
                    );
                  }
                  return <p className="italic">No description available.</p>;
                })()}
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

            {!isGifts && quantity >= CUSTOMIZATION_MIN_QTY && (
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${!customization.enabled
                    ? 'border-gray-300 bg-white'
                    : 'border-gray-200 bg-gray-50'
                  }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={!customization.enabled}
                    onChange={(e) => {
                      const enabled = !e.target.checked;
                      handleCustomizationChange({ ...customization, enabled });
                      if (!enabled) {
                        setIsCustomizingStarted(false);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-[14px] text-[#4a346e]">
                    No customisation required
                  </span>
                  <span className="block text-[13px] text-gray-500 mt-1">
                    I don't need to add a logo or personalisation. Prices below will update to exclude branding.
                  </span>
                </div>
              </label>
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
              {isAdding 
                ? 'Processing...' 
                : (!customization.enabled || isCustomizingStarted || isGifts)
                  ? 'Add to Basket \u2192' 
                  : 'Start customising \u2192'}
            </button>
          </div>

          <div className="text-[14px] text-gray-600 mt-2">
            Prices below {customization.enabled ? 'include logo branding' : 'exclude branding'}.
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
            {(() => {
              const deliveryTab = customTabs.find(t => 
                t.title.trim().toLowerCase() === 'shipping' || 
                t.title.trim().toLowerCase() === 'delivery'
              );
              
              if (!deliveryTab) return null;

              return (
                <details className="group border border-gray-200 rounded-lg bg-white overflow-hidden mt-4">
                  <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-[14px] text-[#1F2124] hover:bg-gray-50">
                    <span>Delivery</span>
                    <span className="transition group-open:rotate-45 text-xl leading-none">+</span>
                  </summary>
                  <div className="p-4 border-t border-gray-200 text-[14px] text-gray-600">
                    <div 
                      className="leading-relaxed prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-black hover:prose-a:text-gray-600"
                      dangerouslySetInnerHTML={{ __html: deliveryTab.content }} 
                    />
                  </div>
                </details>
              );
            })()}

            {/* Other Custom Tabs Accordions */}
            {customTabs.filter(t => {
              const title = t.title.trim().toLowerCase();
              return title !== 'description' && title !== 'shipping' && title !== 'delivery';
            }).map((tab, idx) => (
              <details key={idx} className="group border border-gray-200 rounded-lg bg-white overflow-hidden mt-4">
                <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-[14px] text-[#1F2124] hover:bg-gray-50">
                  <span>{tab.title}</span>
                  <span className="transition group-open:rotate-45 text-xl leading-none">+</span>
                </summary>
                <div className="p-4 border-t border-gray-200 text-[14px] text-gray-600">
                  <div 
                    className="leading-relaxed prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-black hover:prose-a:text-gray-600"
                    dangerouslySetInnerHTML={{ __html: tab.content }} 
                  />
                </div>
              </details>
            ))}

        </div>
      </div>
    </div>
  );
};



