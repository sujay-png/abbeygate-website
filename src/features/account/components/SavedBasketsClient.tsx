'use client';
import { savedBasket, deletesavedBasket } from '@/features/account/services/saved-baskets';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function SavedBasketsClient({ initialLists }: { initialLists: savedBasket[] }) {
  const [lists, setLists] = useState(initialLists);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const res = await deletesavedBasket(id);
    if (res.success) {
      setLists(prev => prev.filter(list => list.id !== id));
      toast.success('List deleted successfully');
    } else {
      toast.error(res.error || 'Failed to delete');
    }
    setIsDeleting(null);
    setListToDelete(null);
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
                <tr 
                  key={list.id} 
                  className="hover:bg-gray-50/50 cursor-pointer group" 
                  onClick={() => router.push(`/account/saved-baskets/${list.id}`)}
                >
                  <td className="px-4 py-4 font-medium text-brand-primary-dark">
                    <Link href={`/account/saved-baskets/${list.id}`} className="group-hover:text-brand-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                      {list.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-center">{list.items.reduce((sum, item) => sum + item.qty, 0)} items</td>
                  <td className="px-4 py-4 text-center">{list.user}</td>
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setListToDelete(list.id);
                      }}
                      disabled={isDeleting === list.id}
                      className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium disabled:opacity-50 relative z-10"
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

      {/* Custom Delete Confirmation Modal */}
      {listToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !isDeleting && setListToDelete(null)}>
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-brand-primary-dark">Delete Saved Basket</h3>
              <p className="text-gray-600 text-sm mt-2">
                Are you sure you want to delete this list? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setListToDelete(null)}
                disabled={isDeleting === listToDelete}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(listToDelete)}
                disabled={isDeleting === listToDelete}
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
              >
                {isDeleting === listToDelete && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
