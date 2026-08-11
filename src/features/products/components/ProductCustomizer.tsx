'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { StoreProduct, PriceTier } from '../types/store-product';
import {
  calculateProductPrice,
  CUSTOMIZATION_MIN_QTY,
  formatGBP,
  isFoilBlockedProduct,
  isGiftsProduct,
} from '../utils/pricing';

export type CustomizationState = {
  enabled: boolean;
  blockingType: string;
  logoFile?: File;
  logoPreviewUrl?: string;
  position: string;
};

type ProductCustomizerProps = {
  product: StoreProduct;
  tiers: PriceTier[];
  basePrice: number;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onCustomizationChange: (state: CustomizationState) => void;
  onPriceChange: (unitPrice: number, totalPrice: number) => void;
};

const LOGO_POSITIONS = [
  { value: 'top-center', label: 'Top Center' },
  { value: 'center', label: 'Center' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

export const ProductCustomizer = ({
  product,
  tiers,
  basePrice,
  quantity,
  onQuantityChange,
  onCustomizationChange,
  onPriceChange,
}: ProductCustomizerProps) => {
  const isGifts = isGiftsProduct(product);
  const isFoil = isFoilBlockedProduct(product);
  const productImage = product.images[0]?.thumbnail || product.images[0]?.src || '';

  const [customization, setCustomization] = useState<CustomizationState>({
    enabled: !isGifts,
    blockingType: isFoil ? 'Foil blocked' : 'Embossed',
    position: 'top-center',
  });
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

  const syncToParent = useEffectEvent(
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

  const handleCustomizationToggle = (enabled: boolean) => {
    setCustomization((prev) => ({ ...prev, enabled }));
  };

  const handleBlockingTypeChange = (type: string) => {
    setCustomization((prev) => ({ ...prev, blockingType: type }));
  };

  const handlePositionChange = (position: string) => {
    setCustomization((prev) => ({ ...prev, position }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomization((prev) => ({
        ...prev,
        logoFile: file,
        logoPreviewUrl: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const showCustomization = !isGifts && quantity >= CUSTOMIZATION_MIN_QTY;

  return (
    <div className="abbey-pdp max-w-[520px]">
      <div className="bg-white p-5 my-5 rounded-2xl shadow-[0_3px_18px_rgba(0,0,0,0.08)]">
        <div className="text-[26px] font-bold">
          {formatGBP(priceResult.unitPrice)}
          <br />
          <small className="text-sm text-gray-500 font-normal">(Price Per Unit)</small>
        </div>
        <p className="text-base font-semibold mt-2" style={{ color: priceResult.statusColor }}>
          {priceResult.statusText}
        </p>
      </div>

      {showCustomization && (
        <div id="abbey-customisation-container">
          <div className="bg-white p-5 my-5 rounded-2xl shadow-[0_3px_18px_rgba(0,0,0,0.08)]">
            <label className="flex items-center gap-2.5 font-bold text-[15px] mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={customization.enabled}
                onChange={(e) => handleCustomizationToggle(e.target.checked)}
              />
              Customise this product (Logo upload required)
            </label>

            {customization.enabled && (
              <div>
                <button
                  type="button"
                  onClick={() => setCollapseOpen(!collapseOpen)}
                  className="w-full text-[17px] font-bold cursor-pointer flex justify-between py-2.5"
                >
                  Custom Logo Options
                  <span>{collapseOpen ? '▲' : '▼'}</span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    collapseOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <label className="block text-sm font-semibold mt-3 mb-1">Blocking Type</label>
                  <select
                    value={customization.blockingType}
                    onChange={(e) => handleBlockingTypeChange(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-[15px] mb-5"
                  >
                    <option value="Foil blocked">Foil blocked</option>
                    <option value="Embossed">Embossed</option>
                  </select>

                  <label className="block text-sm font-semibold mb-1">Upload Logo</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm mb-5"
                  />

                  <label className="block text-sm font-semibold mb-1">Logo Position</label>
                  <select
                    value={customization.position}
                    onChange={(e) => handlePositionChange(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-[15px]"
                  >
                    {LOGO_POSITIONS.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="relative w-full max-w-[400px] h-[400px] mt-7 overflow-hidden bg-gray-50 mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productImage} alt={product.name} className="w-full h-full object-contain" />
            {customization.logoPreviewUrl && customization.enabled && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customization.logoPreviewUrl}
                alt="Logo preview"
                className={`absolute max-w-[100px] max-h-[100px] object-contain z-10 pointer-events-none abbey-${customization.position}`}
                style={getLogoPositionStyle(customization.position)}
              />
            )}
          </div>
        </div>
      )}

      <div className="bg-white p-5 my-5 rounded-2xl shadow-[0_3px_18px_rgba(0,0,0,0.08)]">
        <div className="bg-gray-50 rounded-xl p-4 text-[22px] font-bold">
          Total: {formatGBP(priceResult.totalPrice)}
        </div>
        <p className="text-base font-semibold mt-2" style={{ color: priceResult.statusColor }}>
          {priceResult.statusText}
        </p>
        {priceResult.discountRate > 0 && (
          <div className="mt-3 bg-gradient-to-br from-[#e6f7df] to-[#d4f2c6] px-4 py-2.5 rounded-full font-bold text-[#1c6d14] text-sm inline-block">
            {priceResult.discountLabel}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-6">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (val >= 1) onQuantityChange(val);
          }}
          className="w-20 h-[50px] text-lg border rounded-lg text-center"
        />
      </div>
    </div>
  );
};

function getLogoPositionStyle(position: string): React.CSSProperties {
  switch (position) {
    case 'top-center':
      return { top: '25%', left: '50%', transform: 'translateX(-50%)' };
    case 'center':
      return { top: '55%', left: '50%', transform: 'translate(-50%, -50%)' };
    case 'bottom-center':
      return { bottom: '20%', left: '50%', transform: 'translateX(-50%)' };
    case 'top-right':
      return { top: '25%', right: '25%' };
    case 'bottom-right':
      return { bottom: '20%', right: '25%' };
    default:
      return {};
  }
}
