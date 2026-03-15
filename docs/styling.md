# VBWD fe-user — Styling Guide

## For Developers

### Where styles come from

| Source | What it contains |
|---|---|
| `vbwd-fe-core/src/styles/variables.css` | All design tokens (`--vbwd-*`) |
| `vbwd-fe-core/src/styles/index.css` | Utility classes, resets |
| `vbwd-fe-core/src/components/ui/` | Button, Input, Card, Table, Modal, Badge, etc. |
| `vue/src/layouts/UserLayout.vue` | Sidebar + burger menu layout (app-level) |
| View `.vue` files (`<style scoped>`) | Page-specific styles only |

Full token reference → `vbwd-fe-core/docs/styling.md`

---

### Importing the design system

`vue/src/main.ts`:
```typescript
import 'vbwd-view-component/styles';   // tokens + utility classes
```

---

### Layout (Sidebar + Burger)

`UserLayout.vue` wraps every authenticated page. It manages:
- Fixed 250px sidebar on desktop
- Slide-in sidebar with overlay on `≤ 1024px`
- Full-width sidebar on `≤ 768px`
- Mobile header: burger + logo + cart icon (fixed, 60px)

To close the sidebar after a nav click, call `closeMobileMenu()` (already on all `<router-link>` inside the sidebar).

Sidebar colors use:
```css
--vbwd-sidebar-bg: #2c3e50;
--vbwd-sidebar-text: rgba(255, 255, 255, 0.8);
--vbwd-sidebar-active-bg: rgba(255, 255, 255, 0.1);
```
Override these in the app's global CSS to retheme the sidebar without touching the component.

---

### Writing page styles

**Do:**
```css
/* Good — uses design tokens */
.my-card {
  background: var(--vbwd-card-bg, #fff);
  border: 1px solid var(--vbwd-border-color, #ddd);
  border-radius: var(--vbwd-radius-lg);
  box-shadow: var(--vbwd-shadow-sm);
}
```

**Don't:**
```css
/* Bad — hardcoded color not theme-aware */
.my-card {
  background: #ffffff;
  border: 1px solid #dddddd;
}
```

---

### Responsive rules for every page view

Every view must support smartphone vertical (`≤ 768px`):

```css
/* Required on every view with a max-width */
.my-view {
  max-width: 900px;
}

@media (max-width: 768px) {
  .my-view { max-width: 100%; }

  /* Stack flex rows */
  .header-row { flex-direction: column; gap: 10px; }

  /* Full-width inputs */
  input, select { width: 100%; }

  /* Tables need overflow scroll */
  .table-wrap { overflow-x: auto; }
  table { min-width: 480px; }

  /* Stack action buttons */
  .actions { flex-direction: column; }
  .actions .btn { width: 100%; }

  /* Reduce padding */
  .card { padding: 16px; }
}
```

---

### Theming / Appearance

The appearance store (`vue/src/stores/appearance.ts` or similar) controls the active theme. It sets a class on `<html>`:

```typescript
document.documentElement.classList.toggle('dark', isDark);
```

All `var(--vbwd-*)` values respond automatically. No component changes are needed.

---

### Plugin views

Plugin views live in `plugins/<name>/src/views/`. They follow the same rules:
- Use `var(--vbwd-*)` for colors
- Must include `@media (max-width: 768px)` block
- Prefer `<Button>`, `<Input>`, `<Table>` from `vbwd-view-component` over raw HTML elements

---

## For Users — Appearance / Theme

The **Appearance** option in the sidebar lets you switch between:

| Theme | Description |
|---|---|
| Light | Default bright theme |
| Dark | Dark background, light text — easier on eyes at night |
| System | Follows your device's dark/light preference automatically |

To change your theme:
1. Open the sidebar (tap the menu icon on mobile)
2. Tap your name / user icon at the bottom
3. Select **Appearance**
4. Choose Light, Dark, or System

Your preference is saved automatically and remembered the next time you log in.
