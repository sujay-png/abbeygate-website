import { CartItem } from '../context/CartContext';
import { composeProof } from '@/features/products/utils/generate-proof';

export const propagateAmendToGroup = async (
  sourceKey: string,
  newCustomization: NonNullable<CartItem['customization']>,
  items: CartItem[],
  updateItem: (key: string, updates: Partial<CartItem>) => Promise<void>
) => {
  const sourceItem = items.find(i => i.key === sourceKey);
  if (!sourceItem) return;

  const groupId = sourceItem.colourGroupId ?? sourceItem.key;
  
  // Find siblings in the group
  const siblings = items.filter(i => 
    i.key !== sourceKey && 
    (i.colourGroupId === groupId || i.key === groupId)
  );

  for (const sibling of siblings) {
    // 1. Copy color-independent branding spec and set proofStatus to pending
    const siblingCustomization: NonNullable<CartItem['customization']> = {
      ...newCustomization,
      // Clear derived fields that will be regenerated
      leftPercent: undefined,
      topPercent: undefined,
      widthPercent: undefined,
      fullPreviewUrl: undefined,
      imageBounds: undefined,
    };

    const newAttributes = sibling.attributes?.filter(a => !['Custom Logo', 'Blocking', 'Foil Colour', 'Logo', 'Corner Edges', 'Logo Scale'].includes(a.name)) || [];
    newAttributes.push({ name: 'Custom Logo', value: '' });
    if (newCustomization.choice) {
      newAttributes.push({ name: 'Blocking', value: newCustomization.choice.replace(' blocked', '') });
    }
    if (newCustomization.choice === 'Foil blocked' && newCustomization.foilColor) {
      newAttributes.push({ name: 'Foil Colour', value: newCustomization.foilColor });
    }
    if (newCustomization.fileName) {
      newAttributes.push({ name: 'Logo', value: newCustomization.fileName });
    }
    if (newCustomization.cornerEdges && newCustomization.cornerEdges !== 'None') {
      newAttributes.push({ name: 'Corner Edges', value: newCustomization.cornerEdges });
    }

    await updateItem(sibling.key, {
      customization: siblingCustomization,
      attributes: newAttributes,
      proofStatus: 'pending'
    });

    try {
      // 2. Re-run composeProof against sibling's own image
      const proof = newCustomization.logoPreviewUrl ? await composeProof({
        productImageUrl: sibling.image,
        branding: {
          blockingType: newCustomization.choice,
          foilColor: newCustomization.foilColor,
          cornerEdges: newCustomization.cornerEdges,
          positionLabel: newCustomization.positionLabel || 'center',
          logoScale: newCustomization.logoScale ?? 1,
          logoPreviewUrl: newCustomization.logoPreviewUrl,
        },
        geometry: sibling.proofGeometry || {
          widthMm: 100,
          heightMm: 150,
          isDiary: true,
          isCurved: false
        }
      }) : null;

      await updateItem(sibling.key, {
        customization: {
          ...siblingCustomization,
          ...(proof ? proof : {}),
          imageBounds: proof?.imageBounds || undefined
        },
        proofStatus: proof ? 'ready' : (newCustomization.logoPreviewUrl ? 'failed' : undefined)
      });
    } catch (e) {
      console.error(`Failed to propagate amend to sibling ${sibling.key}:`, e);
      await updateItem(sibling.key, { proofStatus: 'failed' });
    }
  }
};
