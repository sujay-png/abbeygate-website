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
  onCustomizationChange,
  onPriceChange,
}: ProductCustomizerProps) => {
  const isGifts = isGiftsProduct(product);
  const isFoil = isFoilBlockedProduct(product);
  const productImage = product.images[0]?.src || product.images[0]?.thumbnail || '';

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

  const showCustomization = !isGifts && quantity >= CUSTOMIZATION_MIN_QTY;

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: 22,
    margin: '22px 0',
    borderRadius: 14,
    boxShadow: '0 3px 18px rgba(0,0,0,0.08)',
  };

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
                  <div>
                    <label style={labelStyle}>Blocking Type</label>
                    <select
                      value={customization.blockingType}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          blockingType: e.target.value,
                        }))
                      }
                      style={selectStyle}
                    >
                      <option value="Foil blocked">Foil blocked</option>
                      <option value="Embossed">Embossed</option>
                    </select>

                    <label style={labelStyle}>Upload Logo</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
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
                      }}
                      style={{ fontSize: 14, display: 'block', marginBottom: 22, color: '#1F2124' }}
                    />

                    <label style={labelStyle}>Logo Position</label>
                    <select
                      value={customization.position}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                      style={{ ...selectStyle, marginBottom: 0 }}
                    >
                      {LOGO_POSITIONS.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {customization.enabled && customization.logoPreviewUrl && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 400,
                height: 400,
                marginTop: 28,
                overflow: 'hidden',
                backgroundColor: '#f9f9f9',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={productImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={customization.logoPreviewUrl}
                alt="Logo preview"
                style={{
                  position: 'absolute',
                  maxWidth: 100,
                  maxHeight: 100,
                  objectFit: 'contain',
                  zIndex: 10,
                  pointerEvents: 'none',
                  ...getLogoPositionStyle(customization.position),
                }}
              />
            </div>
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
