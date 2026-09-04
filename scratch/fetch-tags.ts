import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { woocommerceApi } from '../src/lib/woocommerce/client';

async function main() {
  try {
    const tags = await woocommerceApi.request<any[]>('/products/tags', { params: { search: 'best-seller' } });
    console.log('Found tags:', tags.map(t => ({ id: t.id, name: t.name, slug: t.slug })));
  } catch (err) {
    console.error(err);
  }
}

main();
