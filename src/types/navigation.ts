export interface MegaMenuLink {
  id: string;   
  label: string;
  href: string;
}

export interface MegaMenuColumn {
  id: string;
  title?: string; 
  links: MegaMenuLink[];
}

export interface MegaMenu {
  columns: MegaMenuColumn[];
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  megaMenu?: MegaMenu;
}
