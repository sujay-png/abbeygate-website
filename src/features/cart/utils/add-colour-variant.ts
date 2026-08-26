import type { CartItem, CartColourOption } from '../context/CartContext';
import { composeProof, BrandingSpec, ProofGeometry } from '@/features/products/utils/generate-proof';

type CartActions = {
  insertItemAfter: (afterKey: string, item: Omit<CartItem, 'key'> & { key?: string }) => Promise<string>;
  updateItem: (key: string, patch: Partial<CartItem>) => Promise<void>;
};

export async function addColourVariant(
  source: CartItem,
  option: CartColourOption,
  cart: CartActions,
  onInserted?: () => void
) {
  // 1. insert pending item
  const newKey = await cart.insertItemAfter(source.key, {
    ...source,
    key: undefined,
    productId: option.productId,
    slug: option.slug,
    name: option.productName,
    image: option.imageSrc || '',
    colour: { name: option.name, slug: option.slug, hex: option.hex },
    colourGroupId: source.colourGroupId ?? source.key,
    colourOptions: source.colourOptions,
    quantity: source.quantity,
    attributes: source.attributes,
    customization: source.customization ? {
      ...source.customization,
      fullPreviewUrl: undefined,
      imageBounds: undefined,
      leftPercent: undefined,
      topPercent: undefined,
      widthPercent: undefined,
    } : undefined,
    proofStatus: 'pending',
  });

  // 2. close picker immediately
  onInserted?.();

  // 3. compose proof in background
  if (!option.imageSrc || !source.customization?.logoPreviewUrl || !source.proofGeometry) {
    cart.updateItem(newKey, { proofStatus: 'failed' });
    return;
  }

  const branding: BrandingSpec = {
    blockingType: source.customization.choice || '',
    foilColor: source.customization.foilColor,
    cornerEdges: source.customization.cornerEdges,
    positionLabel: source.customization.positionLabel || 'center',
    logoScale: source.customization.logoScale ?? 1,
    logoPreviewUrl: source.customization.logoPreviewUrl,
  };

  try {
    const proof = await composeProof({
      productImageUrl: option.imageSrc,
      branding,
      geometry: source.proofGeometry,
    });
    
    if (proof) {
      cart.updateItem(newKey, {
        proofStatus: 'ready',
        customization: { 
          ...source.customization, 
          ...proof,
          imageBounds: proof.imageBounds === null ? undefined : proof.imageBounds,
        },
      });
    } else {
      cart.updateItem(newKey, { proofStatus: 'failed' });
    }
  } catch (e) {
    console.error('Colour variant proof failed', e);
    cart.updateItem(newKey, { proofStatus: 'failed' });
  }
}

export async function retryProof(item: CartItem, updateItem: CartActions['updateItem']) {
  if (!item.image || !item.customization?.logoPreviewUrl || !item.proofGeometry) {
    return;
  }
  
  await updateItem(item.key, { proofStatus: 'pending' });

  const branding: BrandingSpec = {
    blockingType: item.customization.choice || '',
    foilColor: item.customization.foilColor,
    cornerEdges: item.customization.cornerEdges,
    positionLabel: item.customization.positionLabel || 'center',
    logoScale: item.customization.logoScale ?? 1,
    logoPreviewUrl: item.customization.logoPreviewUrl,
  };

  try {
    const proof = await composeProof({
      productImageUrl: item.image,
      branding,
      geometry: item.proofGeometry,
    });
    
    if (proof) {
      await updateItem(item.key, {
        proofStatus: 'ready',
        customization: { 
          ...item.customization, 
          ...proof,
          imageBounds: proof.imageBounds === null ? undefined : proof.imageBounds,
        },
      });
    } else {
      await updateItem(item.key, { proofStatus: 'failed' });
    }
  } catch (e) {
    console.error('Colour variant proof retry failed', e);
    await updateItem(item.key, { proofStatus: 'failed' });
  }
}
