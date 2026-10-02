import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { woocommerceFetch } from '@/lib/woocommerce/client';
import { ClearCartOnLoad } from './ClearCartOnLoad';

const formatPrice = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

import { GuestAccountPrompt } from '@/features/checkout/components/GuestAccountPrompt';
import { getSession } from '@/features/auth/utils/session';

export default async function BacsSuccessPage({ searchParams }: { searchParams: Promise<{ orderId?: string, key?: string }> }) {
  const { orderId, key } = await searchParams;
  const session = await getSession();
  const isGuest = !session;
  
  if (!orderId || !key) {
    return notFound();
  }

  let order: any;
  try {
    order = await woocommerceFetch({ path: `/orders/${orderId}`, revalidate: false });
    if (!order || !order.id || order.order_key !== key) {
      throw new Error('Order not found or invalid key');
    }
  } catch (error) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-brand-primary-dark">Order not found</h1>
        <p className="mt-2 text-brand-grey">We couldn't locate this order.</p>
        <Link href="/" className="mt-4 text-brand-primary hover:underline">Return to home</Link>
      </div>
    );
  }

  // Calculate some display values
  const orderDate = new Date(order.date_created);
  const email = order.billing?.email || '';
  const total = Number(order.total);
  const paymentMethod = order.payment_method_title || 'Direct bank transfer';

  // Bank Details from the user's screenshot
  const bankDetails = {
    name: 'HSBC Bank PLC',
    accountNumber: '72822180',
    sortCode: '404519'
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-body flex flex-col">
      {/* We need a Client Component to clear the cart in IDB, since we're rendering a Server Component */}
      <ClearCartOnLoad />
      
      {isGuest && (
        <GuestAccountPrompt email={email} orderId={orderId} />
      )}
      
      <header className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-center px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center" aria-label="Abbeygate England home">
            <Image src="/images/logo/abbeygate-logo.png" alt="Abbeygate England" width={200} height={48} priority className="h-11 w-auto object-contain" />
          </Link>
        </div>
      </header>

      <section className="bg-brand-cream border-b border-[var(--brand-border)] py-10 px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1000px]">
          <h1 className="text-3xl text-brand-primary-dark font-medium mb-6">Checkout</h1>
          <p className="text-brand-grey mb-8">Thank you. Your order has been received.</p>
          
          <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm">
            <div>
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">Order Number</p>
              <p className="font-semibold text-brand-primary-dark">{order.id}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">Date</p>
              <p className="font-semibold text-brand-primary-dark">
                {orderDate.toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">Email</p>
              <p className="font-semibold text-brand-primary-dark">{email}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">Total</p>
              <p className="font-semibold text-brand-primary-dark whitespace-nowrap">{formatPrice(total)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">Payment Method</p>
              <p className="font-semibold text-brand-primary-dark">{paymentMethod}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-[1000px] px-5 sm:px-8 lg:px-12 py-12 grid gap-12 lg:grid-cols-2">
          
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl text-brand-primary-dark mb-6">Our bank details</h2>
              <p className="font-semibold text-brand-primary-dark mb-4">Abbeygate:</p>
              <div className="flex flex-wrap gap-x-10 gap-y-6">
                <div>
                  <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">Bank</p>
                  <p className="text-brand-body">{bankDetails.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">Account Number</p>
                  <p className="text-brand-body">{bankDetails.accountNumber}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">Sort Code</p>
                  <p className="text-brand-body">{bankDetails.sortCode}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl text-brand-primary-dark mb-6">Order details</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--brand-border)]">
                    <th className="pb-3 text-left font-semibold text-brand-primary-dark">Product</th>
                    <th className="pb-3 text-right font-semibold text-brand-primary-dark">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--brand-border)] text-brand-grey">
                  {order.line_items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4 pr-4 align-top">
                        <span className="text-brand-primary-dark">{item.name}</span> × {item.quantity}
                        {item.meta_data && item.meta_data.length > 0 && (
                          <div className="mt-2 pl-2 space-y-1 text-xs">
                            {item.meta_data.map((meta: any) => (
                              // Filter out internal WooCommerce keys starting with underscore
                              !meta.key.startsWith('_') && (
                                <p key={meta.id}>
                                  <span className="font-medium text-brand-body">{meta.key}:</span>{' '}
                                  {meta.value?.toString().includes('http') ? (
                                    <a href={meta.value} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline break-all">
                                      {meta.value}
                                    </a>
                                  ) : (
                                    meta.value
                                  )}
                                </p>
                              )
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-right align-top font-medium text-brand-body">
                        {formatPrice(Number(item.total))}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Totals Breakdown */}
                  <tr>
                    <td className="py-4 font-semibold text-brand-primary-dark">Subtotal:</td>
                    <td className="py-4 text-right font-medium text-brand-body">
                      {formatPrice(order.line_items?.reduce((sum: number, item: any) => sum + Number(item.total), 0) || 0)}
                    </td>
                  </tr>
                  
                  {order.shipping_total && Number(order.shipping_total) > 0 && (
                    <tr>
                      <td className="py-4 font-semibold text-brand-primary-dark">Shipping:</td>
                      <td className="py-4 text-right font-medium text-brand-body">{formatPrice(Number(order.shipping_total))}</td>
                    </tr>
                  )}
                  
                  {order.total_tax && Number(order.total_tax) > 0 && (
                    <tr>
                      <td className="py-4 font-semibold text-brand-primary-dark">VAT (20%):</td>
                      <td className="py-4 text-right font-medium text-brand-body">{formatPrice(Number(order.total_tax))}</td>
                    </tr>
                  )}
                  
                  <tr className="border-t border-[var(--brand-border)]">
                    <td className="py-4 font-bold text-lg text-brand-primary-dark">Total:</td>
                    <td className="py-4 text-right font-bold text-lg whitespace-nowrap text-brand-primary-dark">{formatPrice(total)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
          
          <div>
            <section className="bg-brand-cream border border-[var(--brand-border)] p-8">
              <h2 className="text-2xl text-brand-primary-dark mb-4">Billing address</h2>
              <address className="not-italic text-sm text-brand-grey space-y-1">
                <p>{order.billing?.first_name} {order.billing?.last_name}</p>
                {order.billing?.company && <p>{order.billing.company}</p>}
                <p>{order.billing?.address_1}</p>
                {order.billing?.address_2 && <p>{order.billing.address_2}</p>}
                <p>{order.billing?.city}</p>
                <p>{order.billing?.postcode}</p>
                <div className="pt-2 mt-2 border-t border-[var(--brand-border)] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <span>{order.billing?.email}</span>
                </div>
              </address>
            </section>
            
            <div className="mt-8 text-sm">
              <Link href="/collection" className="inline-flex w-full justify-center bg-brand-primary px-6 py-4 font-bold text-white hover:bg-brand-primary-dark transition-colors">
                Return to Store
              </Link>
            </div>
          </div>
          
        </div>
      </main>

      <footer className="border-t border-[var(--brand-border)] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-5 py-7 text-center text-[13px] text-brand-grey sm:flex-row sm:px-8 sm:text-left lg:px-12">
          <p>Abbeygate England © 2026</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-brand-primary-dark">
            <Link href="/returns" className="hover:underline">Refund &amp; Returns</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
