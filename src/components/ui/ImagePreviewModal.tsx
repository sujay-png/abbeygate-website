'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { CartItem } from '@/features/cart/context/CartContext';

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={item.image} 
              alt={title}
              className="absolute inset-0 w-full h-full object-contain" 
            />
            {item.customization?.logoPreviewUrl && item.customization?.enabled && (
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
          </div>
        </div>
      </div>
    </div>
  );
};
