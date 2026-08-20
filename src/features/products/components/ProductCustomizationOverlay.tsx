'use client';

import type { StoreProduct } from '../types/store-product';
import { getLogoAnchors } from '../utils/product-helpers';
import type { CustomizationState } from './ProductCustomizer';

type ProductCustomizationOverlayProps = {
  product: StoreProduct;
  customization: CustomizationState;
  onPositionChange: (position: { x: number; y: number }) => void;
  imageBounds?: { top: number, bottom: number, left: number, right: number } | null;
};

export const ProductCustomizationOverlay = ({
  product,
  customization,
  onPositionChange,
  imageBounds,
}: ProductCustomizationOverlayProps) => {
  // Dragging logic removed by user request

  const anchors = getLogoAnchors(product);
  
  const safeLeft = anchors.safeLeft;
  const safeRight = anchors.safeRight;
  const safeTop = anchors.safeTop;
  const safeBottom = anchors.safeBottom;
  
  const bookLeft = imageBounds ? imageBounds.left : anchors.bookLeft;
  const bookRight = imageBounds ? imageBounds.right : anchors.bookRight;
  const bookTop = imageBounds ? imageBounds.top : anchors.bookTop;
  const bookBottom = imageBounds ? imageBounds.bottom : anchors.bookBottom;

  const getAlignX = (align: 'left' | 'center' | 'right') => {
    if (align === 'left') return safeLeft;
    if (align === 'right') return safeRight - 25; // 25 is widthPercent
    return 50 - 12.5;                                                      
  };

  const getAlignY = (align: 'top' | 'center' | 'bottom') => {
    if (align === 'top') return safeTop;
    if (align === 'bottom') return safeBottom - 25; // 25 is heightPercent
    return 50 - 12.5;
  };

  const posLabel = customization.logoPosition?.label || 'center';
  let cssLeft = getAlignX('center');
  let cssTop = getAlignY('center');

  let transformOrigin = 'center center';
  
  if (posLabel === 'top-left') { cssLeft = getAlignX('left'); cssTop = getAlignY('top'); transformOrigin = 'top left'; }
  else if (posLabel === 'top-center') { cssLeft = getAlignX('center'); cssTop = getAlignY('top'); transformOrigin = 'top center'; }
  else if (posLabel === 'top-right') { cssLeft = getAlignX('right'); cssTop = getAlignY('top'); transformOrigin = 'top right'; }
  else if (posLabel === 'center-left') { cssLeft = getAlignX('left'); cssTop = getAlignY('center'); transformOrigin = 'center left'; }
  else if (posLabel === 'center') { cssLeft = getAlignX('center'); cssTop = getAlignY('center'); transformOrigin = 'center center'; }
  else if (posLabel === 'center-right') { cssLeft = getAlignX('right'); cssTop = getAlignY('center'); transformOrigin = 'center right'; }
  else if (posLabel === 'bottom-left') { cssLeft = getAlignX('left'); cssTop = getAlignY('bottom'); transformOrigin = 'bottom left'; }
  else if (posLabel === 'bottom-center') { cssLeft = getAlignX('center'); cssTop = getAlignY('bottom'); transformOrigin = 'bottom center'; }
  else if (posLabel === 'bottom-right') { cssLeft = getAlignX('right'); cssTop = getAlignY('bottom'); transformOrigin = 'bottom right'; }

  if (!customization.enabled || !customization.logoPreviewUrl) {
    return null;
  }

  return (
    <>
      {/* Non-draggable Logo Centering Wrapper */}
      <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', zIndex: 20 }}>
        <div
          style={{
            position: 'absolute',
            width: '25%', height: '25%', 
            top: `${cssTop}%`, 
            left: `${cssLeft}%`,
            transform: `scale(${customization.logoScale})`,
            transformOrigin,
            pointerEvents: 'none'
          }}
        >
          {customization.blockingType === 'UV Print' ? (
            <div 
              className="w-full h-full pointer-events-none drop-shadow-sm"
              style={{
                backgroundImage: `url(${customization.logoPreviewUrl})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            />
          ) : customization.blockingType === 'Foil blocked' ? (
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
        </div>
      </div>

      {customization.cornerEdges !== 'None' && customization.cornerEdges && (
        <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', zIndex: 15, pointerEvents: 'none' }}>
          {(() => {
            // Shift brackets slightly outward by 0.4% so they "wrap around" the physical rounded corners
            const offset = 0.4;
            return ([] as Array<{top?: number, bottom?: number, left?: number, right?: number, rotate: string}>).concat([
              { top: bookTop - offset, right: 100 - bookRight - offset, rotate: 'rotate-0' }, // top-right
              { bottom: 100 - bookBottom - offset, right: 100 - bookRight - offset, rotate: 'rotate-90' }, // bottom-right
            ]).map((pos, i) => (
            <div
              key={i}
              className={`absolute w-[6%] h-[6%] drop-shadow-md ${pos.rotate}`}
              style={{
                top: pos.top !== undefined ? `${pos.top}%` : undefined,
                bottom: pos.bottom !== undefined ? `${pos.bottom}%` : undefined,
                left: pos.left !== undefined ? `${pos.left}%` : undefined,
                right: pos.right !== undefined ? `${pos.right}%` : undefined,
                transformOrigin: 'center center',
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id={`cornerGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    {customization.cornerEdges === 'Gold' ? (
                      <>
                        <stop offset="0%" stopColor="#F3E5AB" />
                        <stop offset="50%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#AA7C11" />
                      </>
                    ) : (
                      <>
                        <stop offset="0%" stopColor="#F5F5F5" />
                        <stop offset="50%" stopColor="#C0C0C0" />
                        <stop offset="100%" stopColor="#808080" />
                      </>
                    )}
                  </linearGradient>
                </defs>
                <path
                  d="M 0 0 L 32 0 Q 36 0 36 4 L 36 36 L 28 36 L 28 12 Q 28 8 24 8 L 0 8 Z"
                  fill={`url(#cornerGrad-${i})`}
                />
              </svg>
            </div>
          ))})()}
        </div>
      )}
    </>
  );
};
