'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { CartItem } from '@/features/cart/context/CartContext';
import { getImageBoundingBox } from '@/features/products/utils/product-helpers';
import { getConfiguredImageBounds } from '@/features/products/utils/product-image-bounds';

type ImagePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  title?: string;
};

export const ImagePreviewModal = ({ isOpen, onClose, item, title = 'Customization Preview' }: ImagePreviewModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const [imageBounds, setImageBounds] = useState<{ top: number, bottom: number, left: number, right: number } | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);

  // New cart items include an exact, composited snapshot generated on the product
  // page. Prefer it so every customization layer (including corner clips) stays
  // in precisely the same place in the cart preview.
  const fullPreviewUrl = item?.customization?.fullPreviewUrl;

  // Migration for old cart items: cornerEdges might be in attributes instead of customization payload
  const cornerEdges = item?.customization?.cornerEdges || 
    item?.attributes?.find(a => a.name === 'Corner Edges')?.value;
  const hasCornerEdges = Boolean(cornerEdges && cornerEdges !== 'None');
  // Always use the dynamic CSS-based preview for corner edges to guarantee they perfectly
  // match the main product page's logic. Composed canvas corners can sometimes drift.
  const useComposedPreview = Boolean(
    fullPreviewUrl && !hasCornerEdges,
  );

  const isNotebook = Boolean(
    item?.name?.toLowerCase().includes('lewes smoothgrain') || item?.slug?.toLowerCase().includes('lewes-smoothgrain')
  );

  useEffect(() => {
    if (isOpen && item && cornerEdges && cornerEdges !== 'None') {
      if (item.customization?.imageBounds) {
        setImageBounds(item.customization.imageBounds);
      } else {
        const configuredBounds = getConfiguredImageBounds(item.image);
        if (configuredBounds) {
          setImageBounds(configuredBounds);
          return;
        }

        getImageBoundingBox(item.image)
          .then(bounds => setImageBounds(bounds))
          .catch(err => console.error('Failed to get bounds for modal', err));
      }
    } else {
      setImageBounds(null);
    }
  }, [isOpen, item, cornerEdges]);

  useEffect(() => {
    if (isOpen && item?.image && !useComposedPreview) {
      const img = new window.Image();
      img.onload = () => {
        if (img.height > 0) {
          setImageAspectRatio(img.width / img.height);
        }
      };
      img.src = item.image;
    }
  }, [isOpen, item?.image, useComposedPreview]);

  if (!isOpen || !item) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-8 overflow-auto flex items-center justify-center bg-[#f9f9f9]">
          <div 
            className="relative w-full bg-white shadow-sm border border-gray-100 flex items-center justify-center p-4"
            style={{ aspectRatio: useComposedPreview ? 1 : imageAspectRatio }}
          >
            {useComposedPreview ? (
              <img
                src={fullPreviewUrl}
                alt={title}
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                src={item.image}
                alt={title}
                fill
                className="object-contain"
              />
            )}
            {!useComposedPreview && item.customization?.logoPreviewUrl && item.customization?.enabled && (
              <div 
                className="pointer-events-none"
                style={{ 
                  position: 'absolute', 
                  top: `${item.customization.topPercent || 50}%`, 
                  left: `${item.customization.leftPercent || 50}%`,
                  width: `${item.customization.widthPercent || 20}%`,
                  aspectRatio: '1/1',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20
                }}
              >
                {item.customization.choice === 'Foil blocked' ? (
                  <div 
                    className="w-full h-full"
                    style={{
                      maskImage: `url(${item.customization.logoPreviewUrl})`,
                      WebkitMaskImage: `url(${item.customization.logoPreviewUrl})`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                      backgroundImage: item.customization.foilColor === 'Gold' ? 'url(/images/foil/gold.avif)' : 'url(/images/foil/silver.avif)',
                      backgroundSize: 'cover',
                      opacity: 0.95,
                      filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.4))'
                    }}
                  />
                ) : item.customization.choice === 'UV Print' ? (
                  <div 
                    className="w-full h-full pointer-events-none drop-shadow-sm"
                    style={{
                      backgroundImage: `url(${item.customization.logoPreviewUrl})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  />
                ) : (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{
                        maskImage: `url(${item.customization.logoPreviewUrl}), url(${item.customization.logoPreviewUrl})`,
                        WebkitMaskImage: `url(${item.customization.logoPreviewUrl}), url(${item.customization.logoPreviewUrl})`,
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
                    <div
                      className="absolute inset-0"
                      style={{
                        maskImage: `url(${item.customization.logoPreviewUrl}), url(${item.customization.logoPreviewUrl})`,
                        WebkitMaskImage: `url(${item.customization.logoPreviewUrl}), url(${item.customization.logoPreviewUrl})`,
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
            )}

            {!useComposedPreview && imageBounds && hasCornerEdges && (
              <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', zIndex: 15, pointerEvents: 'none' }}>
                {(() => {
                  const offset = isNotebook ? 0 : 0.4;
                  return ([] as Array<{top?: number, bottom?: number, left?: number, right?: number, rotate: string}>).concat([
                    { top: imageBounds.top - offset, right: 100 - imageBounds.right - offset, rotate: 'rotate-0' },
                    { bottom: 100 - imageBounds.bottom - offset, right: 100 - imageBounds.right - offset, rotate: 'rotate-90' },
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
                          <linearGradient id={`modalGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            {cornerEdges === 'Gold' ? (
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
                          
                          <filter id={`modalShadow-${i}`} x="-20%" y="-20%" width="150%" height="150%">
                            <feDropShadow dx="-1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
                          </filter>
                        </defs>
                        
                        <g filter={`url(#modalShadow-${i})`}>
                          <path
                            d={isNotebook ? "M 8 0 L 20 0 Q 40 0 40 20 L 40 32 L 34 32 L 34 20 Q 34 6 20 6 L 8 6 Z" : "M 0 0 L 36 0 Q 40 0 40 4 L 40 40 L 34 40 L 34 10 Q 34 6 30 6 L 0 6 Z"}
                            fill={`url(#modalGrad-${i})`}
                          />
                          <path d={isNotebook ? "M 8 6 L 20 6 Q 34 6 34 20 L 34 32" : "M 0 6 L 30 6 Q 34 6 34 10 L 34 40"} stroke="rgba(0,0,0,0.6)" strokeWidth="0.75" fill="none" />
                          <path d={isNotebook ? "M 8 0 L 20 0 Q 40 0 40 20 L 40 32" : "M 0 0 L 36 0 Q 40 0 40 4 L 40 40"} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" fill="none" />
                          <path d={isNotebook ? "M 8 1.5 L 20 1.5 Q 38.5 1.5 38.5 20 L 38.5 32" : "M 0 1.5 L 35 1.5 Q 38.5 1.5 38.5 5 L 38.5 40"} stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" fill="none" style={{ filter: 'blur(0.5px)' }} />
                          <path d={isNotebook ? "M 8 3 L 20 3 Q 37 3 37 20 L 37 32" : "M 0 3 L 34 3 Q 37 3 37 6 L 37 40"} stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" style={{ filter: 'blur(1px)' }} />
                          <path d={isNotebook ? "M 8 5 L 20 5 Q 35 5 35 20 L 35 32" : "M 0 5 L 31 5 Q 35 5 35 9 L 35 40"} stroke="rgba(0,0,0,0.3)" strokeWidth="1" fill="none" style={{ filter: 'blur(1px)' }} />
                          <path d="M 12 0 L 12 6 M 14 0 L 14 6" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                          <path d="M 12.5 0 L 12.5 6 M 14.5 0 L 14.5 6" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                          <path d="M 34 26 L 40 26 M 34 28 L 40 28" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                          <path d="M 34 26.5 L 40 26.5 M 34 28.5 L 40 28.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                        </g>
                      </svg>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
