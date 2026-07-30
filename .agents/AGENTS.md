# Project Rules & Architecture

## Feature-First Folder Architecture
This project uses a feature-first architecture to keep `page.tsx` files and overall routing clean. All major components and logic should be organized within `src/features/`.

### Directory Structure
- **`src/features/layout/`**: Contains core layout components such as `AnnouncementBar`, `Navbar`, `MobileMenu`, `TradeBrochure`, `Footer`.
- **`src/features/home/`**: Contains page-specific section components for the homepage (e.g., `Hero`, `Categories`, `FeaturedProducts`, `TrustIndicators`, `FeaturedCollections`, `Testimonials`, `ResourceCarousel`, `FAQ`, `LatestBlog`, `CustomisationCTA`). These components are aggregated in `index.ts` to be used cleanly in the home `page.tsx`.
- **`src/features/shared/`**: Contains reusable, generic UI components like `ProductCard`, `CategoryCard`, `CollectionCard`, `BlogCard`, `Accordion`, `Button`. These can be introduced as the project demands.

### Guidelines for Adding New Features
1. **Keep `page.tsx` Clean**: A page file should act primarily as a layout composer and data fetcher. Do not write complex UI or business logic inside `page.tsx`. Import components from the `features/` directory.
2. **Consult the Architecture First**: Before adding any new component or feature, refer back to this structure to see if it belongs in an existing feature folder (`layout`, `home`, `shared`) or if a new feature folder is needed.
3. **Shared vs Feature Specific**: Only place components in `shared/` if they are truly used across multiple different features or pages. Otherwise, colocate them with the feature they belong to.
