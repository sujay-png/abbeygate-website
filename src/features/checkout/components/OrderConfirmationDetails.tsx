import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { NormalizedOrderConfirmation } from '../services/order-confirmation';
import { GuestAccountSection } from './GuestAccountSection';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

type Props = {
  order: NormalizedOrderConfirmation;
  isGuest: boolean;
  bankDetails?: {
    name: string;
    accountNumber: string;
    sortCode: string;
  };
};

export function OrderConfirmationDetails({ order, isGuest, bankDetails }: Props) {
  const billing = order.billing;
  const billingName =
    billing?.name ||
    [billing?.first_name, billing?.last_name].filter(Boolean).join(' ') ||
    'Customer';

  return (
    <>
      {/* Top Banner */}
      <section className="bg-brand-cream border-b border-[var(--brand-border)] py-10 px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-7 h-7 text-[#16a34a]" />
            <h1 className="text-3xl text-brand-primary-dark font-medium">Order Confirmed!</h1>
          </div>
          <p className="text-brand-grey mb-8">
            Thank you. Your order has been received and is now being processed.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-sm bg-white p-5 border border-[var(--brand-border)]">
            <div>
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">
                Order Number
              </p>
              <p className="font-bold text-brand-primary-dark">#{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">
                Date
              </p>
              <p className="font-semibold text-brand-primary-dark">
                {order.orderDate.toLocaleDateString('en-GB', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">
                Email
              </p>
              <p className="font-semibold text-brand-primary-dark truncate" title={order.email}>
                {order.email || '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">
                Total
              </p>
              <p className="font-bold text-brand-primary-dark whitespace-nowrap">
                {formatPrice(order.total)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">
                Payment Method
              </p>
              <p className="font-semibold text-brand-primary-dark">{order.paymentMethod}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Order Content */}
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8 lg:px-12 py-12 grid gap-12 lg:grid-cols-12">
          {/* Left Column: Bank details (if BACS) & Order summary table */}
          <div className="lg:col-span-7 space-y-10">
            {bankDetails && (
              <section className="bg-brand-cream/60 border border-[var(--brand-border)] p-6">
                <h2 className="text-xl text-brand-primary-dark mb-4 font-semibold">Our bank details</h2>
                <p className="font-semibold text-brand-primary-dark mb-3">Abbeygate:</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">
                      Bank
                    </p>
                    <p className="text-brand-body font-medium">{bankDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">
                      Account Number
                    </p>
                    <p className="text-brand-body font-medium">{bankDetails.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-brand-grey uppercase tracking-wider mb-1">
                      Sort Code
                    </p>
                    <p className="text-brand-body font-medium">{bankDetails.sortCode}</p>
                  </div>
                </div>
              </section>
            )}

            <section>
              <h2 className="text-2xl text-brand-primary-dark mb-6 font-semibold">Order details</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--brand-border)]">
                    <th className="pb-3 text-left font-semibold text-brand-primary-dark">Product</th>
                    <th className="pb-3 text-right font-semibold text-brand-primary-dark">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--brand-border)] text-brand-grey">
                  {order.lineItems.map((item, idx) => (
                    <tr key={item.id ? `${item.id}-${idx}` : idx}>
                      <td className="py-4 pr-4 align-top">
                        <span className="font-medium text-brand-primary-dark">{item.name}</span>{' '}
                        <span className="text-brand-grey">× {item.quantity}</span>
                        {item.meta && item.meta.length > 0 && (
                          <div className="mt-2 pl-2 space-y-1 text-xs border-l-2 border-brand-primary/20">
                            {item.meta.map((meta: any, mIdx: number) => (
                              <p key={mIdx}>
                                <span className="font-medium text-brand-body">{meta.key}:</span>{' '}
                                {meta.value?.toString().includes('http') ? (
                                  <a
                                    href={meta.value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand-primary hover:underline break-all"
                                  >
                                    {meta.value}
                                  </a>
                                ) : (
                                  meta.value
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-right align-top font-medium text-brand-body whitespace-nowrap">
                        {formatPrice(item.total)}
                      </td>
                    </tr>
                  ))}

                  {/* Totals Breakdown */}
                  <tr>
                    <td className="py-4 font-semibold text-brand-primary-dark">Subtotal:</td>
                    <td className="py-4 text-right font-medium text-brand-body whitespace-nowrap">
                      {formatPrice(order.subtotal)}
                    </td>
                  </tr>

                  {order.shippingTotal > 0 && (
                    <tr>
                      <td className="py-4 font-semibold text-brand-primary-dark">
                        Shipping ({order.shippingLabel || 'Delivery'}):
                      </td>
                      <td className="py-4 text-right font-medium text-brand-body whitespace-nowrap">
                        {formatPrice(order.shippingTotal)}
                      </td>
                    </tr>
                  )}

                  {order.taxTotal > 0 && (
                    <tr>
                      <td className="py-4 font-semibold text-brand-primary-dark">VAT (20%):</td>
                      <td className="py-4 text-right font-medium text-brand-body whitespace-nowrap">
                        {formatPrice(order.taxTotal)}
                      </td>
                    </tr>
                  )}

                  <tr className="border-t-2 border-[var(--brand-border)]">
                    <td className="py-4 font-bold text-lg text-brand-primary-dark">Total:</td>
                    <td className="py-4 text-right font-bold text-lg whitespace-nowrap text-brand-primary-dark">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          {/* Right Column: Guest Account Box & Addresses */}
          <div className="lg:col-span-5 space-y-8">
            {/* Guest Order Account Section */}
            {isGuest && (
              <GuestAccountSection
                email={order.email}
                orderId={order.orderId}
                orderKey={order.orderKey}
                stripeIntentId={order.stripeIntentId}
              />
            )}

            {/* Billing Address Card */}
            <section className="bg-brand-cream border border-[var(--brand-border)] p-6">
              <h2 className="text-xl text-brand-primary-dark mb-4 font-semibold">Billing address</h2>
              <address className="not-italic text-sm text-brand-grey space-y-1">
                {billingName && <p className="font-medium text-brand-primary-dark">{billingName}</p>}
                {billing?.company && <p>{billing.company}</p>}
                {(billing?.address_1 || billing?.line1) && (
                  <p>{billing.address_1 || billing.line1}</p>
                )}
                {(billing?.address_2 || billing?.line2) && (
                  <p>{billing.address_2 || billing.line2}</p>
                )}
                {(billing?.city || billing?.postcode || billing?.postal_code) && (
                  <p>
                    {[billing?.city, billing?.postcode || billing?.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
                {billing?.country && <p>{billing.country}</p>}
                {order.email && (
                  <div className="pt-2 mt-2 border-t border-[var(--brand-border)] flex items-center gap-2 text-xs">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 shrink-0 text-brand-grey"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>{order.email}</span>
                  </div>
                )}
              </address>
            </section>

            {/* Action Links */}
            <div className="space-y-3 pt-2">
              <Link
                href="/collection"
                className="inline-flex w-full justify-center bg-brand-primary px-6 py-3.5 font-bold text-white hover:bg-brand-primary-dark transition-colors uppercase tracking-wider text-xs shadow-sm"
              >
                Return to Store
              </Link>
              <Link
                href="/account/orders"
                className="inline-flex w-full justify-center border border-[var(--brand-border)] bg-white px-6 py-3 font-semibold text-brand-primary-dark hover:bg-brand-tint transition-colors text-xs uppercase tracking-wider"
              >
                View Order History
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
