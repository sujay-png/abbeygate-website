'use client';

import { useState } from 'react';
import { useCart } from '@/features/cart/context/CartContext';
import { savedBasket } from '@/features/account/services/saved-baskets';
import { formatGBP } from '@/features/products/utils/pricing';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function SavedBasketDetailClient({ basket }: { basket: savedBasket }) {
  const [isAdding, setIsAdding] = useState(false);
  const { addItem, openCart } = useCart();
  const router = useRouter();

  const handleAddToCart = async () => {
    if (basket.items.length === 0) return;
    
    setIsAdding(true);
    try {
      for (const item of basket.items) {
        // Need to fetch full product details to properly re-add, but we can do a best-effort 
        // hydration based on what's saved in the basket.
        await addItem({
          productId: String(item.productId),
          sku: item.sku,
          slug: item.slug || '',
          variationId: item.variationId,
          name: item.productName,
          image: item.image || '',
          price: item.price,
          quantity: item.qty,
          attributes: item.attributes || [],
          customization: item.customization || undefined,
        });
      }
      
      toast.success(`${basket.items.length} items added to your basket`);
      openCart();
      router.push('/cart');
    } catch (error) {
      console.error('Failed to add saved basket to cart:', error);
      toast.error('Failed to add some items to your basket');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-x-auto border border-gray-200 rounded-sm">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-brand-primary-dark text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium text-center">Quantity</th>
              <th className="px-4 py-3 font-medium text-right">Unit Price</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {basket.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  This basket is empty.
                </td>
              </tr>
            ) : (
              basket.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      {(item.customization?.fullPreviewUrl || item.image) && (
                        <div className="w-12 h-12 relative flex-shrink-0 bg-gray-50 rounded border border-gray-100">
                          <img src={item.customization?.fullPreviewUrl || item.image} alt={item.productName} className="absolute inset-0 w-full h-full object-contain p-1 mix-blend-multiply" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-brand-primary-dark">{item.productName}</div>
                        <div className="text-xs text-gray-500 mt-1">SKU: {item.sku}</div>
                        
                        {item.customization && item.customization.enabled && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs bg-brand-cream text-brand-primary-dark px-2 py-1 rounded-full w-fit border border-brand-accent/20">
                            <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                            Customised ({item.customization.choice})
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">{item.qty}</td>
                  <td className="px-4 py-4 text-right">{formatGBP(item.price)}</td>
                  <td className="px-4 py-4 text-right font-medium text-brand-body">{formatGBP(item.price * item.qty)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50 font-medium text-brand-primary-dark">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right">Basket Total (ex VAT)</td>
              <td className="px-4 py-3 text-right">
                {formatGBP(basket.items.reduce((total, item) => total + (item.price * item.qty), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleAddToCart}
          disabled={isAdding || basket.items.length === 0}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white px-8 py-3 rounded-md font-bold transition-colors disabled:opacity-50"
        >
          <ShoppingCart size={18} />
          {isAdding ? 'Adding to Cart...' : 'Add entire basket to Cart'}
        </button>
      </div>
    </div>
  );
}
