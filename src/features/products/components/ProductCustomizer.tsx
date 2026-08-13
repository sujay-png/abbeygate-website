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
  customization: CustomizationState;
  onQuantityChange: (qty: number) => void;
  onCustomizationChange: (state: CustomizationState) => void;
  onPriceChange: (result: ReturnType<typeof calculateProductPrice>) => void;
};

export const ProductCustomizer = ({
  product,
  tiers,
  basePrice,
  quantity,
  customization,
  onCustomizationChange,
  onPriceChange,
}: ProductCustomizerProps) => {
  const isGifts = isGiftsProduct(product);
  const isFoil = isFoilBlockedProduct(product);

  const [collapseOpen, setCollapseOpen] = useState(true);

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
    });

    setPriceResult(result);
    syncToParent(result);
  }, [quantity, customization.enabled, customization.blockingType, basePrice, tiers, isGifts, syncToParent]);

  const showCustomization = !isGifts && quantity >= CUSTOMIZATION_MIN_QTY;

  if (!showCustomization) {
    return null;
  }

  const isFoilSelected = customization.blockingType === 'Foil blocked';

  return (
    <div className="mt-4 mb-6" style={{ backgroundColor: '#ffffff' }}>
      <label
        className="flex items-center gap-2 font-semibold text-[15px] mb-4 cursor-pointer text-[#1F2124]"
      >
        <input
          type="checkbox"
          checked={customization.enabled}
          onChange={(e) =>
            onCustomizationChange({ ...customization, enabled: e.target.checked })
          }
          className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
        />
        Customise this product (Logo upload required)
      </label>

      {customization.enabled && (
        <div className="pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setCollapseOpen(!collapseOpen)}
            className="w-full flex justify-between items-center py-2 text-[16px] font-bold text-[#1F2124] hover:opacity-80 transition-opacity"
          >
            Custom Logo Options
            <span className="text-sm font-normal text-gray-500">{collapseOpen ? 'Hide' : 'Show'}</span>
          </button>

          {collapseOpen && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-4 space-y-5">
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#1F2124]">Blocking Type</label>
                <select
                  value={customization.blockingType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    onCustomizationChange({
                      ...customization,
                      blockingType: newType,
                      foilColor: newType === 'Foil blocked' ? 'Silver' : undefined,
                    });
                  }}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-[14px] bg-white text-[#1F2124] focus:ring-1 focus:ring-black focus:border-black"
                >
                  <option value="Foil blocked">Foil blocked</option>
                  <option value="Embossed">Embossed</option>
                </select>
              </div>

              {isFoilSelected && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#1F2124]">Foil Colour</label>
                  <div className="flex gap-3">
                    {['Silver', 'Gold'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onCustomizationChange({ ...customization, foilColor: color })}
                        className={`px-5 py-2 rounded-lg border font-medium text-[14px] transition-all ${
                          customization.foilColor === color 
                            ? 'border-black bg-gray-50 text-black' 
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1 text-[#1F2124]">Upload Logo</label>
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
                  className="block w-full text-[14px] text-[#1F2124] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
              </div>
              
              {customization.logoPreviewUrl && (
                <div className="pt-2">
                  <label className="block text-sm font-semibold mb-2 text-[#1F2124]">Logo Scale</label>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] text-[#1F2124] font-bold w-8">{Math.round(customization.logoScale * 100)}%</span>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2" 
                      step="0.1" 
                      value={customization.logoScale}
                      onChange={(e) => onCustomizationChange({ ...customization, logoScale: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                    <span className="text-[13px] text-gray-500 font-medium w-8 text-right">200%</span>
                  </div>
                  <p className="text-[13px] text-gray-500 italic mt-3">
                    Drag and position the logo directly on the main product image. It will remain within the safe printing area.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
