import { NavItem } from '@/types/navigation';

const NAV_ITEMS: NavItem[] = [
  {
    id: 'diaries',
    label: 'DIARIES',
    href: '/diaries',
    megaMenu: {
      columns: [
        {
          id: 'diaries-main',
          links: [
            { id: 'pocket-diaries', label: 'Pocket Diaries', href: '/diaries/pocket' },
            { id: 'a5-diaries', label: 'A5 Diaries', href: '/diaries/a5' },
            { id: 'quarto-diaries', label: 'Quarto Diaries', href: '/diaries/quarto' },
            { id: 'a4-diaries', label: 'A4 Diaries', href: '/diaries/a4' },
            { id: 'real-leather-diaries', label: 'Real Leather Diaries', href: '/diaries/real-leather' },
            { id: 'faux-leather-diaries', label: 'Faux Leather Diaries', href: '/diaries/faux-leather' },
            { id: 'all-diaries', label: 'All Diaries', href: '/diaries' },
          ],
        },
      ],
    },
  },
  {
    id: 'notebooks',
    label: 'NOTEBOOKS',
    href: '/notebooks',
    megaMenu: {
      columns: [
        {
          id: 'notebooks-main',
          links: [
            { id: 'a5-notebooks', label: 'A5 Notebooks', href: '/notebooks/a5' },
            { id: 'a6-notebooks', label: 'A6 Notebooks', href: '/notebooks/a6' },
            { id: 'real-leather-notebooks', label: 'Real Leather Notebooks', href: '/notebooks/real-leather' },
            { id: 'faux-leather-notebooks', label: 'Faux Leather Notebooks', href: '/notebooks/faux-leather' },
            { id: 'eco-friendly-notebooks', label: 'Eco Friendly Notebooks', href: '/notebooks/eco-friendly' },
            { id: 'all-notebooks', label: 'All Notebooks', href: '/notebooks' },
          ],
        },
      ],
    },
  },
  {
    id: 'custom-gifts',
    label: 'CUSTOM GIFTS',
    href: '/custom-gifts',
    megaMenu: {
      columns: [
        {
          id: 'travel',
          title: 'Travel',
          links: [
            { id: 'luggage-tags', label: 'Luggage Tags', href: '/custom-gifts/luggage-tags' },
            { id: 'document-wallets', label: 'Document Wallets', href: '/custom-gifts/document-wallets' },
            { id: 'passport-wallets', label: 'Passport Wallets', href: '/custom-gifts/passport-wallets' },
            { id: 'zipped-travel-wallets', label: 'Zipped Travel Wallets', href: '/custom-gifts/zipped-travel-wallets' },
            { id: 'cosmetic-bags', label: 'Cosmetic Bags', href: '/custom-gifts/cosmetic-bags' },
            { id: 'wash-bags', label: 'Wash Bags', href: '/custom-gifts/wash-bags' },
          ],
        },
        {
          id: 'hospitality',
          title: 'Hospitality',
          links: [
            { id: 'bill-holder', label: 'Bill Holder', href: '/custom-gifts/bill-holder' },
            { id: 'menu-holders', label: 'Menu Holders', href: '/custom-gifts/menu-holders' },
            { id: 'coasters', label: 'Coasters', href: '/custom-gifts/coasters' },
          ],
        },
        {
          id: 'accessories',
          title: 'Accessories',
          links: [
            { id: 'card-holders', label: 'Card Holders', href: '/custom-gifts/card-holders' },
            { id: 'keyrings', label: 'Keyrings', href: '/custom-gifts/keyrings' },
            { id: 'pocket-wallets', label: 'Pocket Wallets', href: '/custom-gifts/pocket-wallets' },
            { id: 'pens', label: 'Pens', href: '/custom-gifts/pens' },
            { id: 'all-gifts', label: 'All Gifts', href: '/custom-gifts/all' },
          ],
        },
      ],
    },
  },
  {
    id: 'our-collection',
    label: 'OUR COLLECTION',
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
    href: '/quote',
    megaMenu: {
      columns: [
        {
          id: 'personalisation',
          title: 'Personalisation',
          links: [
            { id: 'blocking-foiling', label: 'Blocking & Foiling', href: '/bespoke/blocking-foiling' },
            { id: 'uv-printing', label: 'UV Printing', href: '/bespoke/uv-printing' },
            { id: 'graphic-print', label: 'Graphic Print', href: '/bespoke/graphic-print' },
            { id: 'special-matter-pages', label: 'Special Matter Pages', href: '/bespoke/special-matter-pages' },
          ],
        },
        {
          id: 'additional-finishing',
          title: 'Additional Finishing',
          links: [
            { id: 'ribbon', label: 'Ribbon', href: '/bespoke/ribbon' },
            { id: 'pen-loops', label: 'Pen Loops', href: '/bespoke/pen-loops' },
            { id: 'decorative-corner-protectors', label: 'Decorative Corner Protectors', href: '/bespoke/decorative-corner-protectors' },
            { id: 'gilded-page-edges', label: 'Gilded Page Edges', href: '/bespoke/gilded-page-edges' },
          ],
        },
        {
          id: 'portfolio',
          title: 'Portfolio',
          links: [], 
        },
      ],
    },
  },
];


export async function getNavigationData(): Promise<NavItem[]> {
  return NAV_ITEMS;
}

export { NAV_ITEMS };