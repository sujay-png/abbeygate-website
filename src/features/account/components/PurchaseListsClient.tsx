'use client';
import { PurchaseList, deletePurchaseList } from '@/features/account/services/purchase-lists';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useCart } from '@/features/cart/context/CartContext';

export function PurchaseListsClient({ initialLists }: { initialLists: PurchaseList[] }) {
  const [lists, setLists] = useState(initialLists);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const { addItem, openCart } = useCart();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this list?')) {
      setIsDeleting(id);
      const res = await deletePurchaseList(id);
      if (res.success) {
        setLists(prev => prev.filter(list => list.id !== id));
        toast.success('List deleted successfully');
      } else {
        toast.error(res.error || 'Failed to delete');
      }
      setIsDeleting(null);
    }
  };

  const handleRestore = async (list: PurchaseList) => {
    setIsRestoring(list.id);
    try {
      for (const item of list.items) {
        if ('key' in item) {
          // It's a CartItem
          const { key, ...itemWithoutKey } = item as any;
          await addItem(itemWithoutKey);
        } else {
          // It's a PurchaseListItem
          await addItem({
            productId: item.productId.toString(),
            name: item.productName,
            price: item.price,
            quantity: item.qty,
            image: item.image || '',
            sku: item.sku,
          });
        }
      }
      toast.success('Basket restored!');
      window.location.href = '/cart';
    } catch (e) {
      toast.error('Failed to restore basket');
      setIsRestoring(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-brand-primary">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Search:</span>
          <input type="text" className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:border-brand-primary" />
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-sm">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-brand-primary-dark text-white">
            <tr>
              <th className="px-4 py-3 font-medium">List name</th>
              <th className="px-4 py-3 font-medium text-center">Number of items</th>
              <th className="px-4 py-3 font-medium text-center">User</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lists.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No data available in table
                </td>
              </tr>
            ) : (
              lists.map(list => (
                <tr key={list.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-4 font-medium text-brand-primary-dark">
                    <Link href={`/account/bulk-order?list=${list.id}`} className="hover:underline hover:text-brand-primary">
                      {list.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-center">{list.items.reduce((sum, item) => sum + (('qty' in item ? item.qty : item.quantity) || 0), 0)} items</td>
                  <td className="px-4 py-4 text-center">{list.user}</td>
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={() => handleRestore(list)}
                      disabled={isRestoring === list.id || isDeleting === list.id}
                      className="text-brand-primary hover:text-brand-primary-dark transition-colors text-sm font-medium disabled:opacity-50 mr-4"
                    >
                      {isRestoring === list.id ? 'Restoring...' : 'Restore'}
                    </button>
                    <button 
                      onClick={() => handleDelete(list.id)}
                      disabled={isDeleting === list.id || isRestoring === list.id}
                      className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {isDeleting === list.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
        <div>Showing {lists.length > 0 ? 1 : 0} to {lists.length} of {lists.length} entries</div>
        <div className="flex gap-4 font-medium">
          <button className="text-gray-400 cursor-not-allowed">Previous</button>
          <button className="text-gray-400 cursor-not-allowed">Next</button>
        </div>
      </div>
    </div>
  );
}
