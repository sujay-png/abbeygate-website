'use client';

import { useCallback, useState } from 'react';
import type { StoreProduct, PriceTier } from '../types/store-product';
import { ProductCustomizer, type CustomizationState } from './ProductCustomizer';
import { useCart } from '@/features/cart/context/CartContext';
import { CUSTOMIZATION_MIN_QTY, formatGBP, isGiftsProduct } from '../utils/pricing';

type ProductDetailClientProps = {
  product: StoreProduct;
  tiers: PriceTier[];
  basePrice: number;
};

export const ProductDetailClient = ({
  product,
  tiers,
  basePrice,
}: ProductDetailClientProps) => {
  const { addItem } = useCart();
  const isGifts = isGiftsProduct(product);
  const [quantity, setQuantity] = useState(isGifts ? 1 : CUSTOMIZATION_MIN_QTY);
  const [unitPrice, setUnitPrice] = useState(basePrice);
  const [customization, setCustomization] = useState<CustomizationState>({
    enabled: !isGifts,
    blockingType: 'Embossed',
    position: 'top-center',
  });
  const [isAdding, setIsAdding] = useState(false);

  const handlePriceChange = useCallback((unit: number) => {
    setUnitPrice(unit);
  }, []);

  const handleCustomizationChange = useCallback((state: CustomizationState) => {
    setCustomization(state);
  }, []);

  const handleAddToCart = async () => {
    if (
      customization.enabled &&
      quantity < CUSTOMIZATION_MIN_QTY &&
      !isGifts
    ) {
      alert(
        `Minimum order quantity for customisable products with logos is ${CUSTOMIZATION_MIN_QTY}. Please increase your quantity or remove the customisation.`,
      );
      return;
    }

    setIsAdding(true);
    try {
      const attributes: { name: string; value: string }[] = [];

      if (customization.enabled && !isGifts) {
        if (customization.blockingType) {
          attributes.push({ name: 'Custom Logo Blocking', value: customization.blockingType });
        }
        if (customization.position) {
          attributes.push({
            name: 'Logo Position',
            value: customization.position.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          });
        }
        if (customization.logoFile) {
          attributes.push({ name: 'Uploaded Logo', value: customization.logoFile.name });
        }
      }

      await addItem({
        productId: String(product.id),
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.src ?? '',
        price: unitPrice,
        quantity,
        attributes,
        customization: customization.enabled && !isGifts
          ? {
              enabled: true,
              choice: customization.blockingType,
              position: customization.position,
              fileName: customization.logoFile?.name,
              logoPreviewUrl: customization.logoPreviewUrl,
            }
          : undefined,
        categorySlugs: product.categories.map((c) => c.slug),
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-4">
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center p-8">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0].src}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-48 h-64 bg-gray-200 rounded" />
          )}
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto">
            {product.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.thumbnail || img.src}
                alt={img.alt || product.name}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0"
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4">{product.name}</h1>

        {!isGifts ? (
          <ProductCustomizer
            product={product}
            tiers={tiers}
            basePrice={basePrice}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onCustomizationChange={handleCustomizationChange}
            onPriceChange={handlePriceChange}
          />
        ) : (
          <div className="mb-6">
            <p className="text-3xl font-bold mb-4">{formatGBP(basePrice)}</p>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20 h-[50px] text-lg border rounded-lg text-center mr-4"
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding}
          className="w-full sm:w-auto h-[52px] px-9 text-lg font-bold rounded-xl bg-[#7b5bc6] text-white hover:bg-[#684ab1] hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4"
        >
          {isAdding ? 'Adding...' : 'Add to Basket'}
        </button>

        {!isGifts && tiers.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 font-semibold">Product Quantity</th>
                  <th className="text-left py-3 font-semibold">Price per Unit</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.min} className="border-b border-gray-100">
                    <td className="py-2.5">
                      {tier.max
                        ? `${tier.min} - ${tier.max}`
                        : `${tier.min}+`}
                    </td>
                    <td className="py-2.5 font-medium">{formatGBP(tier.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {product.short_description && (
          <div
            className="mt-8 text-gray-600 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}

        {product.attributes.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-3">Additional information</h3>
            <table className="w-full text-sm">
              <tbody>
                {product.attributes.map((attr) => (
                  <tr key={attr.id} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-700">{attr.name}</td>
                    <td className="py-2 text-gray-600">
                      {attr.terms.map((t) => t.name).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {product.description && (
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-3">Description</h3>
            <div
              className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
