'use client';

import { useCallback, useState, useEffect } from 'react';
import type { StoreProduct, PriceTier } from '../types/store-product';
import { ProductCustomizer, type CustomizationState } from './ProductCustomizer';
import { useCart } from '@/features/cart/context/CartContext';
import { CUSTOMIZATION_MIN_QTY, formatGBP, isGiftsProduct } from '../utils/pricing';
import { TrustIndicators } from '@/components/home/TrustIndicators';
import { Send, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import type { CustomTab } from '@/features/products/services/store-products';

export type ColorVariant = {
  name: string;
  slug: string;
  hex: string;
};

type ProductDetailClientProps = {
  product: StoreProduct;
  tiers: PriceTier[];
  basePrice: number;
  colorVariants?: ColorVariant[];
  customTabs?: CustomTab[];
};

export const ProductDetailClient = ({
  product,
  tiers,
  basePrice,
  colorVariants = [],
  customTabs = [],
}: ProductDetailClientProps) => {
  const { addItem } = useCart();
  const isGifts = isGiftsProduct(product);
  const [quantity, setQuantity] = useState(isGifts ? 1 : CUSTOMIZATION_MIN_QTY);
  const [unitPrice, setUnitPrice] = useState(basePrice);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Additional information');
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

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  // Close preview on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPreviewOpen(false);
    };
    if (isPreviewOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isPreviewOpen]);

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
      {/* Left: gallery */}
      <div>
        <div
          className="relative w-full overflow-hidden rounded-xl border border-gray-100 group cursor-zoom-in"
          style={{ aspectRatio: '1 / 1', backgroundColor: '#ffffff' }}
          onClick={() => setIsPreviewOpen(true)}
        >
          {activeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeSrc}
              alt={activeImage?.alt || product.name}
              referrerPolicy="no-referrer"
              fetchPriority="high"
              className="transition-transform duration-300 group-hover:scale-105"
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
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {product.images.map((img, index) => {
              const thumb = img.thumbnail || img.src;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    index === activeImageIndex ? 'border-black' : 'border-transparent hover:border-gray-200'
                  }`}
                  style={{ backgroundColor: '#f9f9f9' }}
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
        {/* Available Colours Section */}
        {colorVariants.length > 0 && (
          <div className="mt-8 flex items-center gap-4">
            <span className="text-sm font-semibold text-[#1F2124]">Available Colours</span>
            <div className="flex items-center gap-3">
              {colorVariants.map((color) => {
                const isActive = product.slug === color.slug;
                return (
                  <Link
                    key={color.slug}
                    href={`/product/${color.slug}`}
                    title={color.name}
                    className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 ${
                      isActive ? 'border-2 border-black scale-110' : 'border border-gray-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
          <button 
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-50"
          >
            <X className="w-6 h-6 text-black" />
          </button>
          
          {product.images.length > 1 && (
            <>
              <button 
                onClick={handlePrevImage}
                className="absolute left-6 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-50"
              >
                <ChevronLeft className="w-6 h-6 text-black" />
              </button>
              <button 
                onClick={handleNextImage}
                className="absolute right-6 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-50"
              >
                <ChevronRight className="w-6 h-6 text-black" />
              </button>
            </>
          )}

          <div className="relative w-[90vw] h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage?.src || activeSrc}
              alt={activeImage?.alt || product.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Right: details */}
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
            className="mt-8 leading-relaxed prose prose-sm max-w-none text-[#555555]"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}

        {/* Bespoke Enquiry Section */}
        <div className="mt-8">
          <p className="text-[#1F2124] mb-4 text-[15px] font-medium">
            If you'd like a more bespoke look to your product, get in touch with our Team, we can advise, inspire or just give you a quote.
          </p>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[#d2e0de] hover:bg-[#b8d1ce] transition-colors border border-black rounded-md px-8 py-3 font-semibold text-black tracking-wide text-[15px] shadow-[0px_4px_15px_rgba(0,0,0,0.08)]">
            <Send className="w-4 h-4" />
            BESPOKE ORDER ENQUIRY
          </Link>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          {(() => {
            const allTabs = ['Additional information'];
            
            // Add native description if it exists and there isn't a custom tab for it
            const hasCustomDescription = customTabs.some(t => t.title.trim().toLowerCase() === 'description');
            if (product.description && !hasCustomDescription) {
              allTabs.push('Description');
            }
            
            // Add all custom tabs
            customTabs.forEach(t => {
              const title = t.title.trim();
              if (!allTabs.includes(title)) {
                allTabs.push(title);
              }
            });
            
            allTabs.push('Reviews (0)');
            
            const activeCustomTab = customTabs.find(t => t.title.trim() === activeTab);

            return (
              <>
                <div className="flex overflow-x-auto border-b border-gray-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-6">
                  {allTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[15px] font-semibold whitespace-nowrap transition-all duration-300 relative ${
                  activeTab === tab
                    ? 'text-black'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black rounded-t-md"></span>
                )}
              </button>
            ))}
          </div>
          
          <div className="py-8 min-h-[200px] animate-in fade-in duration-500">
            {activeTab === 'Additional information' && (
              product.attributes.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-[15px] text-left">
                    <tbody className="divide-y divide-gray-100">
                      {product.attributes.map((attr) => (
                        <tr key={attr.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-gray-900 w-1/3">
                            {attr.name}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {attr.terms.map((t) => t.name).join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No additional information available.</p>
              )
            )}

            {activeTab === 'Description' && !activeCustomTab && (
              product.description ? (
                <div
                  className="leading-relaxed prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-black hover:prose-a:text-gray-600"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-gray-500 italic">No description available.</p>
              )
            )}

            {activeCustomTab && (
              <div
                className="leading-relaxed prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-black hover:prose-a:text-gray-600"
                dangerouslySetInnerHTML={{ __html: activeCustomTab.content }}
              />
            )}

            {activeTab === 'Reviews (0)' && (
              <p className="text-gray-500 italic">Information for {activeTab} is not available.</p>
            )}
          </div>
              </>
            );
          })()}
        </div>

        {/* Icons Row */}
        <TrustIndicators compact={true} />
      </div>
    </div>
  );
};
