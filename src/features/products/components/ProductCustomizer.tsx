'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StoreProduct, PriceTier } from '../types/store-product';
import {
  calculateProductPrice,
  CUSTOMIZATION_MIN_QTY,
  formatGBP,
  isFoilBlockedProduct,
  isGiftsProduct,
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
  activeImageUrl?: string;
  onGenerateProof?: () => Promise<Partial<CustomizationState> | null>;
  onAddToCart?: () => void;
  isAdding?: boolean;
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
  activeImageUrl,
  onGenerateProof,
  onAddToCart,
  isAdding,
}: ProductCustomizerProps) => {
  const isGifts = isGiftsProduct(product);
  const isFoil = isFoilBlockedProduct(product);

  const [collapseOpen, setCollapseOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const [priceResult, setPriceResult] = useState(() =>
    calculateProductPrice({
      quantity,
      basePrice,
      tiers,
      customizationEnabled: !isGifts,
      blockingType: isFoil ? 'Foil blocked' : 'Embossed',
      cornerEdges: customization.cornerEdges,
      isGifts,
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
      cornerEdges: customization.cornerEdges,
      isGifts,
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
    <div className="mt-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300" style={{ backgroundColor: '#ffffff' }}>
      {/* STEP TRACKER (Optional visual flair) */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`text-sm font-bold ${step === 1 ? 'text-[#4a346e]' : 'text-gray-400 hidden sm:block'}`}>1. Branding</div>
        <div className="h-px bg-gray-200 flex-1 hidden sm:block" />
        <div className={`text-sm font-bold ${step === 2 ? 'text-[#4a346e]' : 'text-gray-400 hidden sm:block'}`}>2. Position</div>
        <div className="h-px bg-gray-200 flex-1 hidden sm:block" />
        <div className={`text-sm font-bold ${step === 3 ? 'text-[#4a346e]' : 'text-gray-400 hidden sm:block'}`}>3. Extras</div>
        <div className="h-px bg-gray-200 flex-1 hidden sm:block" />
        <div className={`text-sm font-bold ${step === 4 ? 'text-[#4a346e]' : 'text-gray-400 hidden sm:block'}`}>4. Review</div>
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <div className="text-xl font-bold text-[#1F2124] mb-2">Upload Logo</div>
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

                try {
                  const processedUrl = await processLogo(file);
                  onCustomizationChange({
                    ...customization,
                    logoFile: file,
                    logoPreviewUrl: processedUrl,
                  });
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
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="block w-full text-[14px] text-[#1F2124] file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#4a346e]/10 file:text-[#4a346e] hover:file:bg-[#4a346e]/20 cursor-pointer transition-colors border border-gray-200 rounded-lg p-1"
            />
          </div>

          <div>
            <div className="text-xl font-bold text-[#1F2124] mb-4">Choose Branding Type</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Foil Blocked Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, blockingType: 'Foil blocked', foilColor: customization.foilColor || 'Gold' })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-4 ${customization.blockingType === 'Foil blocked' ? 'border-[#4a346e] bg-[#f5f0fa]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
              >
                  <div 
                    className="aspect-[4/3] rounded-lg mb-4 flex items-center justify-center overflow-hidden relative bg-center"
                    style={{ 
                      backgroundColor: activeColorHex || '#f3f4f6',
                      backgroundImage: activeImageUrl ? `url(${activeImageUrl})` : undefined,
                      backgroundSize: activeImageUrl ? '300%' : undefined
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
                 <div className="font-bold text-[#1F2124]">Foil blocked</div>
                 <div className="text-[12px] text-gray-500 mt-1 mb-4 leading-relaxed">Metallic foil stamped into the cover for a premium finish.</div>
                 
                 {customization.blockingType === 'Foil blocked' && (
                    <div className="mt-auto pt-3 border-t border-gray-200/60" onClick={e => e.stopPropagation()}>
                       <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Foil colour</div>
                       <div className="flex gap-3">
                         {['Gold', 'Silver'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => onCustomizationChange({ ...customization, foilColor: color })}
                              title={color}
                              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${customization.foilColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                              style={{ background: color === 'Gold' ? 'linear-gradient(135deg, #F3E5AB, #D4AF37, #AA7C11)' : 'linear-gradient(135deg, #F5F5F5, #C0C0C0, #808080)' }}
                            />
                         ))}
                       </div>
                    </div>
                 )}
              </div>

              {/* Embossed Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, blockingType: 'Embossed', foilColor: undefined })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-4 ${customization.blockingType === 'Embossed' ? 'border-[#4a346e] bg-[#f5f0fa]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
              >
                  <div 
                    className="aspect-[4/3] rounded-lg mb-4 relative overflow-hidden bg-center"
                    style={{ 
                      backgroundColor: activeColorHex || '#e3e0dd',
                      backgroundImage: activeImageUrl ? `url(${activeImageUrl})` : undefined,
                      backgroundSize: activeImageUrl ? '300%' : undefined
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
                 <div className="font-bold text-[#1F2124]">Blind debossed</div>
                 <div className="text-[12px] text-gray-500 mt-1 leading-relaxed">Logo is pressed directly into the material for a subtle effect.</div>
              </div>

              {/* UV Print Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, blockingType: 'UV Print', foilColor: undefined })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-4 ${customization.blockingType === 'UV Print' ? 'border-[#4a346e] bg-[#f5f0fa]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
              >
                  <div 
                    className="aspect-[4/3] rounded-lg mb-4 flex items-center justify-center overflow-hidden bg-center relative"
                    style={{ 
                      backgroundColor: activeColorHex || '#f3f4f6',
                      backgroundImage: activeImageUrl ? `url(${activeImageUrl})` : undefined,
                      backgroundSize: activeImageUrl ? '300%' : undefined
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
                 <div className="font-bold text-[#1F2124]">UV Print</div>
                 <div className="text-[12px] text-gray-500 mt-1 leading-relaxed">Full colour digital printing directly onto the product surface.</div>
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
             <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!customization.logoPreviewUrl}
                className="px-6 py-3 bg-[#1F2124] text-white font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
                Proceed to Position &rarr;
             </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <div className="text-xl font-bold text-[#1F2124] mb-4">Placement</div>
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
                    className={`px-4 py-3 rounded-lg border-2 text-[13px] font-bold transition-all flex flex-col items-center justify-center gap-1 min-w-[100px] flex-1 ${isSelected ? 'border-[#4a346e] bg-[#f5f0fa] text-[#4a346e]' : 'border-gray-200 bg-[#f8f7f5] text-[#1F2124] hover:border-gray-300'}`}
                  >
                    <div className={`relative w-[22px] h-[30px] border-[1.5px] rounded-[3px] mb-1.5 transition-colors ${isSelected ? 'border-[#4a346e] bg-white' : 'border-gray-400 bg-white'}`}>
                      <div className={`absolute w-[4px] h-[4px] rounded-full transition-colors ${isSelected ? 'bg-[#4a346e]' : 'bg-gray-400'} ${
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
            <div className="text-xl font-bold text-[#1F2124] mb-4">Logo Scale</div>
            <div className="flex items-center gap-4 max-w-md bg-gray-50 p-4 rounded-lg border border-gray-100">
              <span className="text-[13px] text-[#1F2124] font-bold w-10">{Math.round(customization.logoScale * 100)}%</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={customization.logoScale}
                onChange={(e) => onCustomizationChange({ ...customization, logoScale: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4a346e]"
              />
              <span className="text-[13px] text-gray-500 font-medium w-10 text-right">200%</span>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-between">
             <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-100 text-[#1F2124] font-bold rounded-lg hover:bg-gray-200 transition-colors"
             >
                &larr; Back to Branding
             </button>
             <button
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3 bg-[#4a346e] text-white font-bold rounded-lg hover:bg-[#3d2a5a] transition-colors"
             >
                Proceed to Extras &rarr;
             </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <div className="text-xl font-bold text-[#1F2124] mb-2 uppercase tracking-wide text-[13px] text-gray-700">Corner Edges</div>
            <div className="grid grid-cols-3 gap-4">
              
              {/* None Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, cornerEdges: 'None' })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-4 flex flex-col items-center justify-center min-h-[120px] ${customization.cornerEdges === 'None' ? 'border-[#4a346e] bg-[#f5f0fa]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
              >
                 <div className="w-10 h-10 rounded mb-3 shadow-sm border border-black/10" style={{ backgroundColor: activeColorHex || '#1F2124' }} />
                 <div className="font-bold text-[#1F2124]">None</div>
                 <div className="text-[12px] text-gray-500 mt-1">Included</div>
              </div>

              {/* Gold Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, cornerEdges: 'Gold' })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-4 flex flex-col items-center justify-center min-h-[120px] ${customization.cornerEdges === 'Gold' ? 'border-[#4a346e] bg-[#f5f0fa]' : 'border-gray-200 hover:border-gray-300 bg-[#fbfaf8]'}`}
              >
                 <div 
                   className="w-10 h-10 rounded mb-3 relative shadow-sm border border-black/10"
                   style={{ backgroundColor: activeColorHex || '#1F2124' }}
                 >
                    <div className="absolute top-[-1px] right-[-1px] w-[50%] h-[50%] drop-shadow-sm">
                      <svg width="100%" height="100%" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="btnGrad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F3E5AB" />
                            <stop offset="50%" stopColor="#D4AF37" />
                            <stop offset="100%" stopColor="#AA7C11" />
                          </linearGradient>
                        </defs>
                        <path d="M 0 0 L 32 0 Q 36 0 36 4 L 36 36 L 28 36 L 28 12 Q 28 8 24 8 L 0 8 Z" fill="url(#btnGrad-gold)" />
                      </svg>
                    </div>
                 </div>
                 <div className="font-bold text-[#1F2124]">Gold</div>
                 <div className="text-[12px] text-gray-500 mt-1">+£0.24 per unit</div>
              </div>

              {/* Silver Card */}
              <div 
                onClick={() => onCustomizationChange({ ...customization, cornerEdges: 'Silver' })}
                className={`cursor-pointer rounded-xl border-2 transition-all p-4 flex flex-col items-center justify-center min-h-[120px] ${customization.cornerEdges === 'Silver' ? 'border-[#4a346e] bg-[#f5f0fa]' : 'border-gray-200 hover:border-gray-300 bg-[#f5f6f8]'}`}
              >
                 <div 
                   className="w-10 h-10 rounded mb-3 relative shadow-sm border border-black/10"
                   style={{ backgroundColor: activeColorHex || '#1F2124' }}
                 >
                    <div className="absolute top-[-1px] right-[-1px] w-[50%] h-[50%] drop-shadow-sm">
                      <svg width="100%" height="100%" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="btnGrad-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F5F5F5" />
                            <stop offset="50%" stopColor="#C0C0C0" />
                            <stop offset="100%" stopColor="#808080" />
                          </linearGradient>
                        </defs>
                        <path d="M 0 0 L 32 0 Q 36 0 36 4 L 36 36 L 28 36 L 28 12 Q 28 8 24 8 L 0 8 Z" fill="url(#btnGrad-silver)" />
                      </svg>
                    </div>
                 </div>
                 <div className="font-bold text-[#1F2124]">Silver</div>
                 <div className="text-[12px] text-gray-500 mt-1">+£0.24 per unit</div>
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-between">
             <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-100 text-[#1F2124] font-bold rounded-lg hover:bg-gray-200 transition-colors"
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
                className="px-8 py-3 bg-[#4a346e] text-white font-bold rounded-lg hover:bg-[#3d2a5a] transition-colors disabled:opacity-50"
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
                  <div className="text-[#1F2124] font-medium">Branding</div>
                  <div className="text-[#1F2124] font-bold">
                     {customization.blockingType}
                     {customization.blockingType === 'Foil blocked' && customization.foilColor ? ' · ' + customization.foilColor : ''}
                  </div>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="text-[#1F2124] font-medium">Position</div>
                  <div className="text-[#1F2124] font-bold">
                     {customization.logoPosition?.label ? 
                        customization.logoPosition.label.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Center'}
                  </div>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="text-[#1F2124] font-medium">Corner edges</div>
                  <div className="text-[#1F2124] font-bold">{customization.cornerEdges}</div>
               </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center p-6 bg-white rounded-xl border border-gray-200 min-h-[160px] shadow-sm">
              {isGeneratingProof ? (
                 <div className="flex w-full items-center justify-center gap-4 py-8">
                   <div className="w-8 h-8 border-4 border-[#4a346e]/30 border-t-[#4a346e] rounded-full animate-spin" />
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
                     <div className="font-bold text-[#1F2124] mb-1">Digital proof included</div>
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
                                customizationEnabled: true,
                                blockingType: customization.blockingType,
                                cornerEdges: customization.cornerEdges,
                                isGifts: false,
                            });
                            const pdfBuffer = await generateDigitalProof(product, customization, quantity, priceDetails.unitPrice);
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
                       className="text-[#4a346e] font-bold text-[14px] hover:underline disabled:opacity-50"
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

          <div className="pt-6 flex justify-between items-center gap-4">
             <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-white border border-gray-300 text-[#1F2124] font-bold rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
             >
                &larr; Back: Extras
             </button>
             {onAddToCart && (
               <button
                  type="button"
                  onClick={onAddToCart}
                  disabled={isAdding || isGeneratingProof || !customization.fullPreviewUrl}
                  className="w-full py-3 bg-[#4a346e] text-white font-bold rounded-lg hover:bg-[#3d2a5a] transition-colors disabled:opacity-50"
               >
                  {isAdding ? 'Processing...' : 'Add to Basket'}
               </button>
             )}
          </div>
          
          <button
             type="button"
             className="w-full py-3 bg-white text-[#4a346e] border border-[#4a346e] font-bold rounded-lg hover:bg-gray-50 transition-colors"
          >
             Continue Shopping
          </button>
        </div>
      )}
    </div>
  );
};
