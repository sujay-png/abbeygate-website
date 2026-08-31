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
  
  let bookLeft = imageBounds ? imageBounds.left : anchors.bookLeft;
  let bookRight = imageBounds ? imageBounds.right : anchors.bookRight;
  let bookTop = imageBounds ? imageBounds.top : anchors.bookTop;
  let bookBottom = imageBounds ? imageBounds.bottom : anchors.bookBottom;

  // The heavy drop shadow on this specific product image throws off the edge detection,
  // making the book height seem huge and pushing the diaryTopOffset too far down.
  // Because the shadow is so large on the right/bottom, the book is off-center, 
  // so we must hand-calibrate the bounds to strictly cover the book face.
  if (product.name?.toLowerCase().includes('richmond finegrain quarto')) {
    bookLeft = 16.8;
    bookRight = 84.4;
    bookTop = 9.8;
    bookBottom = 90.8;
  }

  const bookWidth = bookRight - bookLeft;
  const bookHeight = bookBottom - bookTop;
  const marginX = bookWidth * 0.08;
  const marginY = bookHeight * 0.05;

  // Determine if product is a diary to avoid overlapping the pre-printed year (e.g. "2027")
  const isDiary = product.categories?.some(c => 
    c.name.toLowerCase().includes('diar') || c.slug.toLowerCase().includes('diar')
  );
  
  // Determine if product is a notebook for rounded corners
  const isNotebook = product.name?.toLowerCase().includes('lewes smoothgrain') || product.slug?.toLowerCase().includes('lewes-smoothgrain');
  
  // Add an extra vertical offset for diaries (e.g. 15% of book height) so the logo sits below the year
  const diaryTopOffset = isDiary ? (bookHeight * 0.15) : 0;

  const safeLeft = bookLeft + marginX;
  const safeRight = bookRight - marginX;
  const safeTop = bookTop + marginY + diaryTopOffset;
  const safeBottom = bookBottom - marginY;

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
  let bgPosition = 'center center';
  
  if (posLabel === 'top-left') { cssLeft = getAlignX('left'); cssTop = getAlignY('top'); transformOrigin = 'top left'; bgPosition = 'left top'; }
  else if (posLabel === 'top-center') { cssLeft = getAlignX('center'); cssTop = getAlignY('top'); transformOrigin = 'top center'; bgPosition = 'center top'; }
  else if (posLabel === 'top-right') { cssLeft = getAlignX('right'); cssTop = getAlignY('top'); transformOrigin = 'top right'; bgPosition = 'right top'; }
  else if (posLabel === 'center-left') { cssLeft = getAlignX('left'); cssTop = getAlignY('center'); transformOrigin = 'center left'; bgPosition = 'left center'; }
  else if (posLabel === 'center') { cssLeft = getAlignX('center'); cssTop = getAlignY('center'); transformOrigin = 'center center'; bgPosition = 'center center'; }
  else if (posLabel === 'center-right') { cssLeft = getAlignX('right'); cssTop = getAlignY('center'); transformOrigin = 'center right'; bgPosition = 'right center'; }
  else if (posLabel === 'bottom-left') { cssLeft = getAlignX('left'); cssTop = getAlignY('bottom'); transformOrigin = 'bottom left'; bgPosition = 'left bottom'; }
  else if (posLabel === 'bottom-center') { cssLeft = getAlignX('center'); cssTop = getAlignY('bottom'); transformOrigin = 'bottom center'; bgPosition = 'center bottom'; }
  else if (posLabel === 'bottom-right') { cssLeft = getAlignX('right'); cssTop = getAlignY('bottom'); transformOrigin = 'bottom right'; bgPosition = 'right bottom'; }

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
                backgroundPosition: bgPosition,
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
                maskPosition: bgPosition,
                WebkitMaskPosition: bgPosition,
                backgroundImage: customization.foilColor === 'Gold' ? 'url(/images/foil/gold.avif)' : 'url(/images/foil/silver.avif)',
                backgroundSize: 'cover',
                opacity: 0.95,
                filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.4))'
              }}
            />
          ) : (
            <>
              {/* Debossed Shadow Edge (Top-Left Inner Edge) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  maskImage: `url(${customization.logoPreviewUrl}), url(${customization.logoPreviewUrl})`,
                  WebkitMaskImage: `url(${customization.logoPreviewUrl}), url(${customization.logoPreviewUrl})`,
                  maskPosition: `${bgPosition}, calc(${posLabel.includes('left') ? '0%' : posLabel.includes('right') ? '100%' : '50%'} + 1.5px) calc(${posLabel.includes('top') ? '0%' : posLabel.includes('bottom') ? '100%' : '50%'} + 1.5px)`,
                  WebkitMaskPosition: `${bgPosition}, calc(${posLabel.includes('left') ? '0%' : posLabel.includes('right') ? '100%' : '50%'} + 1.5px) calc(${posLabel.includes('top') ? '0%' : posLabel.includes('bottom') ? '100%' : '50%'} + 1.5px)`,
                  maskSize: 'contain, contain',
                  WebkitMaskSize: 'contain, contain',
                  maskRepeat: 'no-repeat, no-repeat',
                  WebkitMaskRepeat: 'no-repeat, no-repeat',
                  maskComposite: 'subtract',
                  WebkitMaskComposite: 'source-out',
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  mixBlendMode: 'multiply',
                  filter: 'blur(0.5px)',
                }}
              />
              {/* Debossed Highlight Edge (Bottom-Right Inner Edge) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  maskImage: `url(${customization.logoPreviewUrl}), url(${customization.logoPreviewUrl})`,
                  WebkitMaskImage: `url(${customization.logoPreviewUrl}), url(${customization.logoPreviewUrl})`,
                  maskPosition: `${bgPosition}, calc(${posLabel.includes('left') ? '0%' : posLabel.includes('right') ? '100%' : '50%'} - 1.5px) calc(${posLabel.includes('top') ? '0%' : posLabel.includes('bottom') ? '100%' : '50%'} - 1.5px)`,
                  WebkitMaskPosition: `${bgPosition}, calc(${posLabel.includes('left') ? '0%' : posLabel.includes('right') ? '100%' : '50%'} - 1.5px) calc(${posLabel.includes('top') ? '0%' : posLabel.includes('bottom') ? '100%' : '50%'} - 1.5px)`,
                  maskSize: 'contain, contain',
                  WebkitMaskSize: 'contain, contain',
                  maskRepeat: 'no-repeat, no-repeat',
                  WebkitMaskRepeat: 'no-repeat, no-repeat',
                  maskComposite: 'subtract',
                  WebkitMaskComposite: 'source-out',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  mixBlendMode: 'screen',
                  filter: 'blur(0.5px)',
                }}
              />
              {/* Debossed Base Fill (slight darkening of the pressed area) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  maskImage: `url(${customization.logoPreviewUrl})`,
                  WebkitMaskImage: `url(${customization.logoPreviewUrl})`,
                  maskPosition: bgPosition,
                  WebkitMaskPosition: bgPosition,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  mixBlendMode: 'multiply',
                }}
              />
            </>
          )}
        </div>
      </div>

      {customization.cornerEdges !== 'None' && customization.cornerEdges && (
        <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', zIndex: 15, pointerEvents: 'none' }}>
          {(() => {
            // For notebooks, we don't want to push it outward because the corner recedes
            const offset = isNotebook ? 0 : 0.2;
            return ([] as Array<{top?: number, bottom?: number, left?: number, right?: number, rotate: string}>).concat([
              { top: bookTop - offset, right: 100 - bookRight - offset, rotate: 'rotate-0' }, // top-right
              { bottom: 100 - bookBottom - offset, right: 100 - bookRight - offset, rotate: 'rotate-90' }, // bottom-right
            ]).map((pos, i) => (
            <div
              key={i}
              className={`absolute w-[8%] h-[8%] ${pos.rotate}`}
              style={{
                top: pos.top !== undefined ? `${pos.top}%` : undefined,
                bottom: pos.bottom !== undefined ? `${pos.bottom}%` : undefined,
                left: pos.left !== undefined ? `${pos.left}%` : undefined,
                right: pos.right !== undefined ? `${pos.right}%` : undefined,
                transformOrigin: 'center center',
                zIndex: 25,
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                <defs>
                  {/* Base Metallic Gradient */}
                  <linearGradient id={`metalBase-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    {customization.cornerEdges === 'Gold' ? (
                      <>
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="15%" stopColor="#FFF4D0" />
                        <stop offset="35%" stopColor="#AA7C11" />
                        <stop offset="65%" stopColor="#F9E596" />
                        <stop offset="100%" stopColor="#8A6311" />
                      </>
                    ) : (
                      <>
                        <stop offset="0%" stopColor="#A0A0A0" />
                        <stop offset="15%" stopColor="#FFFFFF" />
                        <stop offset="35%" stopColor="#707070" />
                        <stop offset="65%" stopColor="#E0E0E0" />
                        <stop offset="100%" stopColor="#505050" />
                      </>
                    )}
                  </linearGradient>
                  
                  {/* Drop Shadow filter */}
                  <filter id={`shadow-${i}`} x="-20%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="-1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
                  </filter>
                </defs>
                
                <g filter={`url(#shadow-${i})`}>
                  {/* Main Body (Thinner) */}
                  <path
                    d={isNotebook ? "M 8 0 L 20 0 Q 40 0 40 20 L 40 32 L 34 32 L 34 20 Q 34 6 20 6 L 8 6 Z" : "M 0 0 L 36 0 Q 40 0 40 4 L 40 40 L 34 40 L 34 10 Q 34 6 30 6 L 0 6 Z"}
                    fill={`url(#metalBase-${i})`}
                  />
                  
                  {/* Dark inner shadow line (contacts the book) */}
                  <path
                    d={isNotebook ? "M 8 6 L 20 6 Q 34 6 34 20 L 34 32" : "M 0 6 L 30 6 Q 34 6 34 10 L 34 40"}
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth="0.75"
                    fill="none"
                  />
                  
                  {/* Dark outer edge line */}
                  <path
                    d={isNotebook ? "M 8 0 L 20 0 Q 40 0 40 20 L 40 32" : "M 0 0 L 36 0 Q 40 0 40 4 L 40 40"}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="0.5"
                    fill="none"
                  />
                  
                  {/* Primary bright highlight running along the ridge of the metal tube */}
                  <path
                    d={isNotebook ? "M 8 1.5 L 20 1.5 Q 38.5 1.5 38.5 20 L 38.5 32" : "M 0 1.5 L 35 1.5 Q 38.5 1.5 38.5 5 L 38.5 40"}
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="1.2"
                    fill="none"
                    style={{ filter: 'blur(0.5px)' }}
                  />
                  
                  {/* Secondary soft highlight */}
                  <path
                    d={isNotebook ? "M 8 3 L 20 3 Q 37 3 37 20 L 37 32" : "M 0 3 L 34 3 Q 37 3 37 6 L 37 40"}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                    fill="none"
                    style={{ filter: 'blur(1px)' }}
                  />
                  
                  {/* Dark shadow inner rim */}
                  <path
                    d={isNotebook ? "M 8 5 L 20 5 Q 35 5 35 20 L 35 32" : "M 0 5 L 31 5 Q 35 5 35 9 L 35 40"}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="1"
                    fill="none"
                    style={{ filter: 'blur(1px)' }}
                  />

                  {/* Crimps / Indentations (Top Arm) */}
                  <path d="M 12 0 L 12 6" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                  <path d="M 12.5 0 L 12.5 6" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                  
                  <path d="M 14 0 L 14 6" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                  <path d="M 14.5 0 L 14.5 6" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                  
                  {/* Crimps / Indentations (Right Arm) */}
                  <path d="M 34 26 L 40 26" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                  <path d="M 34 26.5 L 40 26.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                  
                  <path d="M 34 28 L 40 28" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                  <path d="M 34 28.5 L 40 28.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                </g>
              </svg>
            </div>
          ))})()}
        </div>
      )}
    </>
  );
};
