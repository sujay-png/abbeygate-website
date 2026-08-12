'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Expand, X } from 'lucide-react';
import type { StoreProduct, PriceTier } from '../types/store-product';
import {
  calculateProductPrice,
  CUSTOMIZATION_MIN_QTY,
  formatGBP,
  isFoilBlockedProduct,
  isGiftsProduct,
} from '../utils/pricing';
import { processLogo } from '../utils/image-processing';
import { getProductPhysicalDimensionsMm } from '../utils/product-helpers';

export type CustomizationState = {
  enabled: boolean;
  blockingType: string;
  foilColor?: string;
  logoFile?: File;
  logoPreviewUrl?: string;
  logoScale: number;
  logoPosition: { x: number; y: number };
};

function useEvent<T extends (...args: any[]) => any>(handler: T) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  return useCallback((...args: Parameters<T>) => {
    const fn = handlerRef.current;
    return fn(...args);
  }, []);
}

type ProductCustomizerProps = {
  product: StoreProduct;
  tiers: PriceTier[];
  basePrice: number;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onCustomizationChange: (state: CustomizationState) => void;
  onPriceChange: (unitPrice: number, totalPrice: number) => void;
};

export const ProductCustomizer = ({
  product,
  tiers,
  basePrice,
  quantity,
  onCustomizationChange,
  onPriceChange,
}: ProductCustomizerProps) => {
  const isGifts = isGiftsProduct(product);
  const isFoil = isFoilBlockedProduct(product);
  const productImage = product.images[0]?.src || product.images[0]?.thumbnail || '';

  // Calculate physical dimensions and 20mm margin as exact percentages
  const { width: widthMm, height: heightMm } = getProductPhysicalDimensionsMm(product);
  const marginMm = 20;
  const marginXPercent = (marginMm / widthMm) * 100;
  const marginYPercent = (marginMm / heightMm) * 100;

  const [customization, setCustomization] = useState<CustomizationState>({
    enabled: !isGifts,
    blockingType: isFoil ? 'Foil blocked' : 'Embossed',
    foilColor: isFoil ? 'Silver' : undefined,
    logoScale: 1,
    logoPosition: { x: 0, y: 0 },
  });
  
  const [collapseOpen, setCollapseOpen] = useState(true);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Safely track precise visual coordinates
  const logoX = useMotionValue(0);
  const logoY = useMotionValue(0);
  
  useEffect(() => {
    if (isFullscreenPreview) {
      const updateScale = () => {
        const scale = Math.min((window.innerWidth * 0.9) / 400, (window.innerHeight * 0.9) / 400);
        setScaleFactor(scale);
      };
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [isFullscreenPreview]);
  const [priceResult, setPriceResult] = useState(() =>
    calculateProductPrice({
      quantity,
      basePrice,
      tiers,
      customizationEnabled: !isGifts,
      blockingType: isFoil ? 'Foil blocked' : 'Embossed',
      isGifts,
    }),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const syncToParent = useEvent(
    (result: ReturnType<typeof calculateProductPrice>, custom: CustomizationState) => {
      onPriceChange(result.unitPrice, result.totalPrice);
      onCustomizationChange(custom);
    },
  );

  useEffect(() => {
    const effectiveEnabled =
      !isGifts && quantity >= CUSTOMIZATION_MIN_QTY && customization.enabled;

    const result = calculateProductPrice({
      quantity,
      basePrice,
      tiers,
      customizationEnabled: effectiveEnabled,
      blockingType: customization.blockingType,
      isGifts,
    });

    setPriceResult(result);
    syncToParent(result, { ...customization, enabled: effectiveEnabled });
  }, [quantity, customization, basePrice, tiers, isGifts]);

  const showCustomization = !isGifts && quantity >= CUSTOMIZATION_MIN_QTY;

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: 22,
    margin: '22px 0',
    borderRadius: 14,
    boxShadow: '0 3px 18px rgba(0,0,0,0.08)',
  };

  const isFoilSelected = customization.blockingType === 'Foil blocked';

  return (
    <div className="abbey-pdp max-w-[520px]" style={{ backgroundColor: '#ffffff' }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#1F2124' }}>
          {formatGBP(priceResult.unitPrice)}
          <br />
          <small style={{ fontSize: 14, color: '#555', fontWeight: 400 }}>
            (Price Per Unit)
          </small>
        </div>
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginTop: 8,
            color: priceResult.statusColor,
          }}
        >
          {priceResult.statusText}
        </p>
      </div>

      {showCustomization && (
        <div>
          <div style={cardStyle}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 18,
                cursor: 'pointer',
                color: '#1F2124',
              }}
            >
              <input
                type="checkbox"
                checked={customization.enabled}
                onChange={(e) =>
                  setCustomization((prev) => ({ ...prev, enabled: e.target.checked }))
                }
              />
              Customise this product (Logo upload required)
            </label>

            {customization.enabled && (
              <div>
                <button
                  type="button"
                  onClick={() => setCollapseOpen(!collapseOpen)}
                  style={{
                    width: '100%',
                    fontSize: 17,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    color: '#1F2124',
                  }}
                >
                  Custom Logo Options
                  <span>{collapseOpen ? '▲' : '▼'}</span>
                </button>

                {collapseOpen && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label style={labelStyle}>Blocking Type</label>
                    <select
                      value={customization.blockingType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setCustomization((prev) => ({
                          ...prev,
                          blockingType: newType,
                          foilColor: newType === 'Foil blocked' ? 'Silver' : undefined,
                        }));
                      }}
                      style={selectStyle}
                    >
                      <option value="Foil blocked">Foil blocked</option>
                      <option value="Embossed">Embossed</option>
                    </select>

                    {isFoilSelected && (
                      <div className="mb-4">
                        <label style={labelStyle}>Foil Colour</label>
                        <div className="flex gap-4 mt-2">
                          {['Silver', 'Gold'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setCustomization(prev => ({ ...prev, foilColor: color }))}
                              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                customization.foilColor === color 
                                  ? 'border-black bg-gray-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              style={{ color: '#1F2124' }}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <label style={labelStyle}>Upload Logo</label>
                    <p className="text-xs text-gray-500 mb-2">
                      For best preview results, please upload a high-contrast image (black on white) or a transparent PNG.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          const processedUrl = await processLogo(file);
                          setCustomization((prev) => ({
                            ...prev,
                            logoFile: file,
                            logoPreviewUrl: processedUrl,
                          }));
                        } catch (error) {
                          console.error('Failed to process logo:', error);
                          // fallback
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setCustomization((prev) => ({
                              ...prev,
                              logoFile: file,
                              logoPreviewUrl: ev.target?.result as string,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: 14, display: 'block', marginBottom: 22, color: '#1F2124' }}
                    />
                    
                    {customization.logoPreviewUrl && (
                      <>
                        <label style={labelStyle}>Logo Scale</label>
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-sm text-gray-500 font-medium">50%</span>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="2" 
                            step="0.1" 
                            value={customization.logoScale}
                            onChange={(e) => setCustomization(prev => ({ ...prev, logoScale: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                          />
                          <span className="text-sm text-gray-500 font-medium">200%</span>
                        </div>
                        <p className="text-xs text-gray-500 italic">Drag the logo on the preview image below to position it. It will be constrained to a safe printing area.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {customization.enabled && customization.logoPreviewUrl && (
            <>
              {isFullscreenPreview && (
                <div 
                  className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
                  onClick={() => setIsFullscreenPreview(false)}
                />
              )}
              
              {isFullscreenPreview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreenPreview(false);
                  }}
                  className="fixed top-6 right-6 z-[60] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              )}

              <motion.div
                initial={false}
                animate={{
                  x: isFullscreenPreview ? "-50%" : "0%",
                  y: isFullscreenPreview ? "-50%" : "0%",
                  scale: isFullscreenPreview ? scaleFactor : 1,
                }}
                transition={{ duration: 0 }}
                style={
                  isFullscreenPreview
                    ? {
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        zIndex: 51,
                        width: 400,
                        height: 400,
                        backgroundColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }
                    : {
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        maxWidth: 400,
                        height: 400,
                        marginTop: 28,
                        overflow: 'hidden',
                        backgroundColor: '#f9f9f9',
                        borderRadius: 12,
                        border: '1px solid #e5e5e5'
                      }
                }
              >
                {!isFullscreenPreview && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullscreenPreview(true);
                    }}
                    className="absolute top-3 right-3 z-50 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm text-gray-700 transition-colors cursor-pointer"
                  >
                    <Expand className="w-5 h-5" />
                  </button>
                )}

                <div style={{ position: 'relative', maxHeight: '100%', maxWidth: '100%', display: 'flex' }}>
                  {/* Product Background Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productImage}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    style={{ maxHeight: 400, maxWidth: '100%', height: 'auto', width: 'auto', display: 'block' }}
                  />
                  
                  {/* Safe Area for Dragging (dynamically calculated 20mm padding) */}
                  <div
                    ref={constraintsRef}
                    className="absolute pointer-events-none"
                    style={{
                      top: `${marginYPercent}%`,
                      bottom: `${marginYPercent}%`,
                      left: `${marginXPercent}%`,
                      right: `${marginXPercent}%`,
                    }}
                  />
                
                {/* Draggable Logo Centering Wrapper */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 10 }}>
                  <motion.div
                    key={isFullscreenPreview ? 'full' : 'normal'}
                    drag
                    dragConstraints={constraintsRef}
                    dragElastic={0}
                    dragMomentum={false}
                    onDragEnd={() => {
                      setCustomization(prev => ({
                        ...prev,
                        logoPosition: { 
                          x: logoX.get(), 
                          y: logoY.get() 
                        }
                      }));
                    }}
                    style={{
                      position: 'absolute',
                      top: -60, // Half of 120 base height
                      left: -60, // Half of 120 base width
                      width: 120, // Base width
                      height: 120, // Base height
                      x: logoX,
                        y: logoY,
                      scale: customization.logoScale,
                      cursor: 'grab',
                    }}
                    whileDrag={{ cursor: 'grabbing', scale: customization.logoScale * 1.05 }}
                  >
                    {customization.blockingType === 'Foil blocked' ? (
                      <div 
                        className="w-full h-full pointer-events-none"
                        style={{
                          maskImage: `url(${customization.logoPreviewUrl})`,
                          WebkitMaskImage: `url(${customization.logoPreviewUrl})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                          backgroundImage: customization.foilColor === 'Gold' ? 'url(/images/foil/gold.avif)' : 'url(/images/foil/silver.avif)',
                          backgroundSize: 'cover',
                          opacity: 0.95,
                          filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.4))'
                        }}
                      />
                    ) : (
                      <>
                        {/* Embossed Highlight Edge */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            maskImage: `url(${customization.logoPreviewUrl}), url(${customization.logoPreviewUrl})`,
                            WebkitMaskImage: `url(${customization.logoPreviewUrl}), url(${customization.logoPreviewUrl})`,
                            maskPosition: 'calc(50% - 1px) calc(50% - 1px), center',
                            WebkitMaskPosition: 'calc(50% - 1px) calc(50% - 1px), center',
                            maskSize: 'contain, contain',
                            WebkitMaskSize: 'contain, contain',
                            maskRepeat: 'no-repeat, no-repeat',
                            WebkitMaskRepeat: 'no-repeat, no-repeat',
                            maskComposite: 'subtract',
                            WebkitMaskComposite: 'source-out',
                            backgroundColor: 'rgba(255, 255, 255, 0.45)',
                            mixBlendMode: 'screen',
                            filter: 'blur(0.5px)',
                          }}
                        />
                        {/* Embossed Shadow Edge */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            maskImage: `url(${customization.logoPreviewUrl}), url(${customization.logoPreviewUrl})`,
                            WebkitMaskImage: `url(${customization.logoPreviewUrl}), url(${customization.logoPreviewUrl})`,
                            maskPosition: 'calc(50% + 1px) calc(50% + 1px), center',
                            WebkitMaskPosition: 'calc(50% + 1px) calc(50% + 1px), center',
                            maskSize: 'contain, contain',
                            WebkitMaskSize: 'contain, contain',
                            maskRepeat: 'no-repeat, no-repeat',
                            WebkitMaskRepeat: 'no-repeat, no-repeat',
                            maskComposite: 'subtract',
                            WebkitMaskComposite: 'source-out',
                            backgroundColor: 'rgba(0, 0, 0, 0.55)',
                            mixBlendMode: 'multiply',
                            filter: 'blur(0.5px)',
                          }}
                        />
                      </>
                    )}
                  </motion.div>
                </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      )}

      <div style={cardStyle}>
        <div
          style={{
            backgroundColor: '#f8f8f8',
            borderRadius: 12,
            padding: 16,
            fontSize: 22,
            fontWeight: 700,
            color: '#1F2124',
          }}
        >
          Total: {formatGBP(priceResult.totalPrice)}
        </div>
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginTop: 8,
            color: priceResult.statusColor,
          }}
        >
          {priceResult.statusText}
        </p>
        {priceResult.discountRate > 0 && (
          <div
            style={{
              marginTop: 12,
              background: 'linear-gradient(135deg,#e6f7df,#d4f2c6)',
              padding: '10px 18px',
              borderRadius: 999,
              fontWeight: 700,
              color: '#1c6d14',
              fontSize: 14,
              display: 'inline-block',
            }}
          >
            {priceResult.discountLabel}
          </div>
        )}
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  marginTop: 14,
  marginBottom: 10,
  color: '#1F2124',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ccc',
  fontSize: 15,
  marginBottom: 22,
  backgroundColor: '#ffffff',
  color: '#1F2124',
};
