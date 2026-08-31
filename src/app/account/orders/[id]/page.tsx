import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { woocommerceApi } from '@/lib/woocommerce/client';

type OrderDetailsProps = {
  params: Promise<{ id: string }>;
};

type WooCommerceOrderDetail = {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  discount_total: string;
  customer_note?: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    email: string;
    phone?: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    name: string;
    quantity: number;
    total: string;
    meta_data?: Array<{
      key: string;
      value: string;
    }>;
  }>;
};

export default async function OrderDetailsPage({ params }: OrderDetailsProps) {
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  const { id } = await params;
  let order: WooCommerceOrderDetail | null = null;

  try {
    order = await woocommerceApi.request<WooCommerceOrderDetail>(`/orders/${id}`, {
      revalidate: 0,
    });

    // Ensure the order belongs to the logged-in user
    if (order.customer_id !== session.userId && order.billing.email !== session.email) {
      redirect('/account/orders'); // Unauthorized
    }
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    redirect('/account/orders');
  }

  const formattedDate = new Date(order.date_created).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[
        { label: 'Home', href: '/' }, 
        { label: 'My Account', href: '/account' }, 
        { label: 'Orders', href: '/account/orders' },
        { label: `Order #${order.number}` }
      ]} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          <AccountSidebar />

          {/* Main Content Area */}
          <div className="flex-1 w-full bg-white border border-gray-200/80 rounded-lg p-6 md:p-8">
            
            <p className="text-gray-700 leading-relaxed mb-8">
              Order <strong className="font-semibold">#{order.number}</strong> was placed on <strong className="font-semibold">{formattedDate}</strong> and is currently <strong className="font-semibold capitalize">{order.status}</strong>.
            </p>

            <h2 className="text-2xl font-semibold text-brand-primary-dark mb-6">Order details</h2>

            <div className="border border-gray-200 rounded-md overflow-hidden mb-10">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-gray-50/50">
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 font-semibold text-gray-900">Product</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.line_items.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="py-4 px-4 text-gray-600">
                        <Link href={`/product/${item.product_id}`} className="text-[#3498db] hover:underline">
                          {item.name}
                        </Link>
                        <span className="font-medium"> × {item.quantity}</span>
                        
                        {/* Render meta data for custom logos if present */}
                        {item.meta_data && item.meta_data.length > 0 && (
                          <div className="mt-2 text-sm text-gray-500 pl-4 border-l-2 border-gray-200 space-y-1">
                            {item.meta_data.map((meta, idx: number) => {
                              // Hide internal woo meta keys
                              if (meta.key.startsWith('_')) return null;
                              return (
                                <div key={idx}>
                                  <strong className="font-medium text-gray-700">{meta.key}:</strong>{' '}
                                  {meta.value.toString().startsWith('http') ? (
                                    <a href={meta.value} target="_blank" rel="noopener noreferrer" className="text-[#3498db] hover:underline break-all">
                                      {meta.value}
                                    </a>
                                  ) : (
                                    <span>{meta.value}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-900 text-right font-medium">
                        £{parseFloat(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-white">
                    <td className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-200">Subtotal:</td>
                    <td className="py-3 px-4 text-gray-900 text-right font-medium border-t border-gray-200">£{(Number(order.total) - Number(order.discount_total)).toFixed(2)}</td>
                  </tr>
                  
                  {parseFloat(order.discount_total) > 0 && (
                    <tr className="bg-white">
                      <td className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-100">Discount:</td>
                      <td className="py-3 px-4 text-gray-900 text-right font-medium border-t border-gray-100">-£{parseFloat(order.discount_total).toFixed(2)}</td>
                    </tr>
                  )}

                  <tr className="bg-white">
                    <td className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-100">Total:</td>
                    <td className="py-3 px-4 text-gray-900 text-right font-semibold border-t border-gray-100">£{parseFloat(order.total).toFixed(2)} {order.currency}</td>
                  </tr>

                  {order.customer_note && (
                    <tr className="bg-white">
                      <td className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-100 align-top">Note:</td>
                      <td className="py-3 px-4 text-gray-600 border-t border-gray-100">{order.customer_note}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-semibold text-brand-primary-dark mb-6">Billing address</h2>
            
            <div className="border border-gray-200 rounded-md p-6 bg-gray-50/30">
              <address className="not-italic text-gray-600 text-[14px] leading-relaxed space-y-1">
                <p>{order.billing.first_name} {order.billing.last_name}</p>
                {order.billing.company && <p>{order.billing.company}</p>}
                <p>{order.billing.address_1}</p>
                {order.billing.address_2 && <p>{order.billing.address_2}</p>}
                <p>{order.billing.city}{order.billing.state ? `, ${order.billing.state}` : ''}</p>
                <p>{order.billing.postcode}</p>
                <p>{order.billing.country}</p>
                
                <div className="pt-4 flex items-center gap-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${order.billing.email}`} className="hover:text-brand-primary transition-colors">
                    {order.billing.email}
                  </a>
                </div>
                {order.billing.phone && (
                  <div className="pt-1 flex items-center gap-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${order.billing.phone}`} className="hover:text-brand-primary transition-colors">
                      {order.billing.phone}
                    </a>
                  </div>
                )}
              </address>
            </div>

          </div>
          
        </div>
      </Container>
    </main>
  );
}
