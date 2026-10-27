export interface WordPressFeaturedMedia {
  id: number;
  source_url: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, { source_url: string; width: number; height: number }>;
  };
}

export interface WordPressAuthor {
  id: number;
  name: string;
  slug: string;
  avatar_urls?: Record<string, string>;
}

export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: WordPressFeaturedMedia[];
    author?: WordPressAuthor[];
  };
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  formattedDate: string;
  author?: string;
  featuredImage?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
}
