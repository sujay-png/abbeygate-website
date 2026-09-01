/** Maps Next.js shop routes to WooCommerce category IDs. */

export type FilterConfig = {
  disableCollection?: boolean;
  disableLayout?: boolean;
  disableSize?: boolean;
};

export type CategoryRoute = {
  path: string;
  categoryId: number;
  title: string;
  description?: string;
  filterConfig?: FilterConfig;
};

export const CATEGORY_ROUTES: CategoryRoute[] = [
  // Diaries
  { 
    path: "/diaries", 
    categoryId: 18, 
    title: "All Diaries",
    
  },
  { 
    path: "/diaries/pocket", 
    categoryId: 39, 
    title: "Pocket Diaries", 

    filterConfig: { disableSize: true } 
  },
  { 
    path: "/diaries/a5", 
    categoryId: 40, 
    title: "A5 Diaries", 
    
    filterConfig: { disableSize: true } 
  },
  { 
    path: "/diaries/quarto", 
    categoryId: 41, 
    title: "Quarto Diary", 
    
    filterConfig: { disableSize: true } 
  },
  { 
    path: "/diaries/a4", 
    categoryId: 42, 
    title: "A4 Diaries", 
    
    filterConfig: { disableSize: true } 
  },
  { 
    path: "/diaries/real-leather", 
    categoryId: 43, 
    title: "Real Leather Diaries", 
    
    filterConfig: { disableSize: true } 
  },
  { 
    path: "/diaries/faux-leather", 
    categoryId: 44, 
    title: "Faux Leather Diaries", 
    
    filterConfig: { disableSize: true } 
  },


  // Notebooks
  { 
    path: "/notebooks", 
    categoryId: 17, 
    title: "All Notebooks", 

  },
  { 
    path: "/notebooks/a5", 
    categoryId: 19, 
    title: "A5 Desk", 
    
    filterConfig: { disableLayout: true, disableSize: true } 
  },
  { 
    path: "/notebooks/a6", 
    categoryId: 45, 
    title: "A6 Pocket Notebooks", 
    
    filterConfig: { disableLayout: true, disableSize: true } 
  },
  { 
    path: "/notebooks/real-leather", 
    categoryId: 47, 
    title: "Leather Notebooks", 
    
    filterConfig: { disableLayout: true, disableSize: true } 
  },
  { 
    path: "/notebooks/faux-leather", 
    categoryId: 48, 
    title: "Faux Leather Notebooks", 

    filterConfig: { disableLayout: true, disableSize: true } 
  },
  { 
    path: "/notebooks/eco-friendly", 
    categoryId: 46, 
    title: "Eco", 
    
    filterConfig: { disableLayout: true, disableSize: true } 
  },

  // Custom Gifts
  { path: "/custom-gifts", categoryId: 126, title: "Custom Gifts" },
  { path: "/custom-gifts/luggage-tags", categoryId: 144, title: "Luggage Tags" },
  { path: "/custom-gifts/card-holders", categoryId: 152, title: "Card Holders" },
  { path: "/custom-gifts/keyrings", categoryId: 149, title: "Keyrings" },
  { path: "/custom-gifts/pocket-wallets", categoryId: 153, title: "Pocket Wallets" },
  { path: "/custom-gifts/document-wallets", categoryId: 126, title: "Document Wallets" },
  { path: "/custom-gifts/passport-wallets", categoryId: 126, title: "Passport Wallets" },
  { path: "/custom-gifts/zipped-travel-wallets", categoryId: 126, title: "Zipped Travel Wallets" },
  { path: "/custom-gifts/cosmetic-bags", categoryId: 126, title: "Cosmetic Bags" },
  { path: "/custom-gifts/wash-bags", categoryId: 126, title: "Wash Bags" },
  { path: "/custom-gifts/bill-holder", categoryId: 126, title: "Bill Holder" },
  { path: "/custom-gifts/menu-holders", categoryId: 126, title: "Menu Holders" },
  { path: "/custom-gifts/coasters", categoryId: 126, title: "Coasters" },
  { path: "/custom-gifts/pens", categoryId: 126, title: "Pens" },
  { path: "/custom-gifts/all", categoryId: 126, title: "All Gifts" },

  // Collections
  { path: "/collection", categoryId: 49, title: "Our Collection", filterConfig: { disableCollection: true } },
  { path: "/collection/chelsea", categoryId: 49, title: "Chelsea Collection", filterConfig: { disableCollection: true } },
  { path: "/collection/dorchester", categoryId: 50, title: "Dorchester Collection", filterConfig: { disableCollection: true } },
  { path: "/collection/harrogate", categoryId: 51, title: "Harrogate Collection", filterConfig: { disableCollection: true } },
  { path: "/collection/lewes", categoryId: 52, title: "Lewes Collection", filterConfig: { disableCollection: true } },
  { path: "/collection/richmond", categoryId: 53, title: "Richmond Collection", filterConfig: { disableCollection: true } },
  { path: "/collection/windsor", categoryId: 140, title: "Windsor Collection",  filterConfig: { disableCollection: true } },
  { path: "/collection/conscious", categoryId: 55, title: "Conscious Collection", filterConfig: { disableCollection: true } },
  { path: "/collection/all", categoryId: 49, title: "All Collections", filterConfig: { disableCollection: true } },
];

export function getCategoryRoute(path: string): CategoryRoute | undefined {
  const normalized = path.replace(/\/$/, "") || "/";
  return CATEGORY_ROUTES.find((route) => route.path === normalized);
}

export function getFilterConfigForPath(path: string): FilterConfig {
  const route = getCategoryRoute(path);
  if (route?.filterConfig) return route.filterConfig;

  const pathLower = path.toLowerCase();

  const disableCollection = ["collection", "chelsea", "dorchester", "harrogate", "lewes", "richmond", "conscious", "windsor"].some(
    (term) => pathLower.includes(term),
  );

  let disableLayout = pathLower.includes("notebook");
  let disableSize = pathLower.includes("notebook");

  const specificDiaries = ["pocket", "a5-diar", "a4-diar", "quarto", "real-leather-diar", "faux-leather-diar"];
  if (specificDiaries.some((term) => pathLower.includes(term))) {
    disableSize = true;
  }

  if (pathLower.includes("all-diaries") || pathLower === "/diaries") {
    disableSize = false;
  }
  if (pathLower.includes("all-notebooks") || pathLower === "/notebooks") {
    disableSize = false;
  }

  return { disableCollection, disableLayout, disableSize };
}
