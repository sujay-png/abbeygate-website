'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { useCart } from '@/features/cart/context/CartContext';
import { Minus, Plus, X } from 'lucide-react';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

export default function CartPage() {
  const { items, subtotal, shippingCost, shippingLabel, total, removeItem, updateQuantity } = useCart();

  return (
    <div className="py-10">
      <Container>
        <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
        <h1 className="text-3xl font-extrabold mt-6 mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-6">Your cart is empty.</p>
            <Link href="/notebooks" className="inline-block bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4 border-b border-gray-100 pb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded bg-gray-50 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <Link href={item.slug ? `/product/${item.slug}` : '#'} className="font-medium text-gray-900 hover:underline">
                          {item.name}
                        </Link>
                        {item.attributes?.map((attr) => (
                          <p key={attr.name} className="text-sm text-gray-500 mt-1">
                            {attr.name}{attr.value ? `: ${attr.value}` : ''}
                          </p>
                        ))}
                      </div>
                      <button type="button" onClick={() => removeItem(item.key)} className="text-gray-400 hover:text-gray-600 shrink-0">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-200 rounded">
                        <button type="button" onClick={() => updateQuantity(item.key, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.key, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 h-fit">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{shippingLabel}</span>
                  <span className="font-medium">{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 text-base font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <Link href="/checkout" className="block w-full text-center bg-black text-white py-4 rounded-md font-medium mt-6 hover:bg-gray-800 transition-colors">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
