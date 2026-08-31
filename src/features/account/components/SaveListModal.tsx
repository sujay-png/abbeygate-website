'use client';
import { useState } from 'react';
import { BulkOrderRow } from './BulkOrderForm';
import { savePurchaseList } from '@/features/account/services/purchase-lists';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  rows: BulkOrderRow[];
};

export function SaveListModal({ isOpen, onClose, rows }: Props) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the list.');
      return;
    }

    const validRows = rows.filter(r => r.productId && r.qty > 0);
    if (validRows.length === 0) {
      toast.error('Please add at least one product with quantity > 0 before saving a list.');
      return;
    }

    setIsSaving(true);
    
    const items = validRows.map(r => ({
      productId: r.productId as number,
      productName: r.productName,
      sku: r.sku,
      price: r.price,
      qty: r.qty,
      image: r.image
    }));

    const res = await savePurchaseList(name.trim(), items);
    setIsSaving(false);

    if (res.success) {
      toast.success(`Purchase list "${name}" saved!`);
      setName('');
      onClose();
      router.push('/account/purchase-lists');
      router.refresh(); // Force Next.js to fetch the latest server data
    } else {
      toast.error(res.error || 'Failed to save list.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden transform transition-all">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-brand-primary-dark">Save Purchase List</h3>
          <p className="text-gray-600 text-sm mt-2">
            Enter a name for your new purchase list.
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
