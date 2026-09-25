'use client';

import { useState } from 'react';
import { useCart } from '@/features/cart/context/CartContext';
import toast from 'react-hot-toast';
import { savedBasket } from '@/features/account/services/saved-baskets';

export type BasketOrderRow = {
  id: string;
  basketId: string;
  qty: number;
};

type Props = {
  baskets: savedBasket[];
  initialBasketId?: string;
};

export function BulkOrderForm({ baskets, initialBasketId }: Props) {
  const { addItem } = useCart();
  const [rows, setRows] = useState<BasketOrderRow[]>([
    { id: '1', basketId: initialBasketId || '', qty: 1 },
    { id: '2', basketId: '', qty: 1 },
  ]);

  const getBasketTotal = (basketId: string) => {
    const basket = baskets.find(b => b.id === basketId);
    if (!basket) return 0;
    return basket.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const total = rows.reduce((acc, row) => acc + (getBasketTotal(row.basketId) * (row.qty || 0)), 0);

  const handleAddRow = () => {
    setRows([...rows, { id: Math.random().toString(36).substring(2), basketId: '', qty: 1 }]);
  };

  const handleQtyChange = (id: string, qty: number) => {
    setRows(rows.map(r => r.id === id ? { ...r, qty } : r));
  };

  const handleBasketSelect = (id: string, basketId: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, basketId } : r));
  };

  const handleAddToCart = async () => {
    const validRows = rows.filter(r => r.basketId && r.qty > 0);
    if (validRows.length === 0) {
      toast.error('Please select at least one saved basket with a quantity greater than 0.');
      return;
    }

    try {
      for (const row of validRows) {
        const basket = baskets.find(b => b.id === row.basketId);
        if (basket) {
          for (const item of basket.items) {
            await addItem({
              productId: String(item.productId),
              name: item.productName,
              image: item.image || '',
              price: item.price,
              quantity: item.qty * row.qty,
              customization: item.customization,
              attributes: item.attributes,
              variationId: item.variationId,
              slug: item.slug
            });
          }
        }
      }
      toast.success('Baskets added to cart!');
    } catch (e) {
      toast.error('Failed to add some items to cart.');
    }
  };

  return (
    <div className="text-gray-700 shadow-sm border border-brand-primary/20 rounded-md overflow-hidden">
      <div className="bg-brand-primary-dark text-white px-4 py-3 text-[15px] font-medium">
        Order Saved Baskets
      </div>
      
      <div className="p-4 md:p-6 bg-[#f7f7f7]">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium">
          <div className="flex-1 text-gray-600">Select Basket</div>
          <div className="w-16 text-center text-gray-600">Qty</div>
          <div className="w-24 text-right text-gray-600">Subtotal</div>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex gap-4 items-start">
              <div className="flex-1">
                <select
                  value={row.basketId}
                  onChange={(e) => handleBasketSelect(row.id, e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:border-brand-primary h-11"
                >
                  <option value="">-- Choose a Saved Basket --</option>
                  {baskets.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.items.length} items)
                    </option>
                  ))}
                </select>
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
                £{(getBasketTotal(row.basketId) * (row.qty || 0)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button 
            onClick={handleAddRow}
            className="text-brand-primary border border-brand-primary hover:bg-brand-tint px-4 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors font-medium"
          >
            <span className="text-lg leading-none">+</span> Add another basket
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
            Add Baskets to Cart
          </button>
        </div>
        
        <div className="text-[17px] text-gray-700 w-full md:w-auto text-right">
          Total: <strong className="text-black font-bold text-xl ml-1">£{total.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}
