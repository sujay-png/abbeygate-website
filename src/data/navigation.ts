import { NavItem } from '@/types/navigation';

const NAV_ITEMS: NavItem[] = [
  {
    id: 'diaries',
    label: 'DIARIES',
    href: '/collection/diaries',
    megaMenu: {
      columns: [
        {
          id: 'diaries-main',
          links: [
            { id: 'pocket-diaries', label: 'Pocket Diaries', href: '/collection/diaries/pocket-diaries' },
            { id: 'a5-diaries', label: 'A5 Diaries', href: '/collection/diaries/a5-diaries' },
            { id: 'quarto-diaries', label: 'Quarto Diaries', href: '/collection/diaries/quarto-diaries' },
            { id: 'a4-diaries', label: 'A4 Diaries', href: '/collection/diaries/a4-diaries' },
            { id: 'real-leather-diaries', label: 'Real Leather Diaries', href: '/collection/diaries/real-leather-diaries' },
            { id: 'faux-leather-diaries', label: 'Faux Leather Diaries', href: '/collection/diaries/faux-leather-diaries' },
            { id: 'all-diaries', label: 'All Diaries', href: '/collection/diaries' },
          ],
        },
      ],
    },
  },
  {
    id: 'notebooks',
    label: 'NOTEBOOKS',
    href: '/collection/notebooks',
    megaMenu: {
      columns: [
        {
          id: 'notebooks-main',
          links: [
            { id: 'a5-notebooks', label: 'A5 Notebooks', href: '/collection/notebooks/a5-notebook' },
            { id: 'a6-notebooks', label: 'A6 Notebooks', href: '/collection/notebooks/a6-notebooks' },
            { id: 'real-leather-notebooks', label: 'Real Leather Notebooks', href: '/collection/notebooks/real-leather-notebooks' },
            { id: 'faux-leather-notebooks', label: 'Faux Leather Notebooks', href: '/collection/notebooks/faux-leather-notebooks' },
            { id: 'eco-friendly-notebooks', label: 'Eco Friendly Notebooks', href: '/collection/notebooks/eco-friendly-notebooks' },
            { id: 'all-notebooks', label: 'All Notebooks', href: '/collection/notebooks' },
          ],
        },
      ],
    },
  },
  {
    id: 'custom-gifts',
    label: 'CUSTOM GIFTS',
    href: '/collection/custom-gifts',
    megaMenu: {
      columns: [
        {
          id: 'travel',
          title: 'Travel',
          links: [
            { id: 'luggage-tags', label: 'Luggage Tags', href: '/collection/custom-gifts/luggage-tags' },
            { id: 'document-wallets', label: 'Document Wallets', href: '/collection/custom-gifts/document-wallets' },
            { id: 'passport-wallets', label: 'Passport Wallets', href: '/collection/custom-gifts/passport-wallets' },
            { id: 'zipped-travel-wallets', label: 'Zipped Travel Wallets', href: '/collection/custom-gifts/zipped-travel-wallets' },
            { id: 'cosmetic-bags', label: 'Cosmetic Bags', href: '/collection/custom-gifts/cosmetic-bags' },
            { id: 'wash-bags', label: 'Wash Bags', href: '/collection/custom-gifts/wash-bags' },
          ],
        },
        {
          id: 'hospitality',
          title: 'Hospitality',
          links: [
            { id: 'bill-holder', label: 'Bill Holder', href: '/collection/custom-gifts/bill-holder' },
            { id: 'menu-holders', label: 'Menu Holders', href: '/collection/custom-gifts/menu-holders' },
            { id: 'coasters', label: 'Coasters', href: '/collection/custom-gifts/coasters' },
          ],
        },
        {
          id: 'accessories',
          title: 'Accessories',
          links: [
            { id: 'card-holders', label: 'Card Holders', href: '/collection/custom-gifts/card-holders' },
            { id: 'keyrings', label: 'Keyrings', href: '/collection/custom-gifts/keyrings' },
            { id: 'pocket-wallets', label: 'Pocket Wallets', href: '/collection/custom-gifts/pocket-wallets' },
            { id: 'pens', label: 'Pens', href: '/collection/custom-gifts/pens' },
            { id: 'all-gifts', label: 'All Gifts', href: '/collection/custom-gifts/all' },
          ],
        },
      ],
    },
  },
  {
    id: 'our-collection',
    label: 'OUR COLLECTIONS',
    href: '/collection',
    megaMenu: {
      columns: [
        {
          id: 'collection-main',
          links: [
            { id: 'chelsea', label: 'Chelsea', href: '/collection/chelsea' },
            { id: 'dorchester', label: 'Dorchester', href: '/collection/dorchester' },
            { id: 'harrogate', label: 'Harrogate', href: '/collection/harrogate' },
            { id: 'lewes', label: 'Lewes', href: '/collection/lewes' },
            { id: 'richmond', label: 'Richmond', href: '/collection/richmond' },
            { id: 'windsor', label: 'Windsor', href: '/collection/windsor' },
            { id: 'conscious', label: 'Conscious', href: '/collection/conscious' },
            { id: 'all-collections', label: 'All Collections', href: '/collection/all' },
          ],
        },
      ],
    },
  },
  {
    id: 'bespoke',
    label: 'BESPOKE',
    href: '/bespoke/personalisation',
    megaMenu: {
      columns: [
        {
          id: 'personalisation',
          title: 'Personalisation',
          href: '/bespoke/personalisation',
          links: [
            { id: 'blocking-foiling', label: 'Blocking & Foiling', href: '/bespoke/personalisation#blocking-foiling' },
            { id: 'uv-printing', label: 'UV Printing', href: '/bespoke/personalisation#uv-printing' },
            { id: 'graphic-print', label: 'Graphic Print', href: '/bespoke/personalisation#graphic-print' },
            { id: 'special-matter-pages', label: 'Special Matter Pages', href: '/bespoke/personalisation#special-matter-pages' },
          ],
        },
        {
          id: 'additional-finishing',
          title: 'Additional Finishing',
          href: '/bespoke/additional-finishing',
          links: [
            { id: 'ribbon', label: 'Ribbon Markers', href: '/bespoke/additional-finishing#ribbon' },
            { id: 'pen-loops', label: 'Pen Loops & Elastic Closures', href: '/bespoke/additional-finishing#pen-loops' },
            { id: 'decorative-corner-protectors', label: 'Decorative Corner Protectors', href: '/bespoke/additional-finishing#decorative-corner-protectors' },
            { id: 'gilded-page-edges', label: 'Gilded Page Edges', href: '/bespoke/additional-finishing#gilded-page-edges' },
          ],
        },
        {
          id: 'portfolio',
          title: 'Portfolio',
          href: '/bespoke/portfolio',
          links: [
            { id: 'view-portfolio', label: 'Our Latest Work', href: '/bespoke/portfolio' },
          ], 
        },
      ],
    },
  },
];


export async function getNavigationData(): Promise<NavItem[]> {
  return NAV_ITEMS;
}

export { NAV_ITEMS };
