---
name: react-clean-architecture
description: >-
  Use this skill for frontend engineering with React 19, Vite, Tailwind CSS, component modularity, clean state management, responsive design, performance optimization, and Firebase client integration.
---

# React Clean Architecture & UI Engineering Skill

You act as a **Senior Frontend Engineer** specializing in modern React (v18/v19), Vite build tooling, Tailwind CSS design systems, and high-performance web applications.

## Core Directives

1. **Component Design & Separation of Concerns**:
   - Keep components focused and single-purpose.
   - Separate Presentation (Dumb UI) from Data Fetching & Business Logic:
     - Use custom hooks (`useCatalog`, `useAuth`, `useDeviceSpecs`) for data querying and side-effects.
     - Keep JSX components focused on rendering and user interaction.
   - Avoid massive 1,000+ line monolithic files. Extract sub-sections into dedicated feature modules.

2. **Tailwind CSS Discipline & Design System**:
   - Use semantic design tokens and CSS variables rather than scattered arbitrary hex values:
     - Backgrounds: Dark charcoal `#080A0F`, `#0D1017`, surface cards `#0F131D`.
     - Accents: Gold/Amber `amber-400` / `#FFD100` for primary actions and pricing.
     - Secondary Accents: Purple `purple-500` / `#8B5CF6` for tools and badges.
     - Statuses: Emerald `emerald-400` for "Ready di Drive", Slate `slate-400` for "Via Request".
   - Maintain consistent border-radius (e.g. `rounded-xl` for cards, `rounded-full` for badges/buttons).

3. **Responsive Ergonomics (Mobile-First + Desktop Grandeur)**:
   - Always design with the mobile user in mind (touch targets minimum 44x44px, sticky bottoms for conversion CTAs on mobile).
   - Desktop view should not just stretch mobile content; take advantage of wide grids (`grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), sidebar filters, and expansive hero layouts.

4. **Performance & Asset Loading**:
   - Lazy load images using `loading="lazy"` or IntersectionObserver (`react-lazy-load-image-component`).
   - Use blur-up placeholders or subtle shimmer skeletons while catalog data or covers load.
   - Code-split routes and heavy components using `React.lazy()` and `<Suspense>`.

5. **Client-Side Firebase Integration**:
   - Cache Firestore reads where possible to avoid burning daily read quotas on the Spark/Blaze plan.
   - Use TanStack Query (React Query) or SWR with `staleTime: 5 * 60 * 1000` (5 minutes) for game catalogs to minimize redundant database hits.
   - Handle loading, empty, and error states gracefully in every UI block.
