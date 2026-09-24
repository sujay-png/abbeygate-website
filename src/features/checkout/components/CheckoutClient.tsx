'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, CreditCard, Landmark, LockKeyhole, PackageCheck, User, ShoppingBag } from 'lucide-react';
import { useCart } from '@/features/cart/context/CartContext';
import type { CheckoutQuote } from '@/features/checkout/types/quote';
import type { CartItem, PricedItem } from '@/features/cart/context/CartContext';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';

const formatPrice = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
const inputClass = 'h-12 w-full border border-[var(--brand-border)] bg-white px-4 text-sm outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary';

function CheckoutHeader() {
  const { itemCount, openCart } = useCart();
  return (
    <header className="border-b border-[var(--brand-border)] bg-white">
      <div className="mx-auto grid h-20 max-w-[1440px] grid-cols-3 items-center px-5 sm:px-8 lg:px-12">
        <div></div>
        <div className="flex justify-center">
          <Link href="/" aria-label="Abbeygate England home">
            <Image src="/images/logo/abbeygate-logo.png" alt="Abbeygate England" width={200} height={48} priority className="h-11 w-auto object-contain" />
          </Link>
        </div>
        <div className="flex items-center justify-end gap-6 text-brand-primary-dark">
          <Link href="/account" aria-label="Account" className="hover:text-brand-primary flex items-center justify-center">
            <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
          </Link>
          <button type="button" onClick={openCart} aria-label="Open shopping bag" className="relative flex items-center justify-center hover:text-brand-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-[15px] h-[17px] fill-current">
              <path d="M352 160v-32C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128v32H0v272c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V160h-96zm-192-32c0-35.29 28.71-64 64-64s64 28.71 64 64v32H160v-32zm160 120c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zm-192 0c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24z" />
            </svg>
            {itemCount > 0 && <span className="absolute -right-2.5 -top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-brand-primary-dark">{itemCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

function CheckoutFooter() {
  return <footer className="border-t border-[var(--brand-border)] bg-white"><div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-5 py-7 text-center text-[13px] text-brand-grey sm:flex-row sm:px-8 sm:text-left lg:px-12"><p>Abbeygate England © 2026</p><div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-brand-primary-dark"><Link href="/returns" className="hover:underline">Refund &amp; Returns</Link><Link href="/privacy" className="hover:underline">Privacy</Link><Link href="/terms" className="hover:underline">Terms</Link><Link href="/contact" className="hover:underline">Contact</Link></div></div></footer>;
}

function CheckoutFormContent({
  items,
  pricedItems,
  itemCount,
  displaySubtotal,
  displayShipping,
  displayShippingLabel,
  displayVat,
  displayTotal,
  displayDiscount,
  quoteData,
  isQuoteLoading,
  quoteError,
  couponInput,
  setCouponInput,
  setAppliedCoupon,
  initialDetails,
  setPreviewItem
}: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bacs'>('card');
  const [postcode, setPostcode] = useState(initialDetails?.postcode || '');
  const [city, setCity] = useState(initialDetails?.city || '');
  const [postcodeStatus, setPostcodeStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);

  const getCustomDelivery = (pc: string) => {
    const clean = pc.toUpperCase().replace(/\s+/g, '');
    const match = clean.match(/^([A-Z]{1,2})(\d{1,2})/);
    if (!match) return null;
    
    const prefix = match[1];
    const num = parseInt(match[2]);
    
    const rules = [
      { p: "BT", r: [[1,49],[51,57],[60,71],[74,82],[92,94]], days: "Next Day" },
      { p: "IM", r: [[1,9],[86,87]], exact: [99], days: "2–5 Days" },
      { p: "PO", r: [[30,41]], days: "Next Day" },
      { p: "HS", r: [[1,9]], days: "2–5 Days" },
      { p: "GY", r: [[1,10]], days: "Next Day" },
      { p: "JE", r: [[1,5]], days: "Next Day" }
    ];
    
    for (const rule of rules) {
      if (prefix === rule.p) {
        if (rule.exact && rule.exact.includes(num)) return rule.days;
        if (rule.r) {
          for (const range of rule.r) {
            if (num >= range[0] && num <= range[1]) return rule.days;
          }
        }
      }
    }
    return null;
  };

  const handlePostcodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val.trim()) {
      setPostcodeStatus('idle');
      setDeliveryEstimate(null);
      return;
    }
    
    const cleanPostcode = val.replace(/\s+/g, '');
    
    // Check regex first
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/i.test(cleanPostcode)) {
      setPostcodeStatus('invalid');
      setDeliveryEstimate(null);
      return;
    }

    // It is regex-valid, so we immediately calculate the delivery estimate
    const customDays = getCustomDelivery(val);
    setDeliveryEstimate(customDays || 'Next Day');
    setPostcodeStatus('loading');
    
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      const data = await res.json();
      
      if (data.status === 200) {
        setCity(data.result.admin_district || data.result.parliamentary_constituency || data.result.primary_care_trust || '');
      }
      // Regardless of API result, if it passed the regex, we consider it valid for checkout
      setPostcodeStatus('valid');
    } catch (err) {
      // If API fails, it's still a valid postcode by regex
      setPostcodeStatus('valid');
    }
  };

  useEffect(() => {
    if (initialDetails?.postcode && postcodeStatus === 'idle') {
      const cleanPostcode = initialDetails.postcode.replace(/\s+/g, '');
      if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/i.test(cleanPostcode)) {
        setPostcodeStatus('valid');
        const customDays = getCustomDelivery(initialDetails.postcode);
        setDeliveryEstimate(customDays || 'Next Day');
      }
    }
  }, [initialDetails?.postcode, postcodeStatus]);

  useEffect(() => {
    if (quoteData?.id) {
      fetch('/api/checkout/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: quoteData.id })
      })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
      })
      .catch(err => console.error('Failed to get payment intent', err));
    }
  }, [quoteData?.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (paymentMethod === 'card' && (!stripe || !elements || !clientSecret)) return;
    
    setIsProcessing(true);
    setPaymentError(null);

    const formData = new FormData(event.currentTarget);

    if (paymentMethod === 'card' && stripe && elements && clientSecret) {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setPaymentError(submitError.message ?? 'Payment validation failed');
        setIsProcessing(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          receipt_email: formData.get('email') as string,
          payment_method_data: {
            billing_details: {
              name: `${formData.get('firstName')} ${formData.get('lastName')}`,
              email: formData.get('email') as string,
              address: {
                line1: formData.get('address1') as string,
                line2: formData.get('address2') as string,
                city: formData.get('city') as string,
                postal_code: formData.get('postcode') as string,
                country: formData.get('country') as string,
              }
            }
          },
          shipping: {
            name: `${formData.get('firstName')} ${formData.get('lastName')}`,
            address: {
              line1: formData.get('address1') as string,
              line2: formData.get('address2') as string,
              city: formData.get('city') as string,
              postal_code: formData.get('postcode') as string,
              country: formData.get('country') as string,
            }
          }
        }
      });

      if (error) {
        setPaymentError(error.message ?? 'Payment failed');
        setIsProcessing(false);
      }
    } else if (paymentMethod === 'bacs' && quoteData?.id) {
      const billingDetails = {
        name: `${formData.get('firstName')} ${formData.get('lastName')}`,
        email: formData.get('email') as string,
        address: {
          line1: formData.get('address1') as string,
          line2: formData.get('address2') as string,
          city: formData.get('city') as string,
          postal_code: formData.get('postcode') as string,
          country: formData.get('country') as string,
        }
      };

      const res = await fetch('/api/checkout/bacs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: quoteData.id,
          billingDetails,
          shippingDetails: billingDetails // using same for shipping for now, as UI only has one address
        })
      });

      if (!res.ok) {
        setPaymentError('Failed to process BACS order');
        setIsProcessing(false);
      } else {
        window.location.href = '/checkout/success';
      }
    }
  };

  const isSubmitDisabled = isQuoteLoading || isProcessing || (paymentMethod === 'card' && !clientSecret);

  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.78fr)]">
      <form className="bg-white px-5 py-10 sm:px-8 lg:px-12 lg:py-14" onSubmit={handleSubmit}>
        <div className="mx-auto max-w-[640px] space-y-10">
          <section>
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <h2 className="text-xl">Contact</h2>
              <Link href="/account" className="text-sm font-semibold text-brand-primary hover:underline">Sign in</Link>
            </div>
            <label className="block text-sm font-medium" htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" defaultValue={initialDetails?.email} className={`mt-2 ${inputClass}`} />
            <label className="mt-4 flex items-center gap-2 text-sm text-brand-grey">
              <input type="checkbox" className="h-4 w-4 accent-brand-primary" /> Keep me updated with Abbeygate news and offers
            </label>
          </section>

          <section>
            <h2 className="mb-5 text-xl">Delivery</h2>
            <label className="block text-sm font-medium" htmlFor="country">Country / region</label>
            <div className="relative mt-2">
              <select id="country" name="country" defaultValue="GB" className={`${inputClass} appearance-none pr-10`}>
                <option value="GB">United Kingdom</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-grey" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input name="firstName" required autoComplete="given-name" placeholder="First name" defaultValue={initialDetails?.firstName} className={inputClass} />
              <input name="lastName" required autoComplete="family-name" placeholder="Last name" defaultValue={initialDetails?.lastName} className={inputClass} />
            </div>
            <input name="company" autoComplete="organization" placeholder="Company (optional)" defaultValue={initialDetails?.company} className={`mt-4 ${inputClass}`} />
            <input name="address1" required autoComplete="address-line1" placeholder="Address" defaultValue={initialDetails?.address1} className={`mt-4 ${inputClass}`} />
            <input name="address2" autoComplete="address-line2" placeholder="Apartment, suite, etc. (optional)" defaultValue={initialDetails?.address2} className={`mt-4 ${inputClass}`} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 items-start">
              <input name="city" value={city} onChange={(e) => setCity(e.target.value)} required autoComplete="address-level2" placeholder="Town / City" className={inputClass} />
              <div>
                <div className="relative">
                  <input name="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} onBlur={handlePostcodeBlur} required autoComplete="postal-code" placeholder="Postcode" className={inputClass} />
                  {postcodeStatus === 'loading' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-grey">Checking...</span>}
                </div>
                {postcodeStatus === 'invalid' && <p className="mt-1 text-xs text-red-500">Invalid postcode format.</p>}
              </div>
            </div>
            <input name="phone" required autoComplete="tel" placeholder="Phone number" defaultValue={initialDetails?.phone} className={`mt-4 ${inputClass}`} />
          </section>

          <section>
            <h2 className="mb-2 text-xl">Delivery method</h2>
            <div className="flex items-start gap-3 border border-brand-soft bg-brand-tint/60 p-4 text-sm">
              <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent" />
              <p>
                <span className="font-semibold">{displayShippingLabel}</span><br />
                {deliveryEstimate ? (
                  <span className="text-brand-primary-dark font-medium">Estimated Delivery: {deliveryEstimate}</span>
                ) : (
                  <span className="text-brand-grey">Enter a valid postcode to see your estimated delivery time.</span>
                )}
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xl">Payment</h2>
            <p className="mb-4 text-sm text-brand-grey">All transactions will be secure and encrypted.</p>
            <div className="overflow-hidden border border-[var(--brand-border)]">
              <label className={`flex items-center justify-between gap-4 border-b border-[var(--brand-border)] px-4 py-4 text-sm font-semibold cursor-pointer ${paymentMethod === 'card' ? 'bg-brand-tint/60' : 'bg-white'}`}>
                <span className="flex items-center gap-3">
                  <input checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} name="payment" type="radio" value="card" className="accent-brand-primary" /> Credit or debit card
                </span>
                <CreditCard className="h-5 w-5 text-brand-primary" />
              </label>
              {paymentMethod === 'card' && (
                <div className="bg-white px-4 py-4">
                  {stripe ? (
                    <PaymentElement options={{ layout: 'accordion' }} />
                  ) : (
                    <p className="text-sm text-brand-grey">Loading secure payment...</p>
                  )}
                  {paymentError && <p className="mt-4 text-sm text-red-600">{paymentError}</p>}
                </div>
              )}
              
              <label className={`flex items-center justify-between gap-4 px-4 py-4 text-sm font-semibold cursor-pointer ${paymentMethod === 'bacs' ? 'bg-brand-tint/60' : 'bg-white'}`}>
                <span className="flex items-center gap-3">
                  <input checked={paymentMethod === 'bacs'} onChange={() => setPaymentMethod('bacs')} name="payment" type="radio" value="bacs" className="accent-brand-primary" /> Direct bank transfer
                </span>
                <Landmark className="h-5 w-5 text-brand-primary" />
              </label>
            </div>
          </section>

          <section>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input required type="checkbox" className="mt-1 h-4 w-4 accent-brand-primary" /> I agree to the <Link href="/terms" className="underline">Terms &amp; Conditions</Link> and <Link href="/returns" className="underline">Refund &amp; Returns policy</Link>.
            </label>
            <button type="submit" disabled={isSubmitDisabled} className="mt-6 w-full bg-brand-primary px-6 py-4 text-sm font-bold tracking-wide text-white hover:bg-brand-primary-dark disabled:opacity-75 disabled:cursor-not-allowed">
              {isProcessing ? 'Processing payment...' : (isQuoteLoading ? 'Calculating total...' : `Pay ${formatPrice(displayTotal)}`)}
            </button>
            <p className="mt-3 text-center text-xs text-brand-grey">Order placement is encrypted and secure.</p>
          </section>
        </div>
      </form>
      
      <aside className="border-t border-[var(--brand-border)] bg-brand-cream px-5 py-10 sm:px-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-[500px]">
          <div className="mb-7 flex items-baseline justify-between">
            <h2 className="text-xl">Order summary</h2>
            <span className="text-sm text-brand-grey">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
          </div>
          <div className="space-y-5 border-b border-[var(--brand-border)] pb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar overscroll-contain" data-lenis-prevent>
            {pricedItems.map((item: PricedItem) => (
              <div key={item.key} className="flex gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded">
                  <Image src={item.customization?.fullPreviewUrl || item.image || '/images/logo/abbeygate-logo.png'} alt="" fill sizes="64px" className="object-cover mix-blend-multiply" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-5 text-brand-primary-dark">{item.name}</p>
                  <p className="mt-1 text-xs text-brand-grey">Qty {item.quantity}</p>
                  {item.customization?.enabled && (
                    <div className="mt-2 text-[12px] space-y-1">
                      <p className="font-semibold text-brand-primary-dark mb-1">Custom Logo</p>
                      {item.customization.choice && <p className="text-brand-grey"><span className="font-medium text-brand-body">Blocking:</span> {item.customization.choice.replace(' blocked', '')}</p>}
                      {item.customization.foilColor && <p className="text-brand-grey"><span className="font-medium text-brand-body">Foil Colour:</span> {item.customization.foilColor}</p>}
                      {item.customization.fileName && (
                        <p className="text-brand-grey truncate">
                          <span className="font-medium text-brand-body">Logo:</span> {item.customization.fileName} —{' '}
                          <a href={item.customization.logoFile ? URL.createObjectURL(item.customization.logoFile as Blob) : '#'} target="_blank" rel="noopener noreferrer" className="text-brand-primary-dark underline hover:text-gray-600">View file</a>
                        </p>
                      )}
                      {item.customization.logoPreviewUrl && (
                        <p className="text-brand-grey mt-1">
                          <span className="font-medium text-brand-body">Preview:</span>{' '}
                          <button type="button" onClick={() => setPreviewItem(item)} className="text-brand-primary-dark underline hover:text-gray-600">View preview</button>
                        </p>
                      )}
                      {item.customization.cornerEdges && item.customization.cornerEdges !== 'None' && (
                        <p className="text-brand-grey mt-1 pt-1"><span className="font-medium text-brand-body">Corner Edges:</span> {item.customization.cornerEdges}</p>
                      )}
                    </div>
                  )}
                </div>
                <strong className="shrink-0 text-sm">
                  {formatPrice(quoteData?.quote.lines.find((l: any) => l.productId === item.productId && l.variationId === item.variationId)?.unitPrice ? (quoteData.quote.lines.find((l: any) => l.productId === item.productId && l.variationId === item.variationId)!.unitPrice * item.quantity) : item.lineTotal)}
                </strong>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <input placeholder="Discount code" aria-label="Discount code" className="min-w-0 flex-1 border border-[var(--brand-border)] bg-white px-3 text-sm outline-none focus:border-brand-primary" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
            <button type="button" className="border border-brand-primary px-4 py-3 text-sm font-semibold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50" onClick={() => setAppliedCoupon(couponInput)} disabled={!couponInput.trim() || isQuoteLoading || isProcessing}>
              Apply
            </button>
          </div>
          {quoteError && <p className="mt-2 text-sm text-red-600">{quoteError}</p>}
          {displayDiscount > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm text-brand-accent font-semibold">
              <span>Discount applied ({quoteData?.quote.couponCode})</span>
              <button type="button" className="text-xs underline hover:text-brand-primary-dark" onClick={() => { setAppliedCoupon(undefined); setCouponInput(''); }}>Remove</button>
            </div>
          )}
          <dl className="mt-7 space-y-3 text-sm">
            <div className="flex justify-between gap-5">
              <dt>Subtotal</dt>
              <dd className="font-semibold">{formatPrice(displaySubtotal)}</dd>
            </div>
            {displayDiscount > 0 && (
              <div className="flex justify-between gap-5 text-brand-accent">
                <dt>Discount</dt>
                <dd className="font-semibold">-{formatPrice(displayDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-5">
              <dt>{displayShippingLabel}</dt>
              <dd className="font-semibold">{formatPrice(displayShipping)}</dd>
            </div>
            <div className="flex justify-between gap-5 text-brand-grey">
              <dt>VAT (20%)</dt>
              <dd>{formatPrice(displayVat)}</dd>
            </div>
            <div className="mt-5 flex justify-between gap-5 border-t border-[var(--brand-border)] pt-5 text-xl font-bold text-brand-primary-dark">
              <dt>Total</dt>
              <dd>{isQuoteLoading ? '...' : formatPrice(displayTotal)}</dd>
            </div>
          </dl>
          <div className="mt-7 flex items-center gap-3 border-t border-[var(--brand-border)] pt-6 text-xs text-brand-grey">
            <LockKeyhole className="h-4 w-4 shrink-0 text-brand-accent" /> Your payment details are encrypted and processed securely.
          </div>
        </div>
      </aside>
    </div>
  );
}

export function CheckoutClient({ initialDetails }: { initialDetails?: any }) {
  const { items, pricedItems, itemCount, subtotal, shippingCost, shippingLabel, vatCost, total } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [quoteData, setQuoteData] = useState<{ id: string; quote: CheckoutQuote } | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    fetch('/api/checkout/payment-config')
      .then(res => res.json())
      .then(data => {
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      })
      .catch(err => console.error('Failed to load Stripe config', err));
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setQuoteData(null);
      return;
    }

    const fetchQuote = async () => {
      setIsQuoteLoading(true);
      setQuoteError(null);
      try {
        const formData = new FormData();
        let hasFilesToUpload = false;
        
        for (let index = 0; index < items.length; index++) {
          const item = items[index];
          if (item.customization?.enabled) {
            if (item.customization.logoFile) {
              try {
                formData.append(`logo_${index}`, item.customization.logoFile as Blob, item.customization.fileName || 'logo.png');
                hasFilesToUpload = true;
              } catch (e) {
                console.warn('Failed to append logoFile', e);
              }
            }
            if (item.customization.fullPreviewUrl) {
              try {
                const res = await fetch(item.customization.fullPreviewUrl);
                const blob = await res.blob();
                formData.append(`preview_${index}`, blob, 'preview.png');
                hasFilesToUpload = true;
              } catch (e) {
                console.warn('Failed to convert preview to blob', e);
              }
            }
          }
        }

        let uploadedUrls: Record<string, string> = {};
        if (hasFilesToUpload) {
          const uploadRes = await fetch('/api/checkout/upload', {
            method: 'POST',
            body: formData
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedUrls = uploadData.files || {};
          } else {
            const errorText = await uploadRes.text();
            throw new Error('Failed to upload logo files to WordPress: ' + errorText);
          }
        }

        const payload = {
          items: items.map((item, index) => ({
            productId: item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
            colourGroupId: item.colourGroupId,
            customization: item.customization ? {
              enabled: item.customization.enabled,
              choice: item.customization.choice,
              cornerEdges: item.customization.cornerEdges,
              foilColor: item.customization.foilColor,
              fileName: item.customization.fileName,
              fullPreviewUrl: item.customization.fullPreviewUrl,
              logoUrl: uploadedUrls[`logo_${index}`],
              previewUrl: uploadedUrls[`preview_${index}`]
            } : undefined
          })),
          couponCode: appliedCoupon
        };
        
        const res = await fetch('/api/checkout/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create checkout session');
        }
        
        const data = await res.json();
        setQuoteData(data);
      } catch (error) {
        setQuoteError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsQuoteLoading(false);
      }
    };

    const timer = setTimeout(fetchQuote, 300);
    return () => clearTimeout(timer);
  }, [items, appliedCoupon]);

  const displaySubtotal = quoteData?.quote.subtotal ?? subtotal;
  const displayShipping = quoteData ? quoteData.quote.shipping.cost : shippingCost;
  const displayShippingLabel = quoteData ? quoteData.quote.shipping.label : shippingLabel;
  const displayVat = quoteData?.quote.vat ?? vatCost;
  const displayTotal = quoteData?.quote.total ?? total;
  const displayDiscount = quoteData?.quote.discount ?? 0;

  if (!pricedItems.length) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <CheckoutHeader />
        <section className="mx-auto max-w-[760px] px-5 py-24 text-center sm:px-8">
          <ShoppingBag className="mx-auto mb-5 h-8 w-8 text-brand-primary" />
          <h1 className="text-2xl">Your bag is empty</h1>
          <p className="mt-3 text-brand-grey">Add a product before proceeding to checkout.</p>
          <Link href="/notebooks" className="mt-8 inline-flex bg-brand-primary px-7 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark">Explore notebooks</Link>
        </section>
        <CheckoutFooter />
      </div>
    );
  }

  const formProps = {
    items,
    pricedItems,
    itemCount,
    displaySubtotal,
    displayShipping,
    displayShippingLabel,
    displayVat,
    displayTotal,
    displayDiscount,
    quoteData,
    isQuoteLoading,
    quoteError,
    couponInput,
    setCouponInput,
    setAppliedCoupon,
    initialDetails,
    setPreviewItem
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-body">
      <CheckoutHeader />
      <section className="border-b border-[var(--brand-border)] bg-brand-cream">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-7 sm:px-8 lg:px-12">
          <h1 className="text-3xl sm:text-4xl">Checkout</h1>
        </div>
      </section>
      
      <Elements 
        stripe={stripePromise} 
        options={{ 
          mode: 'payment', 
          amount: Math.max(1, Math.round(displayTotal * 100)), 
          currency: 'gbp',
          appearance: { theme: 'stripe' }
        }}
      >
        <CheckoutFormContent {...formProps} />
      </Elements>
      
      <CheckoutFooter />
      <ImagePreviewModal 
        isOpen={!!previewItem} 
        onClose={() => setPreviewItem(null)} 
        item={previewItem} 
        title="Customization Preview" 
      />
    </div>
  );
}


