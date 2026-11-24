/** Maps Next.js shop routes to WooCommerce category IDs. */

export type FilterConfig = {
  disableCollection?: boolean;
  disableLayout?: boolean;
  disableSize?: boolean;
  disableProductType?: boolean;
};

export type CategoryRoute = {
  path: string;
  categoryId: number | string;
  title: string;
  seoTitle?: string;
  description?: string;
  filterConfig?: FilterConfig;
};

export const CATEGORY_ROUTES: CategoryRoute[] = [
  {
    "path": "/collection/diaries",
    "categoryId": 18,
    "title": "All Diaries",
    "seoTitle": "Business Diaries, Corporate Diaries | Abbeygate Business",
    "description": "Business diaries & corporate diaries in real and faux leather, customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/diaries",
    "categoryId": 18,
    "title": "All Diaries",
    "seoTitle": "Business Diaries, Corporate Diaries | Abbeygate Business",
    "description": "Business diaries & corporate diaries in real and faux leather, customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/collection/diaries/pocket-diaries",
    "categoryId": 39,
    "title": "Pocket Diaries",
    "seoTitle": "Small Diaries, Pocket Diaries, Small Pocket Diary | Abbeygate Business",
    "description": "Small diaries, pocket diaries & small pocket diary options for business gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/pocket",
    "categoryId": 39,
    "title": "Pocket Diaries",
    "seoTitle": "Small Diaries, Pocket Diaries, Small Pocket Diary | Abbeygate Business",
    "description": "Small diaries, pocket diaries & small pocket diary options for business gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/a5-diaries",
    "categoryId": 164,
    "title": "A5 Diaries",
    "seoTitle": "A5 Business Diaries | Abbeygate Business",
    "description": "A5 business diaries in real & faux leather, customised for corporate use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/a5",
    "categoryId": 164,
    "title": "A5 Diaries",
    "seoTitle": "A5 Business Diaries | Abbeygate Business",
    "description": "A5 business diaries in real & faux leather, customised for corporate use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/quarto-diaries",
    "categoryId": 170,
    "title": "Quarto Diaries",
    "seoTitle": "Desk Diaries, Quarto Diaries | Abbeygate Business",
    "description": "Desk diaries & quarto diaries for the office, customised for corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/quarto",
    "categoryId": 170,
    "title": "Quarto Diaries",
    "seoTitle": "Desk Diaries, Quarto Diaries | Abbeygate Business",
    "description": "Desk diaries & quarto diaries for the office, customised for corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/a4-diaries",
    "categoryId": 172,
    "title": "A4 Diaries",
    "seoTitle": "A4 Business Diaries | Abbeygate Business",
    "description": "A4 business diaries in real & faux leather, customised for corporate use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/a4",
    "categoryId": 172,
    "title": "A4 Diaries",
    "seoTitle": "A4 Business Diaries | Abbeygate Business",
    "description": "A4 business diaries in real & faux leather, customised for corporate use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/real-leather-diaries",
    "categoryId": 43,
    "title": "Real Leather Diaries",
    "seoTitle": "Leather Diaries, Personalised Diaries | Abbeygate Business",
    "description": "Leather diaries & personalised diaries, expertly made for business and corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/real-leather",
    "categoryId": 43,
    "title": "Real Leather Diaries",
    "seoTitle": "Leather Diaries, Personalised Diaries | Abbeygate Business",
    "description": "Leather diaries & personalised diaries, expertly made for business and corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/faux-leather-diaries",
    "categoryId": 44,
    "title": "Faux Leather Diaries",
    "seoTitle": "Faux Leather Business Diaries | Abbeygate Business",
    "description": "Faux leather business diaries, customised for corporate gifting and daily use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/faux-leather",
    "categoryId": 44,
    "title": "Faux Leather Diaries",
    "seoTitle": "Faux Leather Business Diaries | Abbeygate Business",
    "description": "Faux leather business diaries, customised for corporate gifting and daily use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/notebooks",
    "categoryId": 17,
    "title": "All Notebooks",
    "seoTitle": "Branded Notebooks, Personalised Notebooks | Abbeygate Business",
    "description": "Branded notebooks & personalised notebooks for business and corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/notebooks",
    "categoryId": 17,
    "title": "All Notebooks",
    "seoTitle": "Branded Notebooks, Personalised Notebooks | Abbeygate Business",
    "description": "Branded notebooks & personalised notebooks for business and corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/collection/notebooks/a5-notebook",
    "categoryId": 19,
    "title": "A5 Desk",
    "seoTitle": "A5 Diaries, Desk Diaries | Abbeygate Business",
    "description": "A5 diaries & desk diaries for the office, customised for business use. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/notebooks/a5",
    "categoryId": 19,
    "title": "A5 Desk",
    "seoTitle": "A5 Diaries, Desk Diaries | Abbeygate Business",
    "description": "A5 diaries & desk diaries for the office, customised for business use. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/collection/notebooks/a6-notebooks",
    "categoryId": 45,
    "title": "A6 Pocket Notebooks",
    "seoTitle": "Small Notebooks, Pocket Notebooks | Abbeygate Business",
    "description": "Small notebooks & pocket notebooks, a practical corporate gift. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/notebooks/a6",
    "categoryId": 45,
    "title": "A6 Pocket Notebooks",
    "seoTitle": "Small Notebooks, Pocket Notebooks | Abbeygate Business",
    "description": "Small notebooks & pocket notebooks, a practical corporate gift. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/collection/notebooks/real-leather-notebooks",
    "categoryId": 47,
    "title": "Leather Notebooks",
    "seoTitle": "Leather Notebooks, Business Notebooks | Abbeygate Business",
    "description": "Leather notebooks & business notebooks, expertly made and customised to suit. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/notebooks/real-leather",
    "categoryId": 47,
    "title": "Leather Notebooks",
    "seoTitle": "Leather Notebooks, Business Notebooks | Abbeygate Business",
    "description": "Leather notebooks & business notebooks, expertly made and customised to suit. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/collection/notebooks/faux-leather-notebooks",
    "categoryId": 48,
    "title": "Faux Leather Notebooks",
    "seoTitle": "Faux Leather Notebooks, Branded Notebooks | Abbeygate Business",
    "description": "Faux leather notebooks & branded notebooks for business and corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/notebooks/faux-leather",
    "categoryId": 48,
    "title": "Faux Leather Notebooks",
    "seoTitle": "Faux Leather Notebooks, Branded Notebooks | Abbeygate Business",
    "description": "Faux leather notebooks & branded notebooks for business and corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/collection/notebooks/eco-friendly-notebooks",
    "categoryId": 173,
    "title": "Eco Friendly Notebooks",
    "seoTitle": "Eco Friendly Notebooks | Abbeygate Business",
    "description": "Eco friendly notebooks for sustainable corporate gifting and business use. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/notebooks/eco-friendly",
    "categoryId": 173,
    "title": "Eco Friendly Notebooks",
    "seoTitle": "Eco Friendly Notebooks | Abbeygate Business",
    "description": "Eco friendly notebooks for sustainable corporate gifting and business use. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/collection/custom-gifts",
    "categoryId": "176,126",
    "title": "Custom Gifts",
    "seoTitle": "Corporate Gifts, Custom Gifts| Abbeygate Business",
    "description": "Corporate gifts & custom gifts, expertly made leather goods for clients and staff. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts",
    "categoryId": "176,126",
    "title": "Custom Gifts",
    "seoTitle": "Corporate Gifts, Custom Gifts| Abbeygate Business",
    "description": "Corporate gifts & custom gifts, expertly made leather goods for clients and staff. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/luggage-tags",
    "categoryId": "182,144",
    "title": "Luggage Tags",
    "seoTitle": "Business Gifts, Luggage Tags | Abbeygate Business",
    "description": "Business gifts & leather luggage tags for corporate gifting and travel merchandise. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/luggage-tags",
    "categoryId": "182,144",
    "title": "Luggage Tags",
    "seoTitle": "Business Gifts, Luggage Tags | Abbeygate Business",
    "description": "Business gifts & leather luggage tags for corporate gifting and travel merchandise. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/card-holders",
    "categoryId": "178,152",
    "title": "Card Holders",
    "seoTitle": "Leather Card Holders | Abbeygate Business",
    "description": "Leather card holders for business and corporate gifting, finished with your logo. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/card-holders",
    "categoryId": "178,152",
    "title": "Card Holders",
    "seoTitle": "Leather Card Holders | Abbeygate Business",
    "description": "Leather card holders for business and corporate gifting, finished with your logo. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/keyrings",
    "categoryId": "183,149",
    "title": "Keyrings",
    "seoTitle": "Leather Keyrings, Personalised Keyrings | Abbeygate Business",
    "description": "Leather keyrings & personalised keyrings, a small business gift with big impact. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/keyrings",
    "categoryId": "183,149",
    "title": "Keyrings",
    "seoTitle": "Leather Keyrings, Personalised Keyrings | Abbeygate Business",
    "description": "Leather keyrings & personalised keyrings, a small business gift with big impact. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/travel-gifts",
    "categoryId": 177,
    "title": "Travel Gifts",
    "seoTitle": "Travel Gifts, Business Gifts | Abbeygate Business",
    "description": "Travel gifts & business gifts in leather, ideal for corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/travel-gifts",
    "categoryId": 177,
    "title": "Travel Gifts",
    "seoTitle": "Travel Gifts, Business Gifts | Abbeygate Business",
    "description": "Travel gifts & business gifts in leather, ideal for corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/leather-gifts",
    "categoryId": 179,
    "title": "Leather Gifts",
    "seoTitle": "Leather Business Gifts, Corporate Gifts | Abbeygate Business",
    "description": "Leather business gifts & corporate gifts, expertly crafted and customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/leather-gifts",
    "categoryId": 179,
    "title": "Leather Gifts",
    "seoTitle": "Leather Business Gifts, Corporate Gifts | Abbeygate Business",
    "description": "Leather business gifts & corporate gifts, expertly crafted and customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/passport-wallets",
    "categoryId": 181,
    "title": "Passport Wallets",
    "seoTitle": "Business Gifts, Passport Wallets | Abbeygate Business",
    "description": "Business gifts & leather passport wallets, ideal for corporate gifting and travel. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/passport-wallets",
    "categoryId": 181,
    "title": "Passport Wallets",
    "seoTitle": "Business Gifts, Passport Wallets | Abbeygate Business",
    "description": "Business gifts & leather passport wallets, ideal for corporate gifting and travel. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/pocket-wallets",
    "categoryId": 153,
    "title": "Pocket Wallets",
    "seoTitle": "Business Gifts, Pocket Wallets | Abbeygate Business",
    "description": "Business gifts & leather pocket wallets, expertly made and customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/pocket-wallets",
    "categoryId": 153,
    "title": "Pocket Wallets",
    "seoTitle": "Business Gifts, Pocket Wallets | Abbeygate Business",
    "description": "Business gifts & leather pocket wallets, expertly made and customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/document-wallets",
    "categoryId": 990126,
    "title": "Document Wallets",
    "seoTitle": "Leather Document Wallets | Abbeygate Business",
    "description": "Leather document wallets for business and corporate gifting, customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/document-wallets",
    "categoryId": 990126,
    "title": "Document Wallets",
    "seoTitle": "Leather Document Wallets | Abbeygate Business",
    "description": "Leather document wallets for business and corporate gifting, customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/zipped-travel-wallets",
    "categoryId": 990128,
    "title": "Zipped Travel Wallets",
    "seoTitle": "Business Gifts, Travel Wallets | Abbeygate Business",
    "description": "Business gifts & leather travel wallets, customised for corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/zipped-travel-wallets",
    "categoryId": 990128,
    "title": "Zipped Travel Wallets",
    "seoTitle": "Business Gifts, Travel Wallets | Abbeygate Business",
    "description": "Business gifts & leather travel wallets, customised for corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/cosmetic-bags",
    "categoryId": 990129,
    "title": "Cosmetic Bags",
    "seoTitle": "Leather Cosmetic Bags | Abbeygate Business",
    "description": "Leather cosmetic bags for corporate gifts and branded merchandise. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/cosmetic-bags",
    "categoryId": 990129,
    "title": "Cosmetic Bags",
    "seoTitle": "Leather Cosmetic Bags | Abbeygate Business",
    "description": "Leather cosmetic bags for corporate gifts and branded merchandise. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/wash-bags",
    "categoryId": 990130,
    "title": "Wash Bags",
    "seoTitle": "Leather Gifts, Wash Bags | Abbeygate Business",
    "description": "Leather gifts & wash bags for corporate gifting and branded merchandise. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/wash-bags",
    "categoryId": 990130,
    "title": "Wash Bags",
    "seoTitle": "Leather Gifts, Wash Bags | Abbeygate Business",
    "description": "Leather gifts & wash bags for corporate gifting and branded merchandise. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/bill-holder",
    "categoryId": 990131,
    "title": "Bill Holder",
    "seoTitle": "Branded Leather Bill Holders | Abbeygate Business",
    "description": "Branded leather bill holders for restaurants, hotels and hospitality, customised to your brand. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/bill-holder",
    "categoryId": 990131,
    "title": "Bill Holder",
    "seoTitle": "Branded Leather Bill Holders | Abbeygate Business",
    "description": "Branded leather bill holders for restaurants, hotels and hospitality, customised to your brand. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/menu-holders",
    "categoryId": 990132,
    "title": "Menu Holders",
    "seoTitle": "Menu Holders, Menu Covers | Abbeygate Business",
    "description": "Leather menu holders & menu covers for restaurants, hotels and venues. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/menu-holders",
    "categoryId": 990132,
    "title": "Menu Holders",
    "seoTitle": "Menu Holders, Menu Covers | Abbeygate Business",
    "description": "Leather menu holders & menu covers for restaurants, hotels and venues. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/coasters",
    "categoryId": 990133,
    "title": "Coasters",
    "seoTitle": "Personalised Coasters | Abbeygate Business",
    "description": "Personalised coasters for corporate gifting, hospitality and events. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/coasters",
    "categoryId": 990133,
    "title": "Coasters",
    "seoTitle": "Personalised Coasters | Abbeygate Business",
    "description": "Personalised coasters for corporate gifting, hospitality and events. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/pens",
    "categoryId": 990134,
    "title": "Pens",
    "seoTitle": "Personalised Pens, Branded Pens | Abbeygate Business",
    "description": "Personalised pens & branded pens, a practical corporate gift for clients and staff. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/pens",
    "categoryId": 990134,
    "title": "Pens",
    "seoTitle": "Personalised Pens, Branded Pens | Abbeygate Business",
    "description": "Personalised pens & branded pens, a practical corporate gift for clients and staff. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/all",
    "categoryId": "176,126",
    "title": "All Gifts",
    "seoTitle": "Custom Gifts, Branded Gifts | Abbeygate Business",
    "description": "Custom & branded gifts in leather, ideal for corporate gifting and events. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/all",
    "categoryId": "176,126",
    "title": "All Gifts",
    "seoTitle": "Custom Gifts, Branded Gifts | Abbeygate Business",
    "description": "Custom & branded gifts in leather, ideal for corporate gifting and events. Personalise with your brand logo."
  },
  {
    "path": "/collection",
    "categoryId": "49,50,51,52,53,54,55,140",
    "title": "Our Collections",
    "seoTitle": "Business Diary & Notebook Collections | Abbeygate Business",
    "description": "Real & faux leather diaries, notebooks & business gifts customised and personalised with your brand logo."
  },
  {
    "path": "/collection/chelsea",
    "categoryId": 49,
    "title": "Chelsea Collection",
    "seoTitle": "Chelsea Collection Diaries & Notebooks | Abbeygate Business",
    "description": "Explore the Chelsea Collection of business diaries & notebooks, made to be customised. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/dorchester",
    "categoryId": 50,
    "title": "Dorchester Collection",
    "seoTitle": "Dorchester Collection Diaries & Notebooks  | Abbeygate Business",
    "description": "Discover the Dorchester Collection of business diaries & notebooks, ready to be customised. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/harrogate",
    "categoryId": 51,
    "title": "Harrogate Collection",
    "seoTitle": "Harrogate Collection Diaries & Notebooks  | Abbeygate Business",
    "description": "Browse the Harrogate Collection of diaries & notebooks for corporate gifting and business use. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/lewes",
    "categoryId": 52,
    "title": "Lewes Collection",
    "seoTitle": "Lewes Collection Diaries & Notebooks  | Abbeygate Business",
    "description": "Shop the Lewes Collection of business diaries & notebooks, customised to suit your brand. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/richmond",
    "categoryId": 53,
    "title": "Richmond Collection",
    "seoTitle": "Richmond Collection Diaries & Notebooks  | Abbeygate Business",
    "description": "Explore the Richmond Collection of diaries & notebooks for businesses and corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/windsor",
    "categoryId": 140,
    "title": "Windsor Collection",
    "seoTitle": "Windsor Collection Diaries & Notebooks  | Abbeygate Business",
    "description": "Discover the Windsor Collection of business diaries & notebooks, made to be customised. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/conscious",
    "categoryId": 55,
    "title": "Conscious Collection",
    "seoTitle": "Conscious Collection Eco Friendly Notebooks  | Abbeygate Business",
    "description": "Eco friendly notebooks from the Conscious Collection, ideal for sustainable corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/all",
    "categoryId": "49,50,51,52,53,54,55,140",
    "title": "All Collections",
    "seoTitle": "All Diary, Notebook & Business Gifts Collections | Abbeygate Business",
    "description": "Discover the full Abbeygate collection, featuring our complete range of premium diaries, notebooks, and travel accessories. Personalise with your brand logo & customised to suit."
  }
];

export function getCategoryRoute(path: string): CategoryRoute | undefined {
  const normalized = path.replace(/\/$/, "") || "/";
  return CATEGORY_ROUTES.find((route) => route.path === normalized);
}

export function getFilterConfigForPath(path: string): FilterConfig {
  const route = getCategoryRoute(path);
  const pathLower = path.toLowerCase();

  // Disable collection filtering only if we are inside a specific sub-collection, not the root /collection or /collection/all page.
  const isRootCollection = pathLower === "/collection" || pathLower === "/collection/all";
  const disableCollection = !isRootCollection && ["collection", "chelsea", "dorchester", "harrogate", "lewes", "richmond", "conscious", "windsor"].some(
    (term) => pathLower.includes(term),
  );

  let disableLayout = pathLower.includes("notebook");
  let disableSize = pathLower.includes("notebook");

  const specificDiaries = ["pocket", "a5-diar", "a4-diar", "quarto", "real-leather-diar", "faux-leather-diar"];
  if (specificDiaries.some((term) => pathLower.includes(term))) {
    disableSize = true;
  }

  if (pathLower.includes("custom-gifts")) {
    disableSize = true;
    disableLayout = true;
  }

  if (pathLower.includes("all-diaries") || pathLower === "/diaries" || pathLower === "/collection/diaries") {
    disableSize = false;
  }
  if (pathLower.includes("all-notebooks") || pathLower === "/notebooks" || pathLower === "/collection/notebooks") {
    disableSize = false;
  }

  const disableProductType = !pathLower.includes("custom-gifts") && !pathLower.includes("collection");

  const dynamicConfig = { disableCollection, disableLayout, disableSize, disableProductType };

  if (route?.filterConfig) {
    return { ...dynamicConfig, ...route.filterConfig };
  }

  return dynamicConfig;
}
