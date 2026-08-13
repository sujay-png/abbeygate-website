'use client';

import { useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import type { StoreProduct } from '../types/store-product';
import { getProductPhysicalDimensionsMm } from '../utils/product-helpers';
import type { CustomizationState } from './ProductCustomizer';

type ProductCustomizationOverlayProps = {
  product: StoreProduct;
  customization: CustomizationState;
  onPositionChange: (position: { x: number; y: number; label: string }) => void;
};

export const ProductCustomizationOverlay = ({
  product,
  customization,
  onPositionChange,
}: ProductCustomizationOverlayProps) => {
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  // Safely track precise visual coordinates
  const logoX = useMotionValue(customization.logoPosition.x);
  const logoY = useMotionValue(customization.logoPosition.y);
  
  // Sync if customization state changes from outside
  useEffect(() => {
    logoX.set(customization.logoPosition.x);
    logoY.set(customization.logoPosition.y);
  }, [customization.logoPosition.x, customization.logoPosition.y, logoX, logoY]);

  // Calculate physical dimensions
  const { width: widthMm, height: heightMm } = getProductPhysicalDimensionsMm(product);
  const marginMm = 20;
  
  // The image container is always a 1:1 square. The book touches the longest edge.
  const maxDimension = Math.max(widthMm, heightMm);
  
  // Calculate how much of the square the book actually occupies
  const visualWidthPercent = (widthMm / maxDimension) * 100;
  const visualHeightPercent = (heightMm / maxDimension) * 100;
  
  // Calculate the empty white space on the sides
  const leftWhiteSpace = (100 - visualWidthPercent) / 2;
  const topWhiteSpace = (100 - visualHeightPercent) / 2;
  
  // Calculate the physical 20mm margin as a percentage of the square
  const marginPercent = (marginMm / maxDimension) * 100;
  
  const safeLeftPercent = leftWhiteSpace + marginPercent;
  const safeRightPercent = leftWhiteSpace + marginPercent;
  const safeTopPercent = topWhiteSpace + marginPercent;
  const safeBottomPercent = topWhiteSpace + marginPercent;

  if (!customization.enabled || !customization.logoPreviewUrl) {
    return null;
  }

  return (
    <>
      {/* Safe Area for Dragging (dynamically calculated 20mm padding) */}
      <div
        ref={constraintsRef}
        className="absolute pointer-events-none"
        style={{
          top: `${safeTopPercent}%`,
          bottom: `${safeBottomPercent}%`,
          left: `${safeLeftPercent}%`,
          right: `${safeRightPercent}%`,
          zIndex: 10,
        }}
      />
    
      {/* Draggable Logo Centering Wrapper */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 20 }}>
        <motion.div
          key={customization.logoScale}
          drag
          dragConstraints={constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={() => {
            let label = 'Center';
            if (constraintsRef.current) {
              const width = constraintsRef.current.offsetWidth;
              const height = constraintsRef.current.offsetHeight;
              const nx = logoX.get() / (width / 2);
              const ny = logoY.get() / (height / 2);

              if (ny < -0.33) {
                label = nx > 0.33 ? 'Top Right' : 'Top Center';
              } else if (ny > 0.33) {
                label = nx > 0.33 ? 'Bottom Right' : 'Bottom Center';
              } else {
                label = 'Center';
              }
            }
            onPositionChange({ 
              x: logoX.get(), 
              y: logoY.get(),
              label
            });
          }}
          style={{
            position: 'absolute',
            top: -(60 * customization.logoScale), // Half of scaled width
            left: -(60 * customization.logoScale), // Half of scaled height
            width: 120 * customization.logoScale, // Base width * scale
            height: 120 * customization.logoScale, // Base height * scale
            x: logoX,
            y: logoY,
            cursor: 'grab',
          }}
          whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
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
    </>
  );
};
