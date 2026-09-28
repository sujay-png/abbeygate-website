'use client';
import { useState, useEffect } from 'react';
import { savedBasketItem, savesavedBasket } from '@/features/account/services/saved-baskets';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  items: savedBasketItem[];
};

export function SaveBasketModal({ isOpen, onClose, items }: Props) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dateString = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      setName(`Saved on ${dateString}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the list.');
      return;
    }

    const validItems = items
      .filter(r => r.productId && r.qty > 0)
      .map(item => {
        if (item.customization) {
          // Destructure out logoFile (which is a File object that Next.js struggles to serialize)
          // fullPreviewUrl is now compressed as JPEG, so it's safe to include
          const { logoFile, ...restCustomization } = item.customization;
          return { ...item, customization: restCustomization };
        }
        return item;
      });

    if (validItems.length === 0) {
      toast.error('Please add at least one product with quantity > 0 before saving a list.');
      return;
    }

    setIsSaving(true);
    
    const res = await savesavedBasket(name.trim(), validItems);
    setIsSaving(false);

    if (res.success) {
      toast.success(`Saved Basket "${name}" saved!`);
      setName('');
      onClose();
      router.push('/account/saved-baskets');
      router.refresh(); // Force Next.js to fetch the latest server data
    } else {
      toast.error(res.error || 'Failed to save list.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden transform transition-all">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-brand-primary-dark">Save Saved Basket</h3>
          <p className="text-gray-600 text-sm mt-2">
            Enter a name for your new Saved Basket.
          </p>
        </div>

        <div className="px-6 py-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly Restock"
            className="w-full bg-white border border-gray-300 text-gray-800 text-sm rounded focus:ring-brand-primary focus:border-brand-primary block p-2.5 outline-none transition-colors"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="px-5 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Save List
          </button>
        </div>
      </div>
    </div>
  );
}
