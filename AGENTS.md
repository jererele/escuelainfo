<!-- BEGIN:nextjs-agent-rules -->
# Rules and Instructions for AI Coding Assistants (EscuelaInfo)

This project has strict architectural, performance, and styling rules. Please read and follow them without exception.

## 1. Next.js 16 & Breaking Changes
* This project runs on Next.js 16/17 and React 19. APIs, conventions, and file structure may differ from older versions.
* Read the documentation in `node_modules/next/dist/docs/` or online guides before writing routing or hook logic.
* Heed all deprecation notices.

## 2. Performance & Mobile Optimization (CRITICAL)
* **Mobile/Desktop UI Separation**: Always implement DOM separation via Tailwind CSS breakpoints to avoid rendering heavy desktop components on mobile devices.
* **Stable FPS**: Ensure the application runs smoothly (targeting 60-120 FPS) on mobile.
* **Background Animations**: Deactivate heavy GPU/CPU animations (such as `CosmosBackground.tsx`) on mobile devices.
* **Lazy Loading / Dynamic Imports**: All large components or modals (e.g. `NewStudentModal`, `AssignStudentsModal`, etc.) **must** be loaded lazily using Next.js dynamic imports (`next/dynamic`) to keep the initial bundle size low.
* **Memoization**: Actively use `useMemo` and `useCallback` to prevent unnecessary component re-renders and main-thread blocks.
* **Hardware Acceleration**: For transitions and animations, use hardware-accelerated CSS properties (`transform`, `opacity`) exclusively.

## 3. UI, Aesthetics & Accessibility
* **Premium Aesthetics**: UI must feel professional, alive, and modern. Use curated, harmonious color palettes, smooth gradients, subtle micro-animations on interactive elements, and glassmorphism. Avoid flat or generic primary colors (e.g. pure red, blue, green).
* **Accessibility**: Maintain WCAG AA compliance. Check and ensure high color contrast ratios, especially in light mode, and provide clear visual indicators for required form fields.
* **Responsive Design**: Ensure every screen or modal is fully responsive.

## 4. Appwrite Integration & Data Storage Efficiency
* **Realtime Sync**: Implement Appwrite Realtime subscriptions across collections where instant UI updates are needed.
* **Storage Optimization**: Minimize database footprint. For example, compress class schedules using numeric module IDs instead of verbose strings, and use compact 2-6 character codes for log descriptions.
* **Cascade Deletes**: Ensure data integrity when deleting users, students, teachers, or courses (e.g. removing corresponding records from lists like `usuarios`).
<!-- END:nextjs-agent-rules -->
