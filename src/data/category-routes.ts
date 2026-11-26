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
  seoDescription?: string;
  description?: string;
  filterConfig?: FilterConfig;
  fallbackExcludeCategoryIds?: {
    parentCategoryId: number;
    excludeCategoryIds: number[];
  };
};

export const CATEGORY_ROUTES: CategoryRoute[] = [
  {
    "path": "/collection/diaries",
    "categoryId": 18,
    "title": "All Diaries",
    "seoTitle": "Business Diaries, Corporate Diaries | Abbeygate Business",
    "seoDescription": "Business diaries & corporate diaries in real and faux leather, customised to suit. Personalise with your brand logo.",
    "description": "Discover Abbeygate's extensive collection of premium diaries. From compact pocket diaries to professional desk sizes, our high-quality diaries are designed to keep you organized in style. Customize with your corporate logo for the perfect branded business gift."
  },
  {
    "path": "/diaries",
    "categoryId": 18,
    "title": "All Diaries",
    "seoTitle": "Business Diaries, Corporate Diaries | Abbeygate Business",
    "seoDescription": "Business diaries & corporate diaries in real and faux leather, customised to suit. Personalise with your brand logo.",
    "description": "Discover Abbeygate's extensive collection of premium diaries. From compact pocket diaries to professional desk sizes, our high-quality diaries are designed to keep you organized in style. Customize with your corporate logo for the perfect branded business gift."
  },
  {
    "path": "/collection/diaries/pocket-diaries",
    "categoryId": 39,
    "title": "Pocket Diaries",
    "seoTitle": "Small Diaries, Pocket Diaries, Small Pocket Diary | Abbeygate Business",
    "seoDescription": "Small diaries, pocket diaries & small pocket diary options for business gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/pocket",
    "categoryId": 39,
    "title": "Pocket Diaries",
    "seoTitle": "Small Diaries, Pocket Diaries, Small Pocket Diary | Abbeygate Business",
    "seoDescription": "Small diaries, pocket diaries & small pocket diary options for business gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/a5-diaries",
    "categoryId": 164,
    "title": "A5 Diaries",
    "seoTitle": "A5 Business Diaries | Abbeygate Business",
    "seoDescription": "A5 business diaries in real & faux leather, customised for corporate use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/a5",
    "categoryId": 164,
    "title": "A5 Diaries",
    "seoTitle": "A5 Business Diaries | Abbeygate Business",
    "seoDescription": "A5 business diaries in real & faux leather, customised for corporate use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/quarto-diaries",
    "categoryId": 170,
    "title": "Quarto Diaries",
    "seoTitle": "Desk Diaries, Quarto Diaries | Abbeygate Business",
    "seoDescription": "Desk diaries & quarto diaries for the office, customised for corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/quarto",
    "categoryId": 170,
    "title": "Quarto Diaries",
    "seoTitle": "Desk Diaries, Quarto Diaries | Abbeygate Business",
    "seoDescription": "Desk diaries & quarto diaries for the office, customised for corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/a4-diaries",
    "categoryId": 172,
    "title": "A4 Diaries",
    "seoTitle": "A4 Business Diaries | Abbeygate Business",
    "seoDescription": "A4 business diaries in real & faux leather, customised for corporate use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/a4",
    "categoryId": 172,
    "title": "A4 Diaries",
    "seoTitle": "A4 Business Diaries | Abbeygate Business",
    "seoDescription": "A4 business diaries in real & faux leather, customised for corporate use. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/real-leather-diaries",
    "categoryId": 43,
    "title": "Real Leather Diaries",
    "seoTitle": "Leather Diaries, Personalised Diaries | Abbeygate Business",
    "seoDescription": "Leather diaries & personalised diaries, expertly made for business and corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/real-leather",
    "categoryId": 43,
    "title": "Real Leather Diaries",
    "seoTitle": "Leather Diaries, Personalised Diaries | Abbeygate Business",
    "seoDescription": "Leather diaries & personalised diaries, expertly made for business and corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/diaries/faux-leather-diaries",
    "categoryId": 44,
    "title": "Faux Leather Diaries",
    "seoTitle": "Faux Leather Business Diaries | Abbeygate Business",
    "seoDescription": "Faux leather business diaries, customised for corporate gifting and daily use. Personalise with your brand logo.",
    "fallbackExcludeCategoryIds": {
      "parentCategoryId": 18,
      "excludeCategoryIds": [43]
    },
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/diaries/faux-leather",
    "categoryId": 44,
    "title": "Faux Leather Diaries",
    "seoTitle": "Faux Leather Business Diaries | Abbeygate Business",
    "seoDescription": "Faux leather business diaries, customised for corporate gifting and daily use. Personalise with your brand logo.",
    "fallbackExcludeCategoryIds": {
      "parentCategoryId": 18,
      "excludeCategoryIds": [43]
    },
    "filterConfig": {
      "disableSize": true
    }
  },
  {
    "path": "/collection/notebooks",
    "categoryId": 17,
    "title": "All Notebooks",
    "seoTitle": "Branded Notebooks, Personalised Notebooks | Abbeygate Business",
    "seoDescription": "Branded notebooks & personalised notebooks for business and corporate gifting. Personalise with your brand logo.",
    "description": "Explore Abbeygate's versatile collection of premium notebooks. Whether you need a compact pocket companion or a spacious desk notebook, our collection offers superior quality and durability. Enhance your corporate gifting by personalizing our notebooks with your brand's unique logo or design."
  },
  {
    "path": "/notebooks",
    "categoryId": 17,
    "title": "All Notebooks",
    "seoTitle": "Branded Notebooks, Personalised Notebooks | Abbeygate Business",
    "seoDescription": "Branded notebooks & personalised notebooks for business and corporate gifting. Personalise with your brand logo.",
    "description": "Explore Abbeygate's versatile collection of premium notebooks. Whether you need a compact pocket companion or a spacious desk notebook, our collection offers superior quality and durability. Enhance your corporate gifting by personalizing our notebooks with your brand's unique logo or design."
  },
  {
    "path": "/collection/notebooks/a5-notebook",
    "categoryId": 19,
    "title": "A5 Desk",
    "seoTitle": "A5 Diaries, Desk Diaries | Abbeygate Business",
    "seoDescription": "A5 diaries & desk diaries for the office, customised for business use. Personalise with your brand logo.",
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
    "seoDescription": "A5 diaries & desk diaries for the office, customised for business use. Personalise with your brand logo.",
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
    "seoDescription": "Small notebooks & pocket notebooks, a practical corporate gift. Personalise with your brand logo.",
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
    "seoDescription": "Small notebooks & pocket notebooks, a practical corporate gift. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/collection/notebooks/real-leather-notebooks",
    "categoryId": "47,160",
    "title": "Leather Notebooks",
    "seoTitle": "Leather Notebooks, Business Notebooks | Abbeygate Business",
    "seoDescription": "Leather notebooks & business notebooks, expertly made and customised to suit. Personalise with your brand logo.",
    "filterConfig": {
      "disableLayout": true,
      "disableSize": true
    }
  },
  {
    "path": "/notebooks/real-leather",
    "categoryId": "47,160",
    "title": "Leather Notebooks",
    "seoTitle": "Leather Notebooks, Business Notebooks | Abbeygate Business",
    "seoDescription": "Leather notebooks & business notebooks, expertly made and customised to suit. Personalise with your brand logo.",
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
    "seoDescription": "Faux leather notebooks & branded notebooks for business and corporate gifting. Personalise with your brand logo.",
    "fallbackExcludeCategoryIds": {
      "parentCategoryId": 17,
      "excludeCategoryIds": [47, 160, 173]
    },
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
    "seoDescription": "Faux leather notebooks & branded notebooks for business and corporate gifting. Personalise with your brand logo.",
    "fallbackExcludeCategoryIds": {
      "parentCategoryId": 17,
      "excludeCategoryIds": [47, 160, 173]
    },
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
    "seoDescription": "Eco friendly notebooks for sustainable corporate gifting and business use. Personalise with your brand logo.",
    "description": "Eco Notebooks are a modern and eco-conscious promotional gift, offering your customers a sustainable way to showcase their brand every day of the year. Thoughtfully crafted from environmentally responsible materials, they not only reflect quality and care but also promote your commitment to a greener future. Each design can be tailored to suit individual branding requirements, ensuring a unique and professional finish. Let us help you create an eco-friendly notebook your customers will value and proudly use—enhancing brand awareness while supporting sustainability year after year.",
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
    "seoDescription": "Eco friendly notebooks for sustainable corporate gifting and business use. Personalise with your brand logo.",
    "description": "Eco Notebooks are a modern and eco-conscious promotional gift, offering your customers a sustainable way to showcase their brand every day of the year. Thoughtfully crafted from environmentally responsible materials, they not only reflect quality and care but also promote your commitment to a greener future. Each design can be tailored to suit individual branding requirements, ensuring a unique and professional finish. Let us help you create an eco-friendly notebook your customers will value and proudly use—enhancing brand awareness while supporting sustainability year after year.",
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
    "seoDescription": "Corporate gifts & custom gifts, expertly made leather goods for clients and staff. Personalise with your brand logo.",
    "description": "Make a lasting impression with Abbeygate's exquisite range of custom business gifts. From elegant travel wallets to sophisticated card holders, our collection is perfect for client appreciation, employee rewards, and promotional events. Add your bespoke branding for a truly memorable gifting experience."
  },
  {
    "path": "/custom-gifts",
    "categoryId": "176,126",
    "title": "Custom Gifts",
    "seoTitle": "Corporate Gifts, Custom Gifts| Abbeygate Business",
    "seoDescription": "Corporate gifts & custom gifts, expertly made leather goods for clients and staff. Personalise with your brand logo.",
    "description": "Make a lasting impression with Abbeygate's exquisite range of custom business gifts. From elegant travel wallets to sophisticated card holders, our collection is perfect for client appreciation, employee rewards, and promotional events. Add your bespoke branding for a truly memorable gifting experience."
  },
  {
    "path": "/collection/custom-gifts/luggage-tags",
    "categoryId": "182,144",
    "title": "Luggage Tags",
    "seoTitle": "Business Gifts, Luggage Tags | Abbeygate Business",
    "seoDescription": "Business gifts & leather luggage tags for corporate gifting and travel merchandise. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/luggage-tags",
    "categoryId": "182,144",
    "title": "Luggage Tags",
    "seoTitle": "Business Gifts, Luggage Tags | Abbeygate Business",
    "seoDescription": "Business gifts & leather luggage tags for corporate gifting and travel merchandise. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/card-holders",
    "categoryId": "178,152",
    "title": "Card Holders",
    "seoTitle": "Leather Card Holders | Abbeygate Business",
    "seoDescription": "Leather card holders for business and corporate gifting, finished with your logo. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/card-holders",
    "categoryId": "178,152",
    "title": "Card Holders",
    "seoTitle": "Leather Card Holders | Abbeygate Business",
    "seoDescription": "Leather card holders for business and corporate gifting, finished with your logo. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/keyrings",
    "categoryId": "183,149",
    "title": "Keyrings",
    "seoTitle": "Leather Keyrings, Personalised Keyrings | Abbeygate Business",
    "seoDescription": "Leather keyrings & personalised keyrings, a small business gift with big impact. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/keyrings",
    "categoryId": "183,149",
    "title": "Keyrings",
    "seoTitle": "Leather Keyrings, Personalised Keyrings | Abbeygate Business",
    "seoDescription": "Leather keyrings & personalised keyrings, a small business gift with big impact. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/travel-gifts",
    "categoryId": 177,
    "title": "Travel Gifts",
    "seoTitle": "Travel Gifts, Business Gifts | Abbeygate Business",
    "seoDescription": "Travel gifts & business gifts in leather, ideal for corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/travel-gifts",
    "categoryId": 177,
    "title": "Travel Gifts",
    "seoTitle": "Travel Gifts, Business Gifts | Abbeygate Business",
    "seoDescription": "Travel gifts & business gifts in leather, ideal for corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/leather-gifts",
    "categoryId": 179,
    "title": "Leather Gifts",
    "seoTitle": "Leather Business Gifts, Corporate Gifts | Abbeygate Business",
    "seoDescription": "Leather business gifts & corporate gifts, expertly crafted and customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/leather-gifts",
    "categoryId": 179,
    "title": "Leather Gifts",
    "seoTitle": "Leather Business Gifts, Corporate Gifts | Abbeygate Business",
    "seoDescription": "Leather business gifts & corporate gifts, expertly crafted and customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/passport-wallets",
    "categoryId": 181,
    "title": "Passport Wallets",
    "seoTitle": "Business Gifts, Passport Wallets | Abbeygate Business",
    "seoDescription": "Business gifts & leather passport wallets, ideal for corporate gifting and travel. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/passport-wallets",
    "categoryId": 181,
    "title": "Passport Wallets",
    "seoTitle": "Business Gifts, Passport Wallets | Abbeygate Business",
    "seoDescription": "Business gifts & leather passport wallets, ideal for corporate gifting and travel. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/pocket-wallets",
    "categoryId": 153,
    "title": "Pocket Wallets",
    "seoTitle": "Business Gifts, Pocket Wallets | Abbeygate Business",
    "seoDescription": "Business gifts & leather pocket wallets, expertly made and customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/pocket-wallets",
    "categoryId": 153,
    "title": "Pocket Wallets",
    "seoTitle": "Business Gifts, Pocket Wallets | Abbeygate Business",
    "seoDescription": "Business gifts & leather pocket wallets, expertly made and customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/document-wallets",
    "categoryId": 990126,
    "title": "Document Wallets",
    "seoTitle": "Leather Document Wallets | Abbeygate Business",
    "seoDescription": "Leather document wallets for business and corporate gifting, customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/document-wallets",
    "categoryId": 990126,
    "title": "Document Wallets",
    "seoTitle": "Leather Document Wallets | Abbeygate Business",
    "seoDescription": "Leather document wallets for business and corporate gifting, customised to suit. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/zipped-travel-wallets",
    "categoryId": 990128,
    "title": "Zipped Travel Wallets",
    "seoTitle": "Business Gifts, Travel Wallets | Abbeygate Business",
    "seoDescription": "Business gifts & leather travel wallets, customised for corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/zipped-travel-wallets",
    "categoryId": 990128,
    "title": "Zipped Travel Wallets",
    "seoTitle": "Business Gifts, Travel Wallets | Abbeygate Business",
    "seoDescription": "Business gifts & leather travel wallets, customised for corporate gifting. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/cosmetic-bags",
    "categoryId": 990129,
    "title": "Cosmetic Bags",
    "seoTitle": "Leather Cosmetic Bags | Abbeygate Business",
    "seoDescription": "Leather cosmetic bags for corporate gifts and branded merchandise. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/cosmetic-bags",
    "categoryId": 990129,
    "title": "Cosmetic Bags",
    "seoTitle": "Leather Cosmetic Bags | Abbeygate Business",
    "seoDescription": "Leather cosmetic bags for corporate gifts and branded merchandise. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/wash-bags",
    "categoryId": 990130,
    "title": "Wash Bags",
    "seoTitle": "Leather Gifts, Wash Bags | Abbeygate Business",
    "seoDescription": "Leather gifts & wash bags for corporate gifting and branded merchandise. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/wash-bags",
    "categoryId": 990130,
    "title": "Wash Bags",
    "seoTitle": "Leather Gifts, Wash Bags | Abbeygate Business",
    "seoDescription": "Leather gifts & wash bags for corporate gifting and branded merchandise. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/bill-holder",
    "categoryId": 990131,
    "title": "Bill Holder",
    "seoTitle": "Branded Leather Bill Holders | Abbeygate Business",
    "seoDescription": "Branded leather bill holders for restaurants, hotels and hospitality, customised to your brand. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/bill-holder",
    "categoryId": 990131,
    "title": "Bill Holder",
    "seoTitle": "Branded Leather Bill Holders | Abbeygate Business",
    "seoDescription": "Branded leather bill holders for restaurants, hotels and hospitality, customised to your brand. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/menu-holders",
    "categoryId": 990132,
    "title": "Menu Holders",
    "seoTitle": "Menu Holders, Menu Covers | Abbeygate Business",
    "seoDescription": "Leather menu holders & menu covers for restaurants, hotels and venues. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/menu-holders",
    "categoryId": 990132,
    "title": "Menu Holders",
    "seoTitle": "Menu Holders, Menu Covers | Abbeygate Business",
    "seoDescription": "Leather menu holders & menu covers for restaurants, hotels and venues. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/coasters",
    "categoryId": 990133,
    "title": "Coasters",
    "seoTitle": "Personalised Coasters | Abbeygate Business",
    "seoDescription": "Personalised coasters for corporate gifting, hospitality and events. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/coasters",
    "categoryId": 990133,
    "title": "Coasters",
    "seoTitle": "Personalised Coasters | Abbeygate Business",
    "seoDescription": "Personalised coasters for corporate gifting, hospitality and events. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/pens",
    "categoryId": 990134,
    "title": "Pens",
    "seoTitle": "Personalised Pens, Branded Pens | Abbeygate Business",
    "seoDescription": "Personalised pens & branded pens, a practical corporate gift for clients and staff. Personalise with your brand logo."
  },
  {
    "path": "/custom-gifts/pens",
    "categoryId": 990134,
    "title": "Pens",
    "seoTitle": "Personalised Pens, Branded Pens | Abbeygate Business",
    "seoDescription": "Personalised pens & branded pens, a practical corporate gift for clients and staff. Personalise with your brand logo."
  },
  {
    "path": "/collection/custom-gifts/all",
    "categoryId": "176,126",
    "title": "All Gifts",
    "seoTitle": "Custom Gifts, Branded Gifts | Abbeygate Business",
    "seoDescription": "Custom & branded gifts in leather, ideal for corporate gifting and events. Personalise with your brand logo.",
    "description": "Make a lasting impression with Abbeygate's exquisite range of custom business gifts. From elegant travel wallets to sophisticated card holders, our collection is perfect for client appreciation, employee rewards, and promotional events. Add your bespoke branding for a truly memorable gifting experience."
  },
  {
    "path": "/custom-gifts/all",
    "categoryId": "176,126",
    "title": "All Gifts",
    "seoTitle": "Custom Gifts, Branded Gifts | Abbeygate Business",
    "seoDescription": "Custom & branded gifts in leather, ideal for corporate gifting and events. Personalise with your brand logo.",
    "description": "Make a lasting impression with Abbeygate's exquisite range of custom business gifts. From elegant travel wallets to sophisticated card holders, our collection is perfect for client appreciation, employee rewards, and promotional events. Add your bespoke branding for a truly memorable gifting experience."
  },
  {
    "path": "/collection",
    "categoryId": "49,50,51,52,53,54,55,140",
    "title": "Our Collections",
    "seoTitle": "Business Diary & Notebook Collections | Abbeygate Business",
    "seoDescription": "Real & faux leather diaries, notebooks & business gifts customised and personalised with your brand logo.",
    "description": "Discover the full Abbeygate collection, featuring our complete range of premium diaries, notebooks, and travel accessories. From the eco-conscious materials of our Conscious Collection to the timeless elegance of the Dorchester and Chelsea ranges, our entire selection is crafted with meticulous attention to detail. Explore our comprehensive range to find the perfect companion for your personal and professional needs."
  },
  {
    "path": "/collection/chelsea",
    "categoryId": 49,
    "title": "Chelsea Collection",
    "seoTitle": "Chelsea Collection Diaries & Notebooks | Abbeygate Business",
    "seoDescription": "Explore the Chelsea Collection of business diaries & notebooks, made to be customised. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/dorchester",
    "categoryId": 50,
    "title": "Dorchester Collection",
    "seoTitle": "Dorchester Collection Diaries & Notebooks  | Abbeygate Business",
    "seoDescription": "Discover the Dorchester Collection of business diaries & notebooks, ready to be customised. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/harrogate",
    "categoryId": 51,
    "title": "Harrogate Collection",
    "seoTitle": "Harrogate Collection Diaries & Notebooks  | Abbeygate Business",
    "seoDescription": "Browse the Harrogate Collection of diaries & notebooks for corporate gifting and business use. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/lewes",
    "categoryId": 52,
    "title": "Lewes Collection",
    "seoTitle": "Lewes Collection Diaries & Notebooks  | Abbeygate Business",
    "seoDescription": "Shop the Lewes Collection of business diaries & notebooks, customised to suit your brand. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/richmond",
    "categoryId": 53,
    "title": "Richmond Collection",
    "seoTitle": "Richmond Collection Diaries & Notebooks  | Abbeygate Business",
    "seoDescription": "Explore the Richmond Collection of diaries & notebooks for businesses and corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/windsor",
    "categoryId": 140,
    "title": "Windsor Collection",
    "seoTitle": "Windsor Collection Diaries & Notebooks  | Abbeygate Business",
    "seoDescription": "Discover the Windsor Collection of business diaries & notebooks, made to be customised. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/conscious",
    "categoryId": 55,
    "title": "Conscious Collection",
    "seoTitle": "Conscious Collection Eco Friendly Notebooks  | Abbeygate Business",
    "seoDescription": "Eco friendly notebooks from the Conscious Collection, ideal for sustainable corporate gifting. Personalise with your brand logo.",
    "filterConfig": {
      "disableCollection": true
    }
  },
  {
    "path": "/collection/best-sellers",
    "categoryId": 159,
    "title": "Best Sellers",
    "seoTitle": "Best Sellers | Abbeygate Business",
    "seoDescription": "Discover Abbeygate Business's best selling personalised diaries, notebooks, and corporate leather gifts. Personalise with your brand logo."
  },
  {
    "path": "/collection/all",
    "categoryId": "49,50,51,52,53,54,55,140",
    "title": "All Collections",
    "seoTitle": "All Diary, Notebook & Business Gifts Collections | Abbeygate Business",
    "seoDescription": "Discover the full Abbeygate collection, featuring our complete range of premium diaries, notebooks, and travel accessories. Personalise with your brand logo & customised to suit.",
    "description": "Discover the full Abbeygate collection, featuring our complete range of premium diaries, notebooks, and travel accessories. From the eco-conscious materials of our Conscious Collection to the timeless elegance of the Dorchester and Chelsea ranges, our entire selection is crafted with meticulous attention to detail. Explore our comprehensive range to find the perfect companion for your personal and professional needs."
  }
];

export function getCategoryRoute(path: string): CategoryRoute | undefined {
  const normalized = path.replace(/\/$/, "") || "/";
  return CATEGORY_ROUTES.find((route) => route.path === normalized);
}

export function getFilterConfigForPath(path: string): FilterConfig {
  const route = getCategoryRoute(path);
  const pathLower = path.toLowerCase();

  const NAMED_COLLECTIONS = ["chelsea", "dorchester", "harrogate", "lewes", "richmond", "conscious", "windsor"];
  const isSpecificNamedCollection = NAMED_COLLECTIONS.some((term) => pathLower.includes(term));

  // Disable collection filtering only when inside a specific named collection (not /collection/diaries, /collection/notebooks, etc.).
  const disableCollection = isSpecificNamedCollection;

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

  const isCollectionShowcase =
    pathLower === "/collection" ||
    pathLower === "/collection/all" ||
    pathLower === "/collection/best-sellers" ||
    isSpecificNamedCollection;
  const disableProductType = !pathLower.includes("custom-gifts") && !isCollectionShowcase;

  const dynamicConfig = { disableCollection, disableLayout, disableSize, disableProductType };

  if (route?.filterConfig) {
    return { ...dynamicConfig, ...route.filterConfig };
  }

  return dynamicConfig;
}

/**
 * Generates Next.js `generateStaticParams` tuples for an optional catch-all `[[...slug]]`
 * route sharing `basePrefix` (e.g. '/collection', '/diaries', '/notebooks', '/custom-gifts').
 */
export function getStaticCategoryParams(basePrefix: string): { slug?: string[] }[] {
  const normalizedPrefix = basePrefix.replace(/\/+$/, '');
  const seen = new Set<string>();
  const params: { slug?: string[] }[] = [];

  for (const route of CATEGORY_ROUTES) {
    if (route.path === normalizedPrefix || route.path.startsWith(`${normalizedPrefix}/`)) {
      const remainder = route.path.slice(normalizedPrefix.length).replace(/^\/+/, '');
      const slug = remainder ? remainder.split('/').filter(Boolean) : [];
      const key = slug.join('/');
      if (!seen.has(key)) {
        seen.add(key);
        params.push({ slug });
      }
    }
  }

  return params;
}
