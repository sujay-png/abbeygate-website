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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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

  const activeImage = product.images[activeImageIndex] ?? product.images[0];
  const activeSrc = activeImage?.src || activeImage?.thumbnail || '';

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
            value: customization.position
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase()),
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
        image: product.images[0]?.thumbnail || product.images[0]?.src || '',
        price: unitPrice,
        quantity,
        attributes,
        customization:
          customization.enabled && !isGifts
            ? {
                enabled: true,
                choice: customization.blockingType,
                position: customization.position,
                fileName: customization.logoFile?.name,
              }
            : undefined,
        categorySlugs: product.categories.map((c) => c.slug),
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16"
      style={{ backgroundColor: '#ffffff', color: '#1F2124' }}
    >
      {/* Left: gallery — match WP product image column */}
      <div>
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ aspectRatio: '1 / 1', backgroundColor: '#f7f7f7' }}
        >
          {activeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeSrc}
              alt={activeImage?.alt || product.name}
              referrerPolicy="no-referrer"
              fetchPriority="high"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: 16,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>

        {product.images.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {product.images.map((img, index) => {
              const thumb = img.thumbnail || img.src;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded border"
                  style={{
                    borderColor: index === activeImageIndex ? '#1F2124' : '#e5e5e5',
                    backgroundColor: '#f7f7f7',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb}
                    alt={img.alt || product.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: 4,
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: details — match WP Abbey PDP column */}
      <div style={{ backgroundColor: '#ffffff' }}>
        <h1
          className="text-2xl lg:text-[32px] font-bold leading-tight mb-2"
          style={{ color: '#1F2124' }}
        >
          {product.name}
        </h1>
        <p className="text-sm mb-6" style={{ color: '#666666' }}>
          SKU: {product.sku}
        </p>

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
            <p className="text-3xl font-bold mb-4" style={{ color: '#1F2124' }}>
              {formatGBP(basePrice)}
            </p>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-20 h-[50px] text-lg border rounded-lg text-center mr-4"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-6">
          {!isGifts && (
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1) setQuantity(val);
              }}
              className="w-[80px] h-[52px] text-lg border border-gray-300 rounded-[10px] text-center"
              style={{ color: '#1F2124', backgroundColor: '#ffffff' }}
            />
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className="h-[52px] px-9 text-lg font-bold rounded-xl text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: '#7b5bc6' }}
          >
            {isAdding ? 'Adding...' : 'Add to Basket'}
          </button>
        </div>

        {!isGifts && tiers.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <th className="text-left py-3 font-semibold" style={{ color: '#1F2124' }}>
                    Product Quantity
                  </th>
                  <th className="text-left py-3 font-semibold" style={{ color: '#1F2124' }}>
                    Price per Unit
                  </th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.min} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td className="py-2.5" style={{ color: '#444' }}>
                      {tier.max ? `${tier.min} - ${tier.max}` : `${tier.min}+`}
                    </td>
                    <td className="py-2.5 font-medium" style={{ color: '#1F2124' }}>
                      {formatGBP(tier.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {product.short_description && (
          <div
            className="mt-8 leading-relaxed prose prose-sm max-w-none"
            style={{ color: '#555555' }}
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}

        {product.attributes.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-3" style={{ color: '#1F2124' }}>
              Additional information
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {product.attributes.map((attr) => (
                  <tr key={attr.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td className="py-2 font-medium" style={{ color: '#444' }}>
                      {attr.name}
                    </td>
                    <td className="py-2" style={{ color: '#666' }}>
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
            <h3 className="text-lg font-bold mb-3" style={{ color: '#1F2124' }}>
              Description
            </h3>
            <div
              className="leading-relaxed prose prose-sm max-w-none"
              style={{ color: '#555555' }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
