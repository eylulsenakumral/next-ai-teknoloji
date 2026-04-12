# Design System: Next AI Teknoloji

## 1. Overview & Creative North Star: "The Digital Curator"

This design system is built upon the North Star of **"The Digital Curator."** In the context of Next AI Teknoloji, we are not simply building an e-commerce platform; we are designing a high-end digital gallery for the future. 

To achieve this, we move beyond the "template" look of standard B2C sites. We embrace **intentional asymmetry**, where product imagery is allowed to break the grid, and **tonal depth**, where layers feel physically stacked rather than flatly printed. The goal is a signature visual identity that feels "Airy yet Authoritative"—utilizing the precision of Apple-inspired minimalism combined with the sophisticated glasswork seen in high-end software like Linear.

---

## 2. Colors: Tonal Architecture

Our palette is rooted in the interplay between pure light and electric precision. We do not use color to decorate; we use it to direct.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders for sectioning are strictly prohibited. Boundaries between content sections must be defined solely through:
1.  **Background Color Shifts:** Using `surface-container-low` (#f6f3f5) sections against a `surface` (#fcf8fb) background.
2.  **Generous White Space:** Allowing 128px+ vertical gaps to signal a change in context.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
- **Base Layer:** `surface` (#fcf8fb) for the main background.
- **Section Layer:** `surface-container` (#f0edef) for large content areas.
- **Card Layer:** `surface-container-lowest` (#ffffff) to make product cards "pop" against the gray background.

### The "Glass & Gradient" Rule
To capture the "Next AI" essence, use **Glassmorphism** for floating elements (Navigation bars, Modals).
- **Token:** `surface_container_lowest` with 80% opacity + `backdrop-filter: blur(20px)`.
- **Signature Texture:** Primary CTAs should use a subtle linear gradient from `primary` (#0050cb) to `primary_container` (#0066ff) at a 135-degree angle. This provides "soul" and a tactile, glowing quality.

---

## 3. Typography: Editorial Authority

We use **Inter** (as our modern sans-serif substitute for SF Pro) to create an editorial feel. The hierarchy is designed to make Turkish product descriptions look like headlines in a premium tech magazine.

- **Display (Large/Medium):** Reserved for Hero sections. Use `extra-bold` weights with -0.02em letter spacing to create a dense, "heavy" impact against the white space.
- **Headline (Small/Medium):** Use these for product titles. These are the "anchors" of your page.
- **Body (Large/Medium):** Optimized for readability in Turkish. Ensure line-height is generous (1.6) to maintain the "Airy" feel.
- **Gradients in Type:** For key marketing phrases, apply a gradient from `on_surface` (#1b1b1d) to `primary` (#0050cb) to emphasize "AI" or "Technology" keywords.

---

## 4. Elevation & Depth: Tonal Layering

We reject the "drop shadow" defaults. Depth in this system is achieved through light physics.

- **Layering Principle:** Instead of shadows, place a `surface-container-lowest` (#ffffff) element on top of a `surface-container` (#f0edef) background. This creates a soft, natural lift.
- **Ambient Shadows:** When an element must float (e.g., a hover state), use a **Triple-Layer Shadow**:
  1.  `0px 4px 12px rgba(27, 27, 29, 0.02)`
  2.  `0px 16px 32px rgba(27, 27, 29, 0.04)`
  3.  `0px 32px 64px rgba(27, 27, 29, 0.02)`
- **The "Ghost Border":** If accessibility requires a border, use `outline-variant` (#c2c6d8) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Refined Primitives

### Buttons
- **Primary:** `primary` gradient background, `on_primary` (#ffffff) text, `xl` (1.5rem / 24px) corner radius. Use high horizontal padding (32px).
- **Secondary (Glass):** `surface-container-lowest` with 40% opacity and 20px blur. 

### Cards (Product Gallery)
- **Visuals:** Forbid divider lines.
- **Structure:** Use a `surface-container-lowest` card with `lg` (1rem / 16px) rounded corners. Image sits at the top, followed by `title-md` text. The separation between price and title is managed by 16px of vertical white space, not a line.

### Input Fields
- **Default State:** Background `surface-container-high` (#eae7ea), no border.
- **Focused State:** Background `surface-container-lowest`, 1px Ghost Border (`primary` at 20% opacity).
- **Radius:** `md` (0.75rem / 12px).

### Selection Chips
- **Unselected:** `surface-container-highest` background, `on_surface_variant` text.
- **Selected:** `primary` background, `on_primary` text. Use `full` (9999px) radius for a "pill" look.

---

## 6. Do's and Don'ts

### Do:
- **Do** use asymmetrical layouts for product showcases (e.g., a large image on the left, overlapping text on the right).
- **Do** prioritize Turkish typography; ensure characters like 'ğ, ü, ş, i' have enough line height to breathe.
- **Do** use "Inertia Scrolling" and soft transitions (300ms, cubic-bezier(0.4, 0, 0.2, 1)).

### Don't:
- **Don't** use black (#000000). Always use `on_surface` (#1b1b1d) for text to maintain a premium, slightly softer contrast.
- **Don't** use 100% opaque borders. They break the "Glass" illusion and make the UI feel like a legacy application.
- **Don't** overcrowd. If you feel like you need a divider, you probably just need 24px more padding.

### Accessibility Note:
While we use soft grays for containers, ensure all text-on-background combinations meet WCAG AA standards. If `on_surface_variant` is too light on a gray section, move to `on_surface`.