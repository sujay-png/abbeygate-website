'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLenis } from 'lenis/react';
import type { StoreProduct, PriceTier } from '../types/store-product';
import {
  calculateProductPrice,
  CUSTOMIZATION_MIN_QTY,
  formatGBP,
  isFoilBlockedProduct,
  isGiftsProduct,
  LOGO_BLOCKING_PRICES,
  LOGO_CUSTOMIZATION_FEE
} from '../utils/pricing';
import { processLogo } from '../utils/image-processing';

export type CustomizationState = {
  enabled: boolean;
  blockingType: string;
  foilColor?: string;
  logoFile?: File;
  logoPreviewUrl?: string;
  logoScale: number;
  logoPosition: { x: number; y: number; label?: string; leftPercent?: number; topPercent?: number };
  cornerEdges: 'None' | 'Gold' | 'Silver';
  fullPreviewUrl?: string;
  leftPercent?: number;
  topPercent?: number;
  widthPercent?: number;
  imageBounds?: any;
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
  customization: CustomizationState;
  onQuantityChange: (qty: number) => void;
  onCustomizationChange: (state: CustomizationState) => void;
  onPriceChange: (result: ReturnType<typeof calculateProductPrice>) => void;
  activeColorHex?: string;
  activeColorName?: string;
  activeImageUrl?: string;
  onGenerateProof?: () => Promise<Partial<CustomizationState> | null>;
  onAddToCart?: () => void;
  isAdding?: boolean;
  amendKey?: string | null;
};

export const ProductCustomizer = ({
  product,
  tiers,
  basePrice,
  quantity,
  customization,
  onCustomizationChange,
  onPriceChange,
  activeColorHex,
  activeColorName,
  activeImageUrl,
  onGenerateProof,
  onAddToCart,
  isAdding,
  amendKey,
}: ProductCustomizerProps) => {
  const isGifts = isGiftsProduct(product);
  const isFoil = isFoilBlockedProduct(product);

  const [collapseOpen, setCollapseOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(amendKey ? 4 : 1);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getExtraCostLabel = (type: string) => {
    const price = LOGO_BLOCKING_PRICES[type.toLowerCase()] ?? LOGO_CUSTOMIZATION_FEE;
    const extra = price - LOGO_CUSTOMIZATION_FEE;
    return `From ${formatGBP(extra)}`;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const lenis = useLenis();
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Use a short timeout to ensure React has fully rendered the new step's DOM
    setTimeout(() => {
      const gallery = document.getElementById('product-gallery-container');
      if (gallery) {
        if (lenis) {
          lenis.scrollTo(gallery, { offset: -120 });
        } else {
          gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  }, [step, lenis]);

  const [priceResult, setPriceResult] = useState(() =>
    calculateProductPrice({
      quantity,
      basePrice,
      tiers,
      customizationEnabled: !isGifts,
      blockingType: isFoil ? 'Foil blocked' : 'Embossed',
      isGifts,
      cornerEdges: customization.cornerEdges,
    }),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncToParent = useEvent(
    (result: ReturnType<typeof calculateProductPrice>) => {
      onPriceChange(result);
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
      cornerEdges: customization.cornerEdges,
    });

    setPriceResult(result);
    syncToParent(result);
  }, [quantity, customization.enabled, customization.blockingType, customization.cornerEdges, basePrice, tiers, isGifts, syncToParent]);

  const showCustomization = !isGifts && quantity >= CUSTOMIZATION_MIN_QTY;

  if (!showCustomization) {
    return null;
  }

  const isFoilSelected = customization.blockingType === 'Foil blocked';

  return (
    <div className="mt-0 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* STEP TRACKER (Optional visual flair) */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`text-[12px] font-bold ${step === 1 ? 'text-brand-primary' : 'text-gray-400 hidden sm:block'}`}>1. Branding</div>
        <div className="h-px bg-gray-200 flex-1 hidden sm:block" />
        <div className={`text-[12px] font-bold ${step === 2 ? 'text-brand-primary' : 'text-gray-400 hidden sm:block'}`}>2. Position</div>
        <div className="h-px bg-gray-200 flex-1 hidden sm:block" />
        <div className={`text-[12px] font-bold ${step === 3 ? 'text-brand-primary' : 'text-gray-400 hidden sm:block'}`}>3. Extras</div>
        <div className="h-px bg-gray-200 flex-1 hidden sm:block" />
        <div className={`text-[12px] font-bold ${step === 4 ? 'text-brand-primary' : 'text-gray-400 hidden sm:block'}`}>4. Review</div>
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <div className="text-xl font-bold text-brand-body mb-2">Upload Logo</div>
            <p className="text-[13px] text-gray-500 mb-3">
              For best results, upload a high-contrast image (black on white) or a transparent PNG.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                if (file.size > 1.5 * 1024 * 1024) {
                  alert("Logo file is too large! Please upload a file smaller than 1.5MB.");
                  return;
                }

                try {
                  const processedUrl = await processLogo(file);
                  onCustomizationChange({
                    ...customization,
                    logoFile: file,
                    logoPreviewUrl: processedUrl,
                  });
                  // Auto-scroll up to see the logo applied to the product image
                  setTimeout(() => {
                    document.getElementById('product-gallery-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 150);
                } catch (error) {
                  console.error('Failed to process logo:', error);
                  // fallback
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    onCustomizationChange({
                      ...customization,
                      logoFile: file,
                      logoPreviewUrl: ev.target?.result as string,
                    });
                    setTimeout(() => {
                      document.getElementById('product-gallery-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 150);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="block w-full text-[14px] text-brand-body file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer transition-colors border border-gray-200 rounded-lg p-1"
            />
          </div>

          <div>
            <div className="text-xl font-bold text-brand-body mb-4">Choose Branding Type</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Foil Blocked Card */}
              <div 
                onClick={() => {
                  const newFoil = customization.foilColor || 'Gold';
                  const newCustomization = { ...customization, blockingType: 'Foil blocked', foilColor: newFoil };
                  if (customization.cornerEdges === 'Gold' || customization.cornerEdges === 'Silver') {
                    newCustomization.cornerEdges = newFoil as 'Gold' | 'Silver';
                  }
                  onCustomizationChange(newCustomization);
                }}
                className={`cursor-pointer rounded-xl border-2 transition-all p-3 ${customization.blockingType === 'Foil blocked' ? 'border-brand-primary bg-brand-tint' : 'border-gray-200 hover:border-gray-300 bg-transparent'}`}
              >
                  <div 
                    className="aspect-[3/2] rounded-lg mb-3 flex items-center justify-center overflow-hidden relative bg-center"
                    style={{ 
                      backgroundColor: activeColorHex || '#f3f4f6',
                      backgroundImage: product.images?.[0]?.src ? `url(${product.images[0].src})` : undefined,
                      backgroundSize: product.images?.[0]?.src ? '300%' : undefined
                    }}
                 >
                    {customization.logoPreviewUrl ? (
                      <div 
                        className="absolute inset-0 m-6 pointer-events-none"
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
                          backgroundPosition: 'center',
                          opacity: 0.95,
                          filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.3))'
                        }}
                      />
                    ) : (
                       <div className="text-gray-400 text-sm font-medium">Logo Preview</div>
                    )}
                 </div>
                 <div className="font-bold text-brand-body">Foil blocked</div>
                 <div className="text-[12px] text-gray-500 mt-1 mb-2 leading-relaxed">Metallic foil stamped into the cover for a premium finish.</div>
                 <div className="text-[12px] font-bold text-brand-primary mb-4">{getExtraCostLabel('Foil blocked')}</div>
                 
                 {customization.blockingType === 'Foil blocked' && (
                    <div className="mt-auto pt-3 border-t border-gray-200/60" onClick={e => e.stopPropagation()}>
                       <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Foil colour</div>
                       <div className="flex gap-3">
                         {['Gold', 'Silver'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => {
                                const newCustomization = { ...customization, foilColor: color };
                                if (customization.cornerEdges === 'Gold' || customization.cornerEdges === 'Silver') {
                                  newCustomization.cornerEdges = color as 'Gold' | 'Silver';
                                }
                                onCustomizationChange(newCustomization);
                              }}
                              title={color}
                              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${customization.foilColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                              style={{ background: color === 'Gold' ? 'linear-gradient(135deg, #F3E5AB, #D4AF37, #AA7C11)' : 'linear-gradient(135deg, #F5F5F5, #C0C0C0, #808080)' }}
                            />
                         ))}
                       </div>
                    </div>
                 )}
              </div>

              {/* Blind Debossed Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, blockingType: 'Embossed', foilColor: undefined })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-3 ${customization.blockingType === 'Embossed' ? 'border-brand-primary bg-brand-tint' : 'border-gray-200 hover:border-gray-300 bg-transparent'}`}
              >
                  <div 
                    className="aspect-[3/2] rounded-lg mb-3 flex items-center justify-center overflow-hidden relative bg-center"
                    style={{ 
                      backgroundColor: activeColorHex || '#f3f4f6',
                      backgroundImage: product.images?.[0]?.src ? `url(${product.images[0].src})` : undefined,
                      backgroundSize: product.images?.[0]?.src ? '300%' : undefined
                    }}
                 >
                    {customization.logoPreviewUrl ? (
                      <>
                        <div
                          className="absolute inset-0 pointer-events-none m-6"
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
                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                            mixBlendMode: 'screen',
                            filter: 'blur(0.5px)',
                          }}
                        />
                        <div
                          className="absolute inset-0 pointer-events-none m-6"
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
                            backgroundColor: 'rgba(0, 0, 0, 0.45)',
                            mixBlendMode: 'multiply',
                            filter: 'blur(0.5px)',
                          }}
                        />
                      </>
                    ) : (
                       <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm font-medium">Logo Preview</div>
                    )}
                 </div>
                 <div className="font-bold text-brand-body">Blind debossed</div>
                 <div className="text-[12px] text-gray-500 mt-1 mb-2 leading-relaxed">Logo is pressed directly into the material for a subtle effect.</div>
                 <div className="text-[12px] font-bold text-brand-primary mb-4">{getExtraCostLabel('Embossed')}</div>
              </div>

              {/* UV Print Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, blockingType: 'UV Print', foilColor: undefined })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-3 ${customization.blockingType === 'UV Print' ? 'border-brand-primary bg-brand-tint' : 'border-gray-200 hover:border-gray-300 bg-transparent'}`}
              >
                  <div 
                    className="aspect-[3/2] rounded-lg mb-3 flex items-center justify-center overflow-hidden relative bg-center"
                    style={{ 
                      backgroundColor: activeColorHex || '#f3f4f6',
                      backgroundImage: product.images?.[0]?.src ? `url(${product.images[0].src})` : undefined,
                      backgroundSize: product.images?.[0]?.src ? '300%' : undefined
                    }}
                 >
                    {customization.logoPreviewUrl ? (
                       <img 
                         src={customization.logoPreviewUrl} 
                         className="w-1/2 h-auto object-contain drop-shadow-sm"
                         alt="UV Print preview" 
                       />
                    ) : (
                       <div className="text-gray-400 text-sm font-medium">Logo Preview</div>
                    )}
                 </div>
                 <div className="font-bold text-brand-body">UV Print</div>
                 <div className="text-[12px] text-gray-500 mt-1 mb-2 leading-relaxed">Full colour digital printing directly onto the product surface.</div>
                 <div className="text-[12px] font-bold text-brand-primary mb-4">{getExtraCostLabel('UV Print')}</div>
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end mt-4">
             <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!customization.logoPreviewUrl}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-brand-primary-dark text-white font-bold rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
             >
                Proceed to Position &rarr;
             </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <div className="text-xl font-bold text-brand-body mb-4">Placement</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'top-left', label: 'Top left' },
                { id: 'top-center', label: 'Top centre' },
                { id: 'top-right', label: 'Top right' },
                { id: 'center', label: 'Centre' },
                { id: 'bottom-left', label: 'Bottom left' },
                { id: 'bottom-center', label: 'Bottom centre' },
                { id: 'bottom-right', label: 'Bottom right' },
              ].map((pos) => {
                const isSelected = customization.logoPosition.label === pos.id;
                
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => {
                      onCustomizationChange({
                        ...customization,
                        // Reset x and y to 0, and set the label so the overlay can anchor it
                        logoPosition: { x: 0, y: 0, label: pos.id }
                      });
                    }}
                    className={`px-4 py-3 rounded-lg border-2 text-[13px] font-bold transition-all flex flex-col items-center justify-center gap-1 min-w-[100px] flex-1 ${isSelected ? 'border-brand-primary bg-brand-tint text-brand-primary' : 'border-gray-200 bg-[#f8f7f5] text-brand-body hover:border-gray-300'}`}
                  >
                    <div className={`relative w-[22px] h-[30px] border-[1.5px] rounded-[3px] mb-1.5 transition-colors ${isSelected ? 'border-brand-primary bg-white' : 'border-gray-400 bg-white'}`}>
                      <div className={`absolute w-[4px] h-[4px] rounded-full transition-colors ${isSelected ? 'bg-brand-primary' : 'bg-gray-400'} ${
                        pos.id === 'top-left' ? 'top-[3px] left-[3px]' :
                        pos.id === 'top-center' ? 'top-[3px] left-1/2 -translate-x-1/2' :
                        pos.id === 'top-right' ? 'top-[3px] right-[3px]' :
                        pos.id === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                        pos.id === 'bottom-left' ? 'bottom-[3px] left-[3px]' :
                        pos.id === 'bottom-center' ? 'bottom-[3px] left-1/2 -translate-x-1/2' :
                        'bottom-[3px] right-[3px]'
                      }`} />
                    </div>
                    {pos.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xl font-bold text-brand-body mb-4">Logo Scale</div>
            <div className="flex items-center gap-4 max-w-md bg-gray-50 p-4 rounded-lg border border-gray-100">
              <span className="text-[13px] text-brand-body font-bold w-10">{Math.round(customization.logoScale * 100)}%</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={customization.logoScale}
                onChange={(e) => onCustomizationChange({ ...customization, logoScale: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
              <span className="text-[13px] text-gray-500 font-medium w-10 text-right">200%</span>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-3 mt-4">
             <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-100 text-brand-body font-bold rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap text-center"
             >
                &larr; Back to Branding
             </button>
             <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full sm:w-auto px-4 sm:px-8 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-dark transition-colors whitespace-nowrap text-center"
             >
                Proceed to Extras &rarr;
             </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <div className="text-xl font-bold text-brand-body mb-2 uppercase tracking-wide text-[13px] text-gray-700">Corner Edges</div>
            <div className="grid grid-cols-3 gap-4">
              
              {/* None Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, cornerEdges: 'None' })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-4 flex flex-col items-center justify-center min-h-[120px] ${customization.cornerEdges === 'None' ? 'border-brand-primary bg-brand-tint' : 'border-gray-200 hover:border-gray-300 bg-transparent'}`}
              >
                 <div 
                   className="w-10 h-10 rounded mb-3 shadow-sm border border-black/10 bg-center" 
                   style={{ 
                     backgroundColor: activeColorHex || 'var(--brand-primary-dark)',
                     backgroundImage: product.images?.[0]?.src ? `url(${product.images[0].src})` : undefined,
                     backgroundSize: product.images?.[0]?.src ? '300%' : undefined
                   }} 
                 />
                 <div className="font-bold text-brand-body">None</div>
                 <div className="text-[12px] text-gray-500 mt-1">Included</div>
              </div>

              {/* Gold Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, cornerEdges: 'Gold' })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-4 flex flex-col items-center justify-center min-h-[120px] ${customization.cornerEdges === 'Gold' ? 'border-brand-primary bg-brand-tint' : 'border-gray-200 hover:border-gray-300 bg-transparent'}`}
              >
                 <div 
                   className="w-10 h-10 rounded mb-3 relative shadow-sm border border-black/10 bg-center"
                   style={{ 
                     backgroundColor: activeColorHex || 'var(--brand-primary-dark)',
                     backgroundImage: product.images?.[0]?.src ? `url(${product.images[0].src})` : undefined,
                     backgroundSize: product.images?.[0]?.src ? '300%' : undefined
                   }}
                 >
                    <div className="absolute top-[-1px] right-[-1px] w-[65%] h-[65%]">
                      <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="btnGrad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#D4AF37" />
                            <stop offset="15%" stopColor="#FFF4D0" />
                            <stop offset="35%" stopColor="#AA7C11" />
                            <stop offset="65%" stopColor="#F9E596" />
                            <stop offset="100%" stopColor="#8A6311" />
                          </linearGradient>
                          <filter id="btnShadow-gold" x="-20%" y="-20%" width="150%" height="150%">
                            <feDropShadow dx="-1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
                          </filter>
                        </defs>
                        <g filter="url(#btnShadow-gold)">
                          <path d="M 0 0 L 36 0 Q 40 0 40 4 L 40 40 L 34 40 L 34 10 Q 34 6 30 6 L 0 6 Z" fill="url(#btnGrad-gold)" />
                          <path d="M 0 6 L 30 6 Q 34 6 34 10 L 34 40" stroke="rgba(0,0,0,0.6)" strokeWidth="0.75" fill="none" />
                          <path d="M 0 0 L 36 0 Q 40 0 40 4 L 40 40" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" fill="none" />
                          <path d="M 0 1.5 L 35 1.5 Q 38.5 1.5 38.5 5 L 38.5 40" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" fill="none" style={{ filter: 'blur(0.5px)' }} />
                          <path d="M 0 3 L 34 3 Q 37 3 37 6 L 37 40" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" style={{ filter: 'blur(1px)' }} />
                          <path d="M 0 5 L 31 5 Q 35 5 35 9 L 35 40" stroke="rgba(0,0,0,0.3)" strokeWidth="1" fill="none" style={{ filter: 'blur(1px)' }} />
                          <path d="M 12 0 L 12 6 M 14 0 L 14 6" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                          <path d="M 12.5 0 L 12.5 6 M 14.5 0 L 14.5 6" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                          <path d="M 34 26 L 40 26 M 34 28 L 40 28" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                          <path d="M 34 26.5 L 40 26.5 M 34 28.5 L 40 28.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                        </g>
                      </svg>
                    </div>
                 </div>
                 <div className="font-bold text-brand-body">Gold</div>
                 <div className="text-[12px] text-gray-500 mt-1">+£0.24 per unit</div>
              </div>

              {/* Silver Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, cornerEdges: 'Silver' })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-4 flex flex-col items-center justify-center min-h-[120px] ${customization.cornerEdges === 'Silver' ? 'border-brand-primary bg-brand-tint' : 'border-gray-200 hover:border-gray-300 bg-transparent'}`}
              >
                 <div 
                   className="w-10 h-10 rounded mb-3 relative shadow-sm border border-black/10 bg-center"
                   style={{ 
                     backgroundColor: activeColorHex || 'var(--brand-primary-dark)',
                     backgroundImage: product.images?.[0]?.src ? `url(${product.images[0].src})` : undefined,
                     backgroundSize: product.images?.[0]?.src ? '300%' : undefined
                   }}
                 >
                    <div className="absolute top-[-1px] right-[-1px] w-[65%] h-[65%]">
                      <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="btnGrad-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#A0A0A0" />
                            <stop offset="15%" stopColor="#FFFFFF" />
                            <stop offset="35%" stopColor="#707070" />
                            <stop offset="65%" stopColor="#E0E0E0" />
                            <stop offset="100%" stopColor="#505050" />
                          </linearGradient>
                          <filter id="btnShadow-silver" x="-20%" y="-20%" width="150%" height="150%">
                            <feDropShadow dx="-1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
                          </filter>
                        </defs>
                        <g filter="url(#btnShadow-silver)">
                          <path d="M 0 0 L 36 0 Q 40 0 40 4 L 40 40 L 34 40 L 34 10 Q 34 6 30 6 L 0 6 Z" fill="url(#btnGrad-silver)" />
                          <path d="M 0 6 L 30 6 Q 34 6 34 10 L 34 40" stroke="rgba(0,0,0,0.6)" strokeWidth="0.75" fill="none" />
                          <path d="M 0 0 L 36 0 Q 40 0 40 4 L 40 40" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" fill="none" />
                          <path d="M 0 1.5 L 35 1.5 Q 38.5 1.5 38.5 5 L 38.5 40" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" fill="none" style={{ filter: 'blur(0.5px)' }} />
                          <path d="M 0 3 L 34 3 Q 37 3 37 6 L 37 40" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" style={{ filter: 'blur(1px)' }} />
                          <path d="M 0 5 L 31 5 Q 35 5 35 9 L 35 40" stroke="rgba(0,0,0,0.3)" strokeWidth="1" fill="none" style={{ filter: 'blur(1px)' }} />
                          <path d="M 12 0 L 12 6 M 14 0 L 14 6" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                          <path d="M 12.5 0 L 12.5 6 M 14.5 0 L 14.5 6" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                          <path d="M 34 26 L 40 26 M 34 28 L 40 28" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                          <path d="M 34 26.5 L 40 26.5 M 34 28.5 L 40 28.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                        </g>
                      </svg>
                    </div>
                 </div>
                 <div className="font-bold text-brand-body">Silver</div>
                 <div className="text-[12px] text-gray-500 mt-1">+£0.24 per unit</div>
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-3 mt-4">
             <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-100 text-brand-body font-bold rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap text-center"
             >
                &larr; Back to Position
             </button>
             <button
                type="button"
                onClick={async () => {
                  setStep(4);
                  if (onGenerateProof) {
                    setIsGeneratingProof(true);
                    try {
                      const result = await onGenerateProof();
                      if (result) {
                        onCustomizationChange({ ...customization, ...result });
                      }
                    } finally {
                      setIsGeneratingProof(false);
                    }
                  }
                }}
                disabled={isGeneratingProof}
                className="w-full sm:w-auto px-4 sm:px-8 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50 whitespace-nowrap text-center"
             >
                Proceed to Review &rarr;
             </button>
          </div>
        </div>
      )}      {step === 4 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="text-brand-body font-medium">Branding</div>
                  <div className="text-brand-body font-bold">
                     {customization.blockingType}
                     {customization.blockingType === 'Foil blocked' && customization.foilColor ? ' · ' + customization.foilColor : ''}
                  </div>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="text-brand-body font-medium">Position</div>
                  <div className="text-brand-body font-bold">
                     {customization.logoPosition?.label ? 
                        customization.logoPosition.label.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Center'}
                  </div>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="text-brand-body font-medium">Corner edges</div>
                  <div className="text-brand-body font-bold">{customization.cornerEdges}</div>
               </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center p-6 bg-transparent rounded-xl border border-gray-200 min-h-[160px] shadow-sm">
              {isGeneratingProof ? (
                 <div className="flex w-full items-center justify-center gap-4 py-8">
                   <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                   <div className="text-sm font-medium text-gray-600 animate-pulse">Generating your digital proof...</div>
                 </div>
              ) : customization.fullPreviewUrl ? (
                 <>
                   <div className="w-24 h-auto shrink-0 bg-[#f5f5f5] rounded overflow-hidden shadow border border-black/5">
                     <img 
                       src={customization.fullPreviewUrl} 
                       alt="Digital Proof" 
                       className="w-full h-auto" 
                     />
                   </div>
                   <div className="flex-1 text-center sm:text-left">
                     <div className="font-bold text-brand-body mb-1">Digital proof included</div>
                     <p className="text-[13px] text-gray-500 mb-4 max-w-sm">
                       We'll send a final digital proof via email for your approval before production.
                     </p>
                     <button
                       type="button"
                       onClick={async () => {
                         if (!onGenerateProof) return;
                         setIsGeneratingProof(true);
                         try {
                            const { generateDigitalProof } = await import('../utils/generate-pdf');
                            const { calculateProductPrice } = await import('../utils/pricing');
                            const priceDetails = calculateProductPrice({
                                quantity,
                                basePrice,
                                tiers,
                                customizationEnabled: customization.enabled,
                                blockingType: customization.blockingType,
                                isGifts: false,
                                cornerEdges: customization.cornerEdges,
                            });
                            const pdfBuffer = await generateDigitalProof(product, customization, quantity, priceDetails.unitPrice, activeColorName);
                            const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'proof-' + product.slug + '.pdf';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                         } catch (err) {
                            console.error(err);
                            alert("Failed to generate PDF. Please try again.");
                         } finally {
                            setIsGeneratingProof(false);
                         }
                       }}
                       disabled={isGeneratingProof}
                       className="text-brand-primary font-bold text-[14px] hover:underline disabled:opacity-50"
                     >
                       Download proof (PDF) &darr;
                     </button>
                   </div>
                 </>
              ) : (
                 <div className="w-full text-center text-red-500 text-sm font-medium">Failed to generate proof. Please go back and try again.</div>
              )}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
             <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white border border-gray-300 text-brand-body font-bold rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap text-center"
             >
                &larr; Back: Extras
             </button>
             {onAddToCart && (
               <button
                  type="button"
                  onClick={onAddToCart}
                  disabled={isAdding || isGeneratingProof || !customization.fullPreviewUrl}
                  className="w-full flex-1 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50 whitespace-nowrap text-center"
               >
                  {isAdding ? 'Processing...' : (amendKey ? 'Update Basket' : 'Add to Basket')}
               </button>
             )}
          </div>
          
          <button
             type="button"
             onClick={() => window.location.href = '/diaries'}
             className="w-full py-3 bg-white text-brand-primary border border-brand-primary font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
             Continue Shopping
          </button>
        </div>
      )}
    </div>
  );
};
