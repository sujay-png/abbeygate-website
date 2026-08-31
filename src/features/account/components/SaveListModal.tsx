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
    } else {
      toast.error(res.error || 'Failed to save list.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1f1a24] text-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-brand-primary/20">
        <div className="p-6 md:p-8">
          <h3 className="text-xl font-semibold mb-2">Save Purchase List</h3>
          <p className="text-[#f1e6da]/70 text-sm mb-6">Enter a name for your new purchase list.</p>
          
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly Restock"
            className="w-full bg-[#2d2535] border border-[#3e3447] focus:border-brand-primary rounded-lg px-4 py-3 text-white outline-none placeholder:text-gray-500 transition-colors"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>
        
        <div className="bg-[#17131a] px-6 py-5 flex items-center justify-end gap-3 border-t border-[#3e3447]">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-[#963a90] hover:to-[#571750] text-white transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50 flex items-center gap-2"
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
