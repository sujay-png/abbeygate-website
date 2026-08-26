'use client';

import { useCart, type CartItem } from '../context/CartContext';
import { addColourVariant } from '../utils/add-colour-variant';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

type ColourPickerRowProps = {
  item: CartItem;
  onPick: () => void;
};

export const ColourPickerRow = ({ item, onPick }: ColourPickerRowProps) => {
  const { items, insertItemAfter, updateItem } = useCart();
  const [addingSlug, setAddingSlug] = useState<string | null>(null);

  if (!item.customization?.enabled || !item.colourOptions || item.colourOptions.length <= 1) {
    return null;
  }

  const groupMembers = items.filter(i => i.colourGroupId === (item.colourGroupId ?? item.key));
  const usedSlugs = new Set(groupMembers.map(i => i.slug).filter(Boolean));

  const availableColours = item.colourOptions.filter(c => !usedSlugs.has(c.slug));

  const handleHover = (imageSrc?: string) => {
    if (!imageSrc) return;
    try {
      const img1 = new window.Image();
      img1.src = `/_next/image?url=${encodeURIComponent(imageSrc)}&w=828&q=75`;
      const img2 = new window.Image();
      img2.src = `/_next/image?url=${encodeURIComponent(imageSrc)}&w=1080&q=75`;
    } catch (e) {
      // ignore
    }
  };

  const handlePick = async (option: typeof item.colourOptions[0]) => {
    if (addingSlug) return;
    setAddingSlug(option.slug);
    try {
      await addColourVariant(item, option, { insertItemAfter, updateItem }, onPick);
    } finally {
      if (document.body) { // arbitrary check, but since onPick unmounts us usually, we might not need to reset
        setAddingSlug(null);
      }
    }
  };

  return (
    <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
      {availableColours.length === 0 ? (
        <div className="text-[13px] text-gray-600">
          All colours in this range are already in your basket.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {availableColours.map((color) => (
              <button
                key={color.slug}
                type="button"
                title={color.name}
                disabled={!!addingSlug}
                onMouseEnter={() => handleHover(color.imageSrc)}
                onClick={() => handlePick(color)}
                className={`w-7 h-7 rounded-full shadow-sm transition-transform hover:scale-110 border border-gray-300 flex items-center justify-center ${addingSlug === color.slug ? 'opacity-50 cursor-wait' : ''}`}
                style={{ backgroundColor: color.hex }}
              >
                {addingSlug === color.slug && <Loader2 className="w-3 h-3 animate-spin text-gray-800 drop-shadow-sm" />}
              </button>
            ))}
          </div>
          <div className="text-[13px] text-gray-500 font-medium">
            Same branding & set-up — no additional set-up fee.
          </div>
        </>
      )}
    </div>
  );
};
