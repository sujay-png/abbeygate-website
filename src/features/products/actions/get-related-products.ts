'use server';

import { getStoreProducts } from "@/features/products/services/store-products";
import type { StoreProduct } from "@/features/products/types/store-product";

export async function getRelatedProductsAction({ 
  categoryId, 
  currentProductId, 
  currentProductName, 
  currentColor 
}: { 
  categoryId?: number; 
  currentProductId?: number; 
  currentProductName?: string; 
  currentColor?: string; 
}): Promise<StoreProduct[]> {
  try {
    const res = await getStoreProducts({ categoryId, perPage: 60 });
    
    const getProductType = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('notebook')) return 'notebook';
      if (lower.includes('diary')) return 'diary';
      if (lower.includes('key fob') || lower.includes('keyring')) return 'keyfob';
      if (lower.includes('luggage tag')) return 'luggagetag';
      if (lower.includes('card holder')) return 'cardholder';
      if (lower.includes('passport')) return 'passport';
      if (lower.includes('wallet')) return 'wallet';
      if (lower.includes('case')) return 'case';
      return '';
    };

    const currentType = currentProductName ? getProductType(currentProductName) : '';
    let currentBaseName = '';
    if (currentProductName) {
      currentBaseName = currentProductName.split(',')[0].trim();
    }

    const allProducts = res.products.filter(p => {
      if (p.id === currentProductId) return false;
      if (currentType && getProductType(p.name) === currentType) return false;
      if (currentBaseName) {
        const pBaseName = p.name.split(',')[0].trim();
        if (pBaseName.toLowerCase() === currentBaseName.toLowerCase()) return false;
      }
      return true;
    });
    
    const getBroadColor = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('blue') || lower.includes('navy') || lower.includes('teal')) return 'blue';
      if (lower.includes('red') || lower.includes('burgundy') || lower.includes('pink') || lower.includes('rose')) return 'red';
      if (lower.includes('green') || lower.includes('sage')) return 'green';
      if (lower.includes('black') || lower.includes('charcoal')) return 'black';
      if (lower.includes('brown') || lower.includes('tan') || lower.includes('mustard')) return 'brown';
      if (lower.includes('grey') || lower.includes('gray') || lower.includes('silver')) return 'grey';
      return '';
    };

    const targetBroadColor = currentColor ? getBroadColor(currentColor) : '';

    let colorFilteredProducts = allProducts;
    if (targetBroadColor) {
      colorFilteredProducts = allProducts.filter(p => getBroadColor(p.name) === targetBroadColor);
    }

    const selected: typeof allProducts = [];
    const groupCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    
    const MAX_PER_GROUP = 1;
    const MAX_PER_TYPE = 1;
    const MAX_TOTAL = 5;

    for (const p of colorFilteredProducts) {
      if (selected.length >= MAX_TOTAL) break;
      const baseName = p.name.split(',')[0].trim();
      const pType = getProductType(p.name);
      
      const count = groupCounts.get(baseName) || 0;
      const tCount = pType ? (typeCounts.get(pType) || 0) : 0;
      
      if (count < MAX_PER_GROUP && (!pType || tCount < MAX_PER_TYPE)) {
        selected.push(p);
        groupCounts.set(baseName, count + 1);
        if (pType) typeCounts.set(pType, tCount + 1);
      }
    }

    if (selected.length < MAX_TOTAL) {
      const fallbackRes = await getStoreProducts({ perPage: 80 });
      let fallbackProducts = fallbackRes.products.filter(p => {
        if (p.id === currentProductId) return false;
        if (currentType && getProductType(p.name) === currentType) return false;
        if (currentBaseName) {
          const pBaseName = p.name.split(',')[0].trim();
          if (pBaseName.toLowerCase() === currentBaseName.toLowerCase()) return false;
        }
        return true;
      });

      if (targetBroadColor) {
        fallbackProducts = fallbackProducts.filter(p => getBroadColor(p.name) === targetBroadColor);
      }

      for (const p of fallbackProducts) {
        if (selected.length >= MAX_TOTAL) break;
        const baseName = p.name.split(',')[0].trim();
        const pType = getProductType(p.name);
        
        const count = groupCounts.get(baseName) || 0;
        const tCount = pType ? (typeCounts.get(pType) || 0) : 0;
        
        if (count < MAX_PER_GROUP && (!pType || tCount < MAX_PER_TYPE)) {
          selected.push(p);
          groupCounts.set(baseName, count + 1);
          if (pType) typeCounts.set(pType, tCount + 1);
        }
      }
    }

    return selected;
  } catch (error) {
    console.error("Failed to fetch related products:", error);
    return [];
  }
}
