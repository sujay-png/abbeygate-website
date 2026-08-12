import fetch from 'node-fetch'; // or global fetch in Node 18+

async function run() {
  const url = 'https://corporate.abbeygate-england.com/wp-json/wc/v3/products?slug=richmond-finegrain-pocket-week-to-view-dark-blue';
  
  const ck = 'ck_27c8d325a1c4d34cdbeaba79429ebe8488945597';
  const cs = 'cs_28aa2fc16ebd504b3c8e7e1f249b810bc729c728';
  
  const response = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(ck + ':' + cs).toString('base64')
    }
  });
  
  const data = await response.json();
  const product = data[0];

  if (!product) {
    console.log("Product not found");
    return;
  }

  console.log("Meta Data:");
  product.meta_data.forEach((meta: any) => {
    // Custom tabs plugins usually store data in meta keys like 'yikes_woo_products_tabs' or similar
    if (typeof meta.value === 'string' && meta.value.includes('Special Feature') || meta.key.includes('tab')) {
      console.log(`Key: ${meta.key}`);
      console.log(`Value:`, meta.value);
    } else if (meta.key.includes('yikes') || meta.key.includes('custom_tab')) {
      console.log(`Key: ${meta.key}`);
      console.log(`Value:`, meta.value);
    }
  });
  
  // Just log all keys to see what's there
  console.log("All meta keys:", product.meta_data.map((m: any) => m.key).join(', '));
}

run();
