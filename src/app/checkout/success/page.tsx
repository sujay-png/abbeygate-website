import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { ClearCartOnLoad } from '../bacs-success/ClearCartOnLoad';
import { GuestAccountSection } from '@/features/checkout/components/GuestAccountSection';
import { OrderSummaryDropdown } from '@/features/checkout/components/OrderSummaryDropdown';
import { getOrderConfirmationData } from '@/features/checkout/services/order-confirmation';
import { getSession } from '@/features/auth/utils/session';
import { invalidateCustomerOrdersCache } from '@/features/account/services/orders';

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ payment_intent?: string; orderId?: string; key?: string; sessionId?: string }> }) {
  const { payment_intent, orderId, key, sessionId } = await searchParams;
  const session = await getSession();
  const isGuest = !session;

  const orderData = await getOrderConfirmationData({
    orderId,
    key,
    payment_intent,
    sessionId,
  });

  if (session?.userId) {
    await invalidateCustomerOrdersCache(session.userId);
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <ClearCartOnLoad transactionId={payment_intent || orderId} />

      <header className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-center px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center" aria-label="Abbeygate England home">
            <Image src="/images/logo/abbeygate-logo.png" alt="Abbeygate England" width={200} height={48} priority className="h-11 w-auto object-contain" />
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="max-w-xl w-full bg-white p-6 sm:p-10 border border-[var(--brand-border)] text-center shadow-sm space-y-6">
          <CheckCircle2 className="w-16 h-16 text-[#16a34a] mx-auto mb-2" />
          <div>
            <h1 className="text-3xl font-bold text-brand-primary-dark mb-2">Order Confirmed!</h1>
            <p className="text-brand-grey text-sm sm:text-base">
              Thank you for your purchase. Your payment was successful and we are now processing your order.
            </p>
            {orderData?.orderNumber && (
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mt-2">
                Order #{orderData.orderNumber}
              </p>
            )}
          </div>

          {orderData && orderData.lineItems.length > 0 && (
            <div className="text-left">
              <OrderSummaryDropdown
                lineItems={orderData.lineItems}
                subtotal={orderData.subtotal}
                shippingTotal={orderData.shippingTotal}
                shippingLabel={orderData.shippingLabel}
                taxTotal={orderData.taxTotal}
                total={orderData.total}
                totalPaid={orderData.total}
                defaultOpen={false}
              />
            </div>
          )}

          {isGuest && (
            <div className="text-left">
              <GuestAccountSection
                email={orderData?.email}
                stripeIntentId={payment_intent}
                orderId={orderId || orderData?.orderId}
                orderKey={key || orderData?.orderKey}
              />
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Link 
              href="/collection" 
              className="block w-full bg-brand-primary text-white font-bold py-3.5 px-4 text-xs uppercase tracking-wider hover:bg-brand-primary-dark transition-colors"
            >
              Return to Store
            </Link>
            {!isGuest && (
              <Link 
                href="/account/orders" 
                className="block w-full border border-[var(--brand-border)] text-brand-primary-dark font-semibold py-3 px-4 text-xs uppercase tracking-wider hover:bg-brand-tint transition-colors"
              >
                View Order History
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--brand-border)] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-4 px-5 py-7 text-center text-[13px] text-brand-grey">
          <p>Abbeygate England © 2026</p>
        </div>
      </footer>
    </div>
  );
}
