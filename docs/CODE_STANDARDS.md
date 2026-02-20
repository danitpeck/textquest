# TextQuest Code Standards & Best Practices

## 1. Component Structure
- Use focused, reusable React components for UI elements.
- Keep components small; extract logic into custom hooks or controller modules as needed.
- Avoid prop drilling for deeply nested state—prefer React Context or a state manager if needed.

## 2. State & Data
- Use React's useState/useEffect for local state.
- Store game data (rooms, items, etc.) in JSON files for easy editing.
- If the game world grows, consider modularizing JSON or loading data asynchronously.
- Avoid hardcoded heuristics (e.g., string matching for room types); use explicit fields like `type` or `tags` in data.

## 3. CSS & Styling
- **Standard: Use CSS Modules for all new components.**
  - File naming: `ComponentName.module.css`.
  - Import styles as `import styles from './ComponentName.module.css'`.
  - Apply classes as `className={styles.className}`.
- **Class Naming Convention:**
  - Use camelCase for all CSS class names (enforced by Stylelint).
  - Examples: `gameContainer`, `themeButton`, `asciiMapRoom`, `compassDirActive`.
  - This is automatically validated via `npm run lint`.
- Avoid inline styles except for dynamic, one-off adjustments.
- Use CSS variables for theme colors and borders.
- Keep global theme variables and root layout styles in a central global stylesheet (e.g., `index.css`).
- Remove unused CSS files and classes promptly.

**Enforced via Stylelint & ESLint:**
- Run `npm run lint` to check and auto-fix style issues.
- Run `npm run lint:fix` to auto-fix all linting violations.
- Stylelint enforces camelCase class names and CSS module best practices.
- ESLint enforces TypeScript strictness (`no-explicit-any`) and React best practices (hooks, deps, JSX).

## 4. Theming
- Use CSS variables for all theme-dependent colors and borders.
- Add new themes by extending the variable set in `index.css`.
- UI elements (minimap, compass, etc.) must use theme variables for color/border.

## 5. Accessibility
- Use semantic HTML and ARIA attributes where appropriate.
- Ensure keyboard navigation and color contrast meet accessibility standards.

## 6. Testing
- Add unit and integration tests for all new components and logic.
- Use Jest and React Testing Library for UI tests.

## 7. Error Handling
- Add error boundaries to catch unexpected errors in the UI.
- Validate all data loaded from JSON or external sources.

## 8. Code Review & Documentation
- All PRs must be reviewed by at least one other developer.
- Update this document as standards evolve.
- Document any architectural decisions in a `docs/` folder.

---

**Summary:**
- Use CSS Modules for all new styling.
- Keep components small and focused.
- Use explicit data fields, not string heuristics.
- Follow theme and accessibility best practices.
- Test and document as you go.

*For questions or suggestions, update this document and discuss with the team.*
