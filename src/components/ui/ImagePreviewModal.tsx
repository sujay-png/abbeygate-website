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
  // New cart items include an exact, composited snapshot generated on the product
  // page. Prefer it so every customization layer (including corner clips) stays
  // in precisely the same place in the cart preview.
  const fullPreviewUrl = item?.customization?.fullPreviewUrl;

  // Migration for old cart items: cornerEdges might be in attributes instead of customization payload
  const cornerEdges = item?.customization?.cornerEdges || 
    item?.attributes?.find(a => a.name === 'Corner Edges')?.value;
  const hasCornerEdges = Boolean(cornerEdges && cornerEdges !== 'None');
  // A composed preview with corner edges is only reliable when the bounds were
  // saved alongside it. Older snapshots were generated before that was possible.
  const useComposedPreview = Boolean(
    fullPreviewUrl && (!hasCornerEdges || item?.customization?.imageBounds),
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
          <div className="relative w-full aspect-square bg-white shadow-sm border border-gray-100 flex items-center justify-center p-4">
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
                  const offset = 0.4;
                  return ([] as Array<{top?: number, bottom?: number, left?: number, right?: number, rotate: string}>).concat([
                    { top: imageBounds.top - offset, right: 100 - imageBounds.right - offset, rotate: 'rotate-0' },
                    { bottom: 100 - imageBounds.bottom - offset, right: 100 - imageBounds.right - offset, rotate: 'rotate-90' },
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
                          <linearGradient id={`modalGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            {cornerEdges === 'Gold' ? (
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
                          fill={`url(#modalGrad-${i})`}
                        />
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
