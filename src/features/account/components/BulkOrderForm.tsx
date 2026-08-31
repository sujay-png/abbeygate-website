'use client';

import { useState } from 'react';
import { useCart } from '@/features/cart/context/CartContext';
import { ProductSearchAutocomplete } from './ProductSearchAutocomplete';
import { SaveListModal } from './SaveListModal';
import toast from 'react-hot-toast';

export type BulkOrderRow = {
  id: string;
  productId: number | null;
  productName: string;
  sku: string;
  price: number;
  qty: number;
};

type Props = {
  initialRows?: BulkOrderRow[];
};

export function BulkOrderForm({ initialRows }: Props) {
  const { addItem } = useCart();
  const [rows, setRows] = useState<BulkOrderRow[]>(
    initialRows || [
      { id: '1', productId: null, productName: '', sku: '', price: 0, qty: 0 },
      { id: '2', productId: null, productName: '', sku: '', price: 0, qty: 0 },
      { id: '3', productId: null, productName: '', sku: '', price: 0, qty: 0 },
      { id: '4', productId: null, productName: '', sku: '', price: 0, qty: 0 },
      { id: '5', productId: null, productName: '', sku: '', price: 0, qty: 0 },
    ]
  );
  
  const [searchBy, setSearchBy] = useState<'name' | 'sku'>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const total = rows.reduce((acc, row) => acc + (row.price * (row.qty || 0)), 0);

  const handleAddRow = () => {
    setRows([...rows, { id: Math.random().toString(36).substring(2), productId: null, productName: '', sku: '', price: 0, qty: 0 }]);
  };

  const handleQtyChange = (id: string, qty: number) => {
    setRows(rows.map(r => r.id === id ? { ...r, qty } : r));
  };

  const handleProductSelect = (id: string, product: { id: number, name: string, sku: string, price: string }) => {
    setRows(rows.map(r => r.id === id ? { 
      ...r, 
      productId: product.id, 
      productName: product.name,
      sku: product.sku,
      price: parseFloat(product.price || '0')
    } : r));
  };

  const handleAddToCart = async () => {
    const validRows = rows.filter(r => r.productId && r.qty > 0);
    if (validRows.length === 0) {
      toast.error('Please add at least one product with a quantity greater than 0.');
      return;
    }

    try {
      for (const row of validRows) {
        await addItem({
          productId: String(row.productId),
          name: row.productName,
          image: '', // We don't have the image here, but that's okay for bulk orders
          price: row.price,
          quantity: row.qty
        });
      }
      toast.success('Items added to cart!');
    } catch (e) {
      toast.error('Failed to add some items to cart.');
    }
  };

  return (
    <div className="text-gray-700 shadow-sm border border-brand-primary/20 rounded-md overflow-hidden">
      <div className="bg-brand-primary-dark text-white px-4 py-3 text-[15px] font-medium">
        Bulk Order Form
      </div>
      
      <div className="p-4 md:p-6 bg-[#f7f7f7]">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium">
          <span>Search by</span>
          <select 
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value as 'name' | 'sku')}
            className="border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-brand-primary"
          >
            <option value="name">Product Name</option>
            <option value="sku">SKU</option>
          </select>
          <div className="ml-auto w-16 text-center text-gray-600">Qty</div>
          <div className="w-24 text-right text-gray-600">Subtotal</div>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex gap-4 items-start">
              <div className="flex-1">
                <ProductSearchAutocomplete 
                  searchBy={searchBy}
                  value={row.productName || row.sku}
                  onSelect={(p) => handleProductSelect(row.id, p)}
                />
              </div>
              <div className="w-16 flex-shrink-0">
                <input 
                  type="number"
                  min="0"
                  value={row.qty || ''}
                  onChange={(e) => handleQtyChange(row.id, parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded px-2 py-2 text-center bg-white focus:outline-none focus:border-brand-primary h-11"
                />
              </div>
              <div className="w-24 flex-shrink-0 text-right py-2.5 font-medium text-gray-800">
                £{(row.price * (row.qty || 0)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button 
            onClick={handleAddRow}
            className="text-brand-primary border border-brand-primary hover:bg-brand-tint px-4 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors font-medium"
          >
            <span className="text-lg leading-none">+</span> New line
          </button>
        </div>
      </div>

      <div className="bg-brand-cream/30 px-4 md:px-6 py-5 flex flex-col md:flex-row items-center justify-between border-t border-brand-primary/10 gap-4">
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={handleAddToCart}
            className="bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-2.5 rounded font-medium transition-colors flex items-center gap-2 shadow-sm flex-1 md:flex-none justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add to Cart
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-brand-primary border border-brand-primary hover:bg-brand-tint px-6 py-2.5 rounded font-medium transition-colors flex items-center gap-2 flex-1 md:flex-none justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Save list
          </button>
        </div>
        
        <div className="text-[17px] text-gray-700 w-full md:w-auto text-right">
          Total: <strong className="text-black font-bold text-xl ml-1">£{total.toFixed(2)}</strong>
        </div>
      </div>

      <SaveListModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        rows={rows}
      />
    </div>
  );
}
