# Project Rules & Architecture

## Domain-Driven / Feature-Sliced Folder Architecture
This project uses a Domain-Driven / Feature-Sliced architecture. It strictly separates domain-agnostic UI elements from domain-specific features to keep the codebase scalable, readable, and maintainable.

### Directory Structure
- **`src/components/layout/`**: Contains core shell components (e.g. `Navbar`, `Footer`, `MobileMenu`, `AnnouncementBar`).
- **`src/components/home/`**: Contains page-specific presentation components for the homepage (e.g. `Hero`, `FeaturedCollections`, `Categories`, `FAQ`).
- **`src/components/ui/`**: Contains reusable, domain-agnostic atomic UI components (e.g. `Button`, `Accordion`, `SectionTitle`).
- **`src/features/`**: Contains domain-specific modules. Each feature folder (e.g., `products/`, `cart/`) encapsulates its own:
  - `components/`
  - `hooks/`
  - `services/` (API calls for this feature)
  - `types/` (Domain-specific types)
  - `utils/`
  - `context/`
- **`src/data/`**: Static mock data to be used until replaced by the backend (e.g. `navigation.ts`, `footer.ts`, `home.ts`).
- **`src/types/`**: Global, shared types (e.g. `navigation.ts`). Do NOT put domain-specific types here.
- **`src/lib/` (or `src/services/`)**: Setup for third-party tools and core API clients (e.g. `woocommerce/client.ts`).

### Guidelines for Adding New Code
1. **Keep `page.tsx` Clean**: A page file should act primarily as a layout composer and data fetcher. Do not write complex UI or business logic inside `page.tsx`. Import components from the `components/` or `features/` directory.
2. **Consult the Architecture First**: Before adding any new component or feature, ask yourself if it's domain-agnostic (`components/`) or domain-specific (`features/`). If it's a domain feature, colocate its types, hooks, and services within its feature folder.
3. **Services**: Put core client wrappers in `src/lib/`. Put domain-specific API calls in `src/features/<feature>/services/`.
