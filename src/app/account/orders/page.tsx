import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { LinkOrdersBanner } from '@/features/account/components/LinkOrdersBanner';
import { woocommerceApi } from '@/lib/woocommerce/client';

// Define a basic Order type based on WooCommerce REST API
type WooCommerceOrder = {
  id: number;
  number: string;
  date_created: string;
  status: string;
  total: string;
  currency: string;
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
  }>;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

export default async function OrdersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  // Fetch orders for this customer
  let orders: WooCommerceOrder[] = [];
  try {
    orders = await woocommerceApi.request<WooCommerceOrder[]>('/orders', {
      params: { customer: session.userId },
      revalidate: 0 // Don't cache orders page heavily, or use a short revalidate
    });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    // Continue with empty orders array
  }

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'My Account', href: '/account' }, { label: 'Orders' }]} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          <AccountSidebar />

          {/* Main Content Area */}
          <div className="flex-1 w-full bg-white border border-gray-200/80 rounded-lg p-6 md:p-8">
            
            {/* Link Past Orders Banner */}
            <LinkOrdersBanner />

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 font-semibold text-gray-900">Order</th>
                    <th className="pb-3 font-semibold text-gray-900">Placed by</th>
                    <th className="pb-3 font-semibold text-gray-900">Date</th>
                    <th className="pb-3 font-semibold text-gray-900">Status</th>
                    <th className="pb-3 font-semibold text-gray-900">Total</th>
                    <th className="pb-3 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <Link href={`/account/orders/${order.id}`} className="text-[#3498db] hover:underline font-medium">
                            #{order.number}
                          </Link>
                        </td>
                        <td className="py-4 text-gray-600">
                          {order.billing.first_name || 'Guest'}
                        </td>
                        <td className="py-4 text-gray-600">
                          {new Date(order.date_created).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 text-gray-600 capitalize">
                          {order.status}
                        </td>
                        <td className="py-4 text-gray-600">
                          £{parseFloat(order.total).toFixed(2)} GBP for {order.line_items.length} items
                        </td>
                        <td className="py-4">
                          <Link 
                            href={`/account/orders/${order.id}`}
                            className="inline-flex items-center justify-center px-4 py-1.5 border border-[#3498db] text-[#3498db] text-sm font-medium rounded hover:bg-[#3498db] hover:text-white transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
          
        </div>
      </Container>
    </main>
  );
}
