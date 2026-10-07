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

import { getSEOMetadata } from '@/lib/seo';
export const metadata = getSEOMetadata("/account/orders/[id]", { title: 'Order Details | Abbeygate England', noindex: true });

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
  shipping: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
  };
  shipping_total: string;
  total_tax: string;
  shipping_tax: string;
  shipping_lines?: Array<{
    id: number;
    method_title: string;
    total: string;
    total_tax: string;
  }>;
  fee_lines?: Array<{
    id: number;
    name: string;
    total: string;
    total_tax: string;
  }>;
  coupon_lines?: Array<{
    code: string;
    discount: string;
  }>;
  line_items: Array<{
    id: number;
    product_id: number;
    name: string;
    quantity: number;
    subtotal: string;
    total: string;
    total_tax: string;
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
  } catch (error) {
    console.error('Failed to fetch order details:', error);
  }

  if (!order) {
    redirect('/account/orders');
  }

  // Ensure the order belongs to the logged-in user
  const isOwner = Number(order.customer_id) === Number(session.userId);
  const isEmailMatch = order.billing?.email?.toLowerCase() === session.email?.toLowerCase();
  
  if (!isOwner && !isEmailMatch) {
    // TEMPORARY BYPASS FOR DEVELOPMENT TESTING
    if (process.env.NODE_ENV !== 'development') {
      redirect('/account/orders'); // Unauthorized
    }
  }

  const formattedDate = new Date(order.date_created).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const subtotalExVat = order.line_items.reduce((sum, item) => sum + parseFloat(item.subtotal || item.total), 0);
  
  // Try to use shipping_lines if shipping_total is unreliable/0 but lines exist
  let calcShippingTotal = parseFloat(order.shipping_total || '0');
  let calcShippingTax = parseFloat(order.shipping_tax || '0');
  if (calcShippingTotal === 0 && order.shipping_lines && order.shipping_lines.length > 0) {
    calcShippingTotal = order.shipping_lines.reduce((sum, line) => sum + parseFloat(line.total || '0'), 0);
    calcShippingTax = order.shipping_lines.reduce((sum, line) => sum + parseFloat(line.total_tax || '0'), 0);
  }

  const deliveryIncVat = calcShippingTotal + calcShippingTax;
  const deliveryVat = calcShippingTax;
  const totalTax = parseFloat(order.total_tax || '0');
  const totalIncVat = parseFloat(order.total || '0');
  const totalExVat = totalIncVat - totalTax;
  const discountAmount = parseFloat(order.discount_total || '0');
  const couponCodes = order.coupon_lines && order.coupon_lines.length > 0 
    ? order.coupon_lines.map(c => c.code).join(', ') 
    : '';

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
                    <th className="py-3 px-4 font-semibold text-gray-900 text-right">Price</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 text-right">Quantity</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.line_items.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="py-4 px-4 text-gray-600">
                        <Link href={`/product/${item.product_id}`} className="text-brand-primary hover:underline">
                          {item.name}
                        </Link>
                        
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
                                    <a href={meta.value} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                                      View File
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
                      <td className="py-4 px-4 text-gray-900 text-right">
                        £{(parseFloat(item.subtotal || item.total) / item.quantity).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 text-gray-900 text-right font-medium">
                        £{parseFloat(item.subtotal || item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-white">
                    <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-200">Subtotal (ex VAT):</td>
                    <td className="py-3 px-4 text-gray-900 text-right font-medium border-t border-gray-200">£{subtotalExVat.toFixed(2)}</td>
                  </tr>
                  
                  {discountAmount > 0 && (
                    <tr className="bg-white">
                      <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-100">
                        {couponCodes ? `Discount (${couponCodes.toUpperCase()}):` : 'Discount:'}
                      </td>
                      <td className="py-3 px-4 text-gray-900 text-right font-medium border-t border-gray-100 whitespace-nowrap">-£{discountAmount.toFixed(2)}</td>
                    </tr>
                  )}

                  {order.fee_lines && order.fee_lines.map(fee => (
                    <tr key={`fee-${fee.id}`} className="bg-white">
                      <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-100">
                        {fee.name} (ex VAT):
                      </td>
                      <td className="py-3 px-4 text-gray-900 text-right font-medium border-t border-gray-100">£{parseFloat(fee.total).toFixed(2)}</td>
                    </tr>
                  ))}

                  <tr className="bg-white">
                    <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-100">Delivery (ex VAT):</td>
                    <td className="py-3 px-4 text-gray-900 text-right font-medium border-t border-gray-100">£{calcShippingTotal.toFixed(2)}</td>
                  </tr>

                  <tr className="bg-white">
                    <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-100">VAT:</td>
                    <td className="py-3 px-4 text-gray-900 text-right font-medium border-t border-gray-100">£{totalTax.toFixed(2)}</td>
                  </tr>

                  <tr className="bg-brand-tint/20">
                    <td colSpan={3} className="py-4 px-4 font-bold text-brand-primary text-right border-t border-brand-primary/20 text-[15px]">Total (inc VAT):</td>
                    <td className="py-4 px-4 text-brand-primary text-right font-bold border-t border-brand-primary/20 text-[16px]">£{totalIncVat.toFixed(2)}</td>
                  </tr>

                  <tr className="bg-white">
                    <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-100">Total (ex VAT):</td>
                    <td className="py-3 px-4 text-gray-900 text-right font-medium border-t border-gray-100">£{totalExVat.toFixed(2)}</td>
                  </tr>

                  {order.customer_note && (
                    <tr className="bg-white">
                      <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900 text-right border-t border-gray-100 align-top">Note:</td>
                      <td className="py-3 px-4 text-gray-600 border-t border-gray-100">{order.customer_note}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-brand-primary-dark mb-4">Billing address</h2>
                <div className="border border-gray-200 rounded-md p-6 bg-gray-50/30 flex-1">
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

              {order.shipping && (
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-brand-primary-dark mb-4">Shipping address</h2>
                  <div className="border border-gray-200 rounded-md p-6 bg-gray-50/30 flex-1">
                    <address className="not-italic text-gray-600 text-[14px] leading-relaxed space-y-1">
                      <p>{order.shipping.first_name} {order.shipping.last_name}</p>
                      {order.shipping.company && <p>{order.shipping.company}</p>}
                      <p>{order.shipping.address_1}</p>
                      {order.shipping.address_2 && <p>{order.shipping.address_2}</p>}
                      <p>{order.shipping.city}{order.shipping.state ? `, ${order.shipping.state}` : ''}</p>
                      <p>{order.shipping.postcode}</p>
                      <p>{order.shipping.country}</p>
                    </address>
                  </div>
                </div>
              )}
            </div>


          </div>
          
        </div>
      </Container>
    </main>
  );
}
