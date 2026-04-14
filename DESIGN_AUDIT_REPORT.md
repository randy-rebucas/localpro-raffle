# Raffle Pro - Design & Styling Audit Report

**Date:** April 14, 2026  
**Framework:** Next.js with Tailwind CSS  
**Audit Focus:** Color consistency, typography, spacing, responsiveness, components, and Tailwind best practices

---

## Executive Summary

The Raffle Pro application demonstrates a **functional design system** with generally good consistency, but has several areas for improvement. The primary issues involve:
- Gradient and color shade inconsistencies
- Inconsistent responsive breakpoint usage
- Missing reusable component abstraction
- Spacing and padding conventions that vary
- Input/form field styling inconsistencies

**Overall Score: 7/10** - Good foundation with room for standardization

---

## 1. COLOR CONSISTENCY ANALYSIS

### Primary Color Palette

#### Currently Used:
- **Blue:** `blue-600` (primary CTA), `blue-700` (hover), `blue-100` (background), `blue-50` (light background)
- **Purple:** `purple-600` (secondary), `purple-700` (hover)
- **Green:** `green-600` (success/drawn status), `green-700` (hover)
- **Yellow:** `yellow-400` (accent in draw), `yellow-100` (draft status label)
- **Orange:** `orange-500`, `orange-600` (accent for winner picking)
- **Gray:** Full spectrum for neutrals

### Gradient Usage Patterns

**Most Frequent:**
```
from-blue-600 to-purple-600          // Login/signup pages, draw page header
from-green-600 to-emerald-600        // Results page header
from-purple-600 to-indigo-600        // Analytics page header
```

**Stat Cards (Inconsistent Pattern):**
- `from-blue-50 to-blue-100` (blue cards)
- `from-green-50 to-green-100` (green cards)
- `from-purple-50 to-purple-100` (purple cards)
- `from-yellow-50 to-yellow-100` (yellow cards - analytics only)
- `from-orange-50 to-orange-100` (orange cards - analytics only)
- `from-red-50 to-red-100` (red cards - analytics only)

### Status Badge Colors

| Status | Background | Text | Notes |
|--------|-----------|------|-------|
| DRAFT | `bg-yellow-100` | `text-yellow-800` | Inconsistent: also uses `bg-yellow-200 text-yellow-900` |
| ACTIVE | `bg-blue-100` | `text-blue-800` | Consistent across pages |
| DRAWN | `bg-green-100` | `text-green-800` | Consistent across pages |

### Issues Identified

1. **Status Badge Inconsistency:**
   - `home.tsx`: Uses `bg-yellow-100 text-yellow-800`
   - `raffles/[id]/page.tsx`: Uses `bg-yellow-200 text-yellow-900`
   - **Recommendation:** Standardize on one approach

2. **Gradient Overlay Inconsistencies:**
   - Draw page uses `bg-opacity-95` for white cards within colored background
   - Other pages don't use this pattern
   - **Recommendation:** Document when opacity is needed

3. **Animated States:**
   - Draw page uses `from-yellow-300 to-yellow-400` for spinning animation (different shade than elsewhere)
   - **Recommendation:** Clarify animation-specific color vocabulary

### Color Recommendations

**Create a standardized color map:**
```
PRIMARY:
  - Blue-600 (buttons, links, accents)
  - Blue-700 (hover states)

SECONDARY:
  - Purple-600 (analytics, secondary actions)
  - Green-600 (success states, drawn raffles)

STATUS:
  - Draft: Yellow-100/800
  - Active: Blue-100/800
  - Drawn: Green-100/800

STAT CARDS:
  - Use consistent pattern: [color]-50/100 for bg-gradient-to-br
  - Blue: Participants/counts
  - Green: Winners/success
  - Purple: Prize pools/premium features
  - Orange: Rates/distributions

ANIMATIONS:
  - Use color scale: Yellow-400/500 (not 300/400)
```

---

## 2. TYPOGRAPHY ANALYSIS

### Current Font Stack

**System Fonts:**
- Sans: Geist (Google Font imported in layout.tsx)
- Mono: Geist Mono (fallback, minimal use)
- Fallback: Arial, Helvetica (in globals.css)

### Heading Hierarchy

| Level | Sizes Used | Font Weight | Pages |
|-------|-----------|------------|-------|
| Page Title (h1) | `text-3xl`, `text-4xl`, `text-5xl` | `font-bold` | All pages |
| Section (h2) | `text-2xl` | `font-bold` | All pages |
| Subsection (h3) | `text-lg`, `text-xl` | `font-semibold`, `font-bold` | All pages |
| Label | `text-sm` | `font-medium`, `font-semibold` | Forms, cards |
| Body | `text-base` | (default 400) | All pages |
| Small | `text-xs`, `text-sm` | `font-semibold`, (default) | Descriptions, meta |

### Specific Typography Issues

1. **Heading Size Inconsistency:**
   ```
   Inconsistent:
   - home.tsx:          h2 = text-3xl font-bold (main heading)
   - login.tsx:         h1 = text-3xl font-bold (brand)
   - draw page:         h1 = text-3xl sm:text-4xl font-bold
   - analytics.tsx:     h1 = text-4xl font-bold
   - share page:        h1 = text-4xl font-bold
   ```
   **Recommendation:** Standardize page titles to `text-3xl font-bold` on mobile, `text-4xl` on sm+

2. **Label Styling Inconsistency:**
   ```
   Inconsistent:
   - Forms: text-sm font-medium text-gray-900/700 mb-2
   - Some fields: text-sm font-semibold text-gray-700
   - Card labels: text-sm text-gray-600 font-semibold
   ```
   **Recommendation:** Use `text-sm font-medium text-gray-700 mb-2` globally

3. **Body Text Color Variance:**
   ```
   Descriptions use:
   - text-gray-600 (most common)
   - text-gray-500 (some timestamps)
   - text-gray-700 (emphasis)
   ```
   **Recommendation:** Use `text-gray-600` for descriptions, `text-gray-500` for meta text only

4. **Line Height Missing:**
   - No explicit `leading-*` classes in any component
   - Default Tailwind line-height used throughout
   - **Recommendation:** Add `leading-relaxed` (1.625) for body text, `leading-tight` for headings

### Typography Recommendations

**Create a typography system:**
```
H1 (Page Title):
  - text-3xl md:text-4xl font-bold text-gray-900
  - leading-tight

H2 (Section):
  - text-2xl font-bold text-gray-900
  - leading-tight

H3 (Subsection):
  - text-lg font-semibold text-gray-900
  - leading-snug

Body Text:
  - text-base font-normal text-gray-900
  - leading-relaxed

Description Text:
  - text-sm font-normal text-gray-600
  - leading-relaxed

Label:
  - text-sm font-medium text-gray-700 mb-2

Small/Meta:
  - text-xs font-normal text-gray-500
```

---

## 3. SPACING ANALYSIS

### Padding Conventions

| Context | Sizes | Issues |
|---------|-------|--------|
| Page Container | `px-4 sm:px-6 lg:px-8 py-12` | Consistent |
| Card Container | `p-6`, `p-8`, `p-4` | Inconsistent - mixed values |
| Input Fields | `px-4 py-2`, `px-3 py-2` | 2 different sizes |
| Button/CTA | `px-6 py-2`, `px-6 py-3`, `py-4` | 3 different sizes |
| Form Label | Always `mb-2` | Consistent |

### Margin/Gap Patterns

| Size | Usage |
|------|-------|
| `gap-6` | Main grid layouts |
| `gap-4` | Secondary groupings |
| `gap-3` | UI elements |
| `mb-8` | Section separators |
| `mb-6` | Component spacing |
| `mb-4` | Sub-component spacing |
| `mb-2` | Form label bottom |

### Specific Issues

1. **Inconsistent Input Padding:**
   ```
   setup page:     px-3 py-2          (smaller)
   create page:    px-4 py-2          (larger)
   login page:     px-4 py-2          (larger)
   templates:      px-4 py-2          (larger)
   ```
   **Recommendation:** Standardize on `px-4 py-2` (md:px-3 py-2 for dense forms)

2. **Button Padding Variance:**
   ```
   Primary CTA:    px-6 py-3          (large)
   Secondary:      px-6 py-2          (medium)
   Small button:   px-3 py-1          (small - templates page)
   Draw phase:     py-4 (no px)       (full width, large)
   ```
   **Recommendation:** Use size system: sm (px-3 py-1), md (px-6 py-2), lg (px-6 py-3)

3. **Card Padding:**
   ```
   Standard card:     p-6
   Detail card:       p-8
   Compact:           p-4
   Tier card:         p-6
   Stat card:         p-6 / p-4 (inconsistent)
   ```
   **Recommendation:** Use p-6 as standard, p-4 for compact, p-8 for hero sections

### Spacing Recommendations

**Create spacing tokens:**
```
PADDING:
  xs: px-2 py-1
  sm: px-3 py-2
  md: px-4 py-2
  lg: px-6 py-3
  
CARD PADDING:
  standard: p-6
  compact: p-4
  hero: p-8
  
FORM PADDING:
  input: px-4 py-2
  textarea: px-4 py-2
  
MARGIN/GAP:
  gap-3: Small UI elements
  gap-4: Component grouping
  gap-6: Section grouping
  mb-2: Label spacing
  mb-4: Field spacing
  mb-6: Component spacing
  mb-8: Section spacing
```

---

## 4. COMPONENT PATTERNS

### Buttons

**Primary Button (Current Implementation):**
```
px-6 py-2 bg-blue-600 text-white rounded-lg 
hover:bg-blue-700 font-medium transition
```

**Variations Found:**
```
Secondary: border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50
Success:   bg-green-600 hover:bg-green-700
Danger:    bg-red-600 hover:bg-red-700
Warning:   bg-yellow-400 text-gray-900 hover:bg-yellow-500
```

**Issues:**
- Secondary button doesn't have `transition` class
- Some buttons missing `disabled:opacity-50` state
- Inconsistent size conventions

### Input Fields

**Current Implementation:**
```
px-4 py-2 border border-gray-300 rounded-lg 
focus:outline-none focus:ring-2 focus:ring-blue-500
```

**Issues:**
- No placeholder styling (color assumed to be browser default)
- Missing `disabled:bg-gray-50 disabled:cursor-not-allowed`
- Some inputs use `focus:border-transparent` (setup page)
- Textarea uses same styling (good)

### Cards

**Standard Card:**
```
bg-white rounded-lg shadow border border-gray-200 p-6 
hover:shadow-lg transition
```

**Stat Card:**
```
bg-gradient-to-br from-[color]-50 to-[color]-100 p-6 
rounded-lg border border-[color]-200
```

**Gradient Card (hero):**
```
bg-gradient-to-r from-[color]-600 to-[color]-600 p-8 
rounded-lg text-white
```

### Status Badges

**Current Implementation:**
```
px-3 py-1 bg-[color]-100 text-[color]-800 
text-xs font-medium rounded-full
```

**Usage:** Home page raffles, inline status indicators

### Error Messages

**Current Implementation:**
```
p-4 bg-red-100 border border-red-300 
text-red-800 rounded-lg
```

**Issues:**
- Inconsistent sizing (some p-3, some p-4)
- Not consistent with validation feedback

### Success/Info Messages

**Info Box (Demo Credentials):**
```
p-3 bg-blue-50 border border-blue-200 
rounded text-xs
```

**Issues:**
- Smaller padding than standard message
- Inconsistent with error styling

### Component Recommendations

**Create reusable component abstractions:**

```
Button Component:
- Sizes: xs, sm, md, lg
- Variants: primary, secondary, danger, success, ghost
- States: default, loading, disabled
- Include: transition, proper focus states

Input Component:
- Type: text, email, password, number, textarea
- States: default, error, disabled, readonly
- Include: placeholder styling, error messages, labels

Card Component:
- Variants: standard, stat, gradient, compact
- Props: color, header, footer, onClick
- Default: p-6, shadow, border

Badge Component:
- Status badges: draft, active, drawn
- Color badges: any Tailwind color
- Sizes: sm, md

Alert Component:
- Types: error, success, info, warning
- Include: icon, close button
- Consistent styling across all types
```

---

## 5. RESPONSIVE DESIGN ANALYSIS

### Current Breakpoint Usage

**Breakpoints Used:**
- `sm:` - Small devices (640px) - **Heavy use**
- `md:` - Medium devices (768px) - **Moderate use**
- `lg:` - Large devices (1024px) - **Heavy use**
- `xl:` - Extra large (1280px) - **Minimal use**

### Responsive Patterns by Page

#### Home Page
```
Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
Container: max-w-7xl
Navigation: Consistent on all sizes
Loading skeleton: Full width
```
✅ Good responsive coverage

#### Login/Signup Pages
```
Full-screen center: min-h-screen flex items-center justify-center
Form container: max-w-md w-full (fluid on mobile)
Navigation: Not visible (good for auth)
```
✅ Excellent for mobile

#### Create Page
```
Container: max-w-2xl
Single column form
All full-width inputs
```
✅ Good mobile experience

#### Setup Page
```
Grid: grid grid-cols-1 md:grid-cols-2
Left: Tiers (col-span-1)
Right: Participants (col-span-1)
Layout change at md breakpoint
```
⚠️ **Issue:** No `lg:` breakpoint for wider screens - could use md:grid-cols-1 lg:grid-cols-2

#### Draw Page
```
Grid: grid-cols-1 lg:grid-cols-4
Left: Controls (lg:col-span-1)
Right: Participants (lg:col-span-3)
Participants grid: grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6
```
✅ Excellent responsive scaling

#### Results Page
```
Grid: grid-cols-2
Single column until md
Missing md:grid-cols-2 lg:grid-cols-3
```
⚠️ **Issue:** Needs better md+ breakpoint handling

#### Analytics Page
```
Stats grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-5
Table: overflow-x-auto (good for mobile)
Winners: grid-cols-1 md:grid-cols-2
```
✅ Good responsive coverage

#### Share Page
```
Stats grid: grid-cols-1 md:grid-cols-3
Results: Single column, expandable
```
✅ Good mobile-first approach

### Responsive Issues

1. **Missing tablet (md) breakpoints in some areas:**
   - Stat cards sometimes jump from 1 col (mobile) to 2 cols (md), then 4-5 (lg)
   - Better would be: 1 col → 2 cols (sm) → 3-4 cols (md) → 5 cols (lg)

2. **No `xl:` usage anywhere:**
   - Containers fixed at `max-w-7xl`
   - Could be optimized for ultra-wide screens

3. **Inconsistent approach to form layouts:**
   - Templates page uses `grid-cols-1 md:grid-cols-2` for form inputs
   - Other pages don't show this pattern

4. **Navigation bar doesn't adapt:**
   - Same layout on all screen sizes
   - Could be improved with hamburger menu on mobile

### Responsive Recommendations

**Establish a responsive system:**

```
Mobile First (default):
- Single column layouts
- Full-width cards/buttons
- Stacked forms

Tablet (sm:, 640px+):
- 2-column grids where applicable
- Inline form fields
- Flexible spacing

Tablet+ (md:, 768px+):
- 2-3 column grids
- Multi-column layouts
- Optimized spacing

Desktop (lg:, 1024px+):
- 3-4 column grids
- Side-by-side layouts
- Full featured layouts

Wide (xl:, 1280px+):
- Add xl breakpoints for max-content displays
- Optimize very wide screens
```

**Specific Recommendations:**

```
For grid layouts:
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 (instead of missing sm:)

For stats cards:
grid-cols-1 md:grid-cols-2 lg:grid-cols-4 (consistent pattern)

For containers:
max-w-7xl mx-auto (already good)

For mobile nav:
Add responsive hamburger menu structure
```

---

## 6. TAILWIND COMPLIANCE & ANTI-PATTERNS

### ✅ Good Practices Found

1. **Consistent utility-first approach** - No custom CSS overrides
2. **Proper use of template literals** - Dynamic classes handled correctly
3. **Proper use of gradients** - `bg-gradient-to-*` patterns consistent
4. **Responsive classes** - Using breakpoints appropriately
5. **Opacity handling** - Using `-6` suffix properly
6. **Transitions** - Consistent use of `transition` class
7. **Focus states** - Using `focus:ring-*` for accessibility
8. **Border radius** - Appropriate choices (rounded-lg, rounded-full)

### ⚠️ Issues & Anti-Patterns Found

1. **Dynamic class concatenation (Minor):**
   ```javascript
   // Line 45 in home.tsx - OK
   className={`px-3 py-1 bg-yellow-100...`}
   // But used with switch statement - could be cleaner with object map
   ```
   **Issue:** Not an error, but could be refactored to object maps

2. **Inline ternary conditions (Common):**
   ```javascript
   className={`p-3 px-3 py-2 ...${isSpinning ? 'condition' : 'other'}`}
   ```
   **Better approach:** Use clsx or classnames library

3. **Hard-coded color values:**
   - No Tailwind theme extension for custom colors
   - All colors use standard palette (which is fine for consistency)

4. **Missing semantic HTML in some places:**
   - Modal implemented with divs instead of `<dialog>`
   - Some buttons styled as divs

5. **Animation naming:**
   ```
   animate-pulse (native Tailwind)
   Custom keyframes: pulse-glow, zoom-in, zoom-out (defined in tailwind.config.ts)
   ```
   **Issue:** Good use, but somewhat generic names

### Tailwind Best Practices Applied

✅ Using proper content paths in tailwind.config.ts  
✅ Using extend for custom animations (not replacing defaults)  
✅ Custom keyframes defined appropriately  
✅ No disabled Tailwind utilities  
✅ Utility-first class ordering (mostly consistent)  

### Recommendations

```
1. Consider adding clsx/classnames for complex conditional styling
   npm install clsx
   
   Usage:
   import clsx from 'clsx'
   className={clsx(
     'px-4 py-2 rounded-lg font-medium',
     {
       'bg-blue-600 text-white': isPrimary,
       'bg-gray-200 text-gray-800': !isPrimary,
     }
   )}

2. Consider extracting animation classes to a shared config:
   Create: lib/animation-classes.ts
   
   export const animations = {
     pulse: 'animate-pulse',
     spin: 'animate-spin',
     pulseglow: 'animate-pulse-glow',
     // etc
   }

3. Consider using @apply for repeated patterns:
   In globals.css:
   @layer components {
     @apply card rounded-lg shadow border border-gray-200 p-6;
     @apply button px-6 py-2 rounded-lg font-medium transition;
   }

4. Add data-* attributes for stateful styling instead of class gymnastics:
   Use: data-disabled, data-loading, data-error
```

---

## 7. DARK/LIGHT MODE ANALYSIS

### Current State
- **No dark mode implementation**
- All pages hard-coded for light mode
- CSS variables defined in globals.css but not actively used for theming

### Dark Mode Gaps

1. **No dark mode colors:**
   - No `dark:` prefixed classes anywhere
   - All colors are light-focused

2. **Background contrast in light mode:**
   - `bg-gray-50` throughout (very light)
   - Works on white but no dark alternative

3. **Text color consistency:**
   - `text-gray-900` for headings (no dark mode alternative)
   - `text-gray-600` for body (no dark mode alternative)

### Dark Mode Implementation Recommendations

```
Add to tailwind.config.ts:
{
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'dark-border': '#334155',
      }
    }
  }
}

Add class to html element:
<html className={isDark ? 'dark' : ''}>

Usage in components:
className="bg-gray-50 dark:bg-slate-900"
className="text-gray-900 dark:text-gray-50"
className="border-gray-200 dark:border-gray-700"
```

**Priority:** Medium (aesthetic, not critical)

---

## 8. BORDERS & SHADOWS ANALYSIS

### Shadow Levels

| Level | Classes | Usage |
|-------|---------|-------|
| None | - | Loading skeletons, minimal elements |
| Small | `shadow` | Cards, input fields |
| Medium | `shadow-lg`, `shadow-md` | Cards on hover, modals |
| Large | `shadow-xl` | Modal containers, hero sections |
| Extra | `shadow-2xl` | Auth pages, prominent overlays |

### Shadow Issues

1. **Inconsistent hover shadows:**
   ```
   Some cards: hover:shadow-lg
   Other cards: hover:shadow-md
   Some: no hover shadow
   ```
   **Recommendation:** Standardize on `hover:shadow-lg`

2. **Shadow on animations:**
   ```
   Draw page spinning animation: no-shadow → shadow-lg
   Should be smooth transition: shadow transition shadow-lg
   ```

### Border Radius

| Radius | Classes | Usage | Frequency |
|--------|---------|-------|-----------|
| Small | `rounded` | Rarely used | 🔴 Missing |
| Medium | `rounded-lg` | Cards, buttons, inputs | 🟢 Most common |
| Large | `rounded-xl` | Special buttons | 🟡 Occasional |
| Full | `rounded-full` | Badges, circles | 🟢 Consistent |

**Issue:** Inconsistent use of xl rounded on buttons across pages

### Border Colors

```
Mostly used:
- border-gray-200 (standard)
- border-gray-300 (darker option)
- border-[color]-200 (for colored cards)
- border-white border-opacity-20 (overlays)
```

**Consistency:** ✅ Good

### Specific Issues

1. **Status badge border:**
   - Uses border equivalent to bg color shading
   - `border-yellow-200`, `border-blue-200`, `border-green-200`
   - ✅ Consistent

2. **Accent borders:**
   - Draw page uses: `border-l-4` for accent
   - Other pages use full borders
   - ⚠️ Inconsistent approach

3. **Focus borders:**
   - Modern approach: `focus:ring-2 focus:ring-blue-500`
   - Not using: `focus:border-blue-500`
   - ✅ Good accessibility practice

### Recommendations

**Create a border/shadow system:**

```
SHADOWS:
  sm: shadow           (cards)
  md: shadow-md        (lifted cards)
  lg: shadow-lg        (prominent cards, modals)
  xl: shadow-xl        (hero sections)
  
HOVER SHADOWS:
  All interactive cards: hover:shadow-lg
  Always include: transition

BORDERS:
  Default: border-gray-200
  Light: border-gray-100
  Dark: border-gray-300
  Accent left: border-l-4 border-[color]-600
  
ROUNDED:
  tight: rounded         (rarely)
  normal: rounded-lg     (default for most)
  large: rounded-xl      (special CTAs)
  full: rounded-full     (badges, avatars)
```

---

## 9. FORM & INPUT ANALYSIS

### Input Field Styling

**Current Implementation:**
```
px-4 py-2 border border-gray-300 rounded-lg 
focus:outline-none focus:ring-2 focus:ring-blue-500
```

**Variations by page:**
```
login.tsx:       px-4 py-2 border-gray-300    ✓
signup.tsx:      px-4 py-2 border-gray-300    ✓
create.tsx:      px-4 py-2 border-gray-300    ✓
setup.tsx:       px-3 py-2 border-gray-300    ✗ (smaller)
templates.tsx:   px-4 py-2 border-gray-300    ✓
```

**Issues:**
1. Inconsistent padding (setup page uses smaller)
2. No error state styling
3. No disabled state styling
4. Placeholder color not styled (uses browser default)

### Label Styling

**Current Implementation:**
```
block text-sm font-medium text-gray-900 mb-2
```

**Variations:**
```
Some: text-gray-900 (darker)
Some: text-gray-700 (lighter)
Some: mb-2 (standard)
Some: mb-1 (tighter)
```

### Form Layout

**Field Group Spacing:**
```
space-y-4 (most pages)
space-y-6 (some forms)
```

**Issues:**
- Inconsistent spacing between form sections
- No consistent error message display pattern

### Select/Dropdown
- **Not used anywhere** in the application
- All form inputs are text, email, password, number, textarea

### Textarea
```
Same styling as input: px-4 py-2 border border-gray-300 rounded-lg
rows="4" or rows="5"
```
✅ Consistent

### Button States

**Disabled State:**
```
Implemented: disabled:opacity-50
Missing: disabled:cursor-not-allowed
Missing: disabled:bg-gray-300 (proper color change)
```

### Loading State
```
Done via:
- Button text change: "Saving..." vs "Save"
- disabled attribute
- Not using spinner/loader icon
```

### Form Recommendations

```
INPUTS:
  Standard: px-4 py-2 border border-gray-300 rounded-lg
  Error: border-red-500 focus:ring-red-500
  Disabled: px-4 py-2 border border-gray-200 bg-gray-50 cursor-not-allowed
  Focus: focus:outline-none focus:ring-2 focus:ring-blue-500

LABELS:
  Standard: block text-sm font-medium text-gray-700 mb-2

TEXTAREAS:
  Standard: px-4 py-2 border border-gray-300 rounded-lg resize-none
  Rows: 4 or 5 (consistent)

ERROR MESSAGES:
  Standard: text-xs text-red-600 mt-1

FORM GROUPS:
  Spacing: space-y-4
  Section separators: pt-6 border-t border-gray-200

DISABLED STATE:
  button: disabled:opacity-50 disabled:cursor-not-allowed
  input: disabled:bg-gray-50 disabled:cursor-not-allowed

LOADING STATE:
  Add icon or spinner
  Or use: aria-busy="true"
```

---

## 10. PAGE-BY-PAGE BREAKDOWN

### Home Page (`app/page.tsx`)

**Colors:**
- Primary: Blue-600/700 (New Raffle, Templates buttons)
- Secondary: Green-600/700 (Templates button)
- Status badges: Yellow/Blue/Green
- Error: Red-100/800

**Typography:**
- Title: `text-3xl font-bold text-gray-900`
- Subtitle: `text-gray-600`
- Card title: `text-lg font-semibold text-gray-900`
- Meta: `text-xs text-gray-500`

**Spacing:**
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12`
- Grid gap: `gap-6`
- Card padding: `p-6`

**Responsive:**
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` ✅
- Loading state: Full grid maintained

**Issues:**
- ⚠️ Status badge color inconsistency (Yellow-100 vs 200)

### Login Page (`app/login/page.tsx`)

**Colors:**
- Background gradient: `from-blue-600 to-purple-600` ✅
- Primary button: Blue-600
- Demo box: `bg-blue-50` with `border-blue-200`

**Typography:**
- Brand: `text-5xl` emoji, then `text-3xl font-bold`
- Heading: `text-gray-600`

**Spacing:**
- Form: `space-y-4` ✅
- Container: `max-w-md` (good for auth)
- Card padding: `p-8` ✅

**Responsive:** ✅ Excellent (full screen, centered)

**Issues:**
- ⚠️ No hamburger navigation visible

### Signup Page (`app/signup/page.tsx`)

**Similar to Login - mostly ✅ consistent**

**Notable:**
- Password requirement hint: `text-xs text-gray-500` ✅
- Successfully implements same pattern

### Create Raffle Page (`app/create/page.tsx`)

**Colors:**
- Button: Blue-600/700 ✅
- Secondary: Gray-300 (Cancel button)
- Error: Red-100

**Typography:**
- Title: `text-3xl font-bold`
- Description: `text-gray-600`
- Label: `text-sm font-medium text-gray-900` with `mb-2` ✅

**Spacing:**
- Container: `max-w-2xl` ✅
- Form: `space-y-6` (wider than home)
- Buttons: `flex gap-4`

**Issues:**
- ⚠️ Button group: `flex-1` makes buttons expand equally - but also has `text-center` on link

### Templates Page (`app/templates/page.tsx`)

**Colors:**
- Primary: Blue-600 (Create, Save)
- Success: Green-600 (Add Tier)
- Danger: Red-600 (Remove, Delete)

**Typography:**
- Title: `text-4xl font-bold` (slightly larger than other section pages)
- Form label: `text-sm font-medium text-gray-700 mb-2`
- Table data: `text-sm`

**Spacing:**
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` ✅
- Form spacing: `space-y-6`
- Tier input group: `flex gap-3`

**Issues:**
- ⚠️ Title size inconsistency (`text-4xl` vs other pages `text-3xl`)

### Raffle Detail Page (`app/raffles/[id]/page.tsx`)

**Colors:**
- Status color gradients: `from-[yellow/blue/green]-100 to-[color]-50`
- Status badges: `bg-yellow-200/blue-200/green-200 text-900`
- Stat cards: Different color gradients

**Typography:**
- Title: `text-3xl font-bold`
- Stat label: `text-sm text-gray-600`
- Stat value: `text-2xl font-bold text-[color]-600`

**Spacing:**
- Stat grid: `grid-cols-1 md:grid-cols-3 gap-6` ✅
- Card padding: `p-8` (larger than standard)
- Header: `p-8` ✅

**Issues:**
- ⚠️ Status badge colors use 200/900 instead of standardized 100/800

### Setup Page (`app/raffles/[id]/setup/page.tsx`)

**Colors:**
- Header: `bg-gradient-to-r from-blue-600 to-purple-600` ✅
- Button: Blue-600 (primary)
- Analytics button: Purple-600

**Typography:**
- Title: `text-3xl font-bold` ✅
- Subtitle: `text-blue-100` (within header)
- Input label: `text-sm font-medium text-gray-700`

**Spacing:**
- Form: `space-y-4` (compact)
- Input grid: `grid grid-cols-2 gap-4` (side-by-side amounts/counts)
- Tier list: `space-y-2`

**Issues:**
- ⚠️ Input padding uses `px-3 py-2` (smaller than standard `px-4 py-2`)
- ⚠️ Tab-like interface not actually tabs (just hidden/shown divs)

### Draw Page (`app/raffles/[id]/draw/page.tsx`)

**Colors:**
- Background: `from-blue-600 to-purple-600` (full screen) ✅
- Tier card: `bg-white bg-opacity-95` ✅
- Participants: `from-slate-300 to-slate-400` (default)
- Spinning: `from-yellow-300 to-yellow-400 text-gray-900` 🔴 Wrong shade
- Progress: `from-blue-500 to-purple-500`
- Details: `from-yellow-400 to-orange-500`

**Typography:**
- Title: `text-3xl sm:text-4xl font-bold text-white` ✅
- Tier prize: `text-4xl font-bold` with gradient text

**Spacing:**
- Layout: `grid-cols-1 lg:grid-cols-4` ✅
- Controls: `lg:col-span-1`
- Participants: `lg:col-span-3`
- Participant grid: `grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6` ✅ (excellent scaling)

**Issues:**
- 🔴 Spinning animation uses `from-yellow-300 to-yellow-400` (should be 400-500)

### Results Page (`app/raffles/[id]/results/page.tsx`)

**Colors:**
- Header: `from-green-600 to-emerald-600` ✅
- Summary cards: Blue and green
- Winner items: `from-green-50 to-emerald-50` with `border-green-100` ✅
- Tier header: `from-gray-50 to-gray-100` ✅

**Typography:**
- Title: `text-4xl font-bold` ✅
- Tier name: `font-semibold text-gray-900 text-lg` ✅
- Winner name: `font-semibold text-gray-900`
- Winner number: `bg-green-600 text-white rounded-full` ✅

**Spacing:**
- Summary grid: `grid-cols-2 gap-4` (good mobile)
- Winners: Single column, expandable
- Winner items: `p-3` (compact)

**Issues:**
- ⚠️ Summary grid needs better md+ breakpoint (md:grid-cols-2 lg:grid-cols-2 is redundant)

### Analytics Page (`app/raffles/[id]/analytics/page.tsx`)

**Colors:**
- Header: `from-purple-600 to-indigo-600` ✅
- Multiple gradient stat cards: `from-[color]-50 to-[color]-100` ✅
- Table: Standard gray
- Progress bars: `from-green-500 to-emerald-600`
- Winner timeline: `bg-blue-100 text-blue-600` for numbers

**Typography:**
- Title: `text-4xl font-bold` ✅
- Section: `text-2xl font-bold text-gray-900` ✅
- Table headers: `text-sm font-semibold`

**Spacing:**
- Stats grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4` ✅ (excellent scaling)
- Table: `overflow-x-auto` ✅
- Timeline: `max-h-96 overflow-y-auto` ✅

**Issues:**
- ✅ Generally very well implemented

### Share Page (`app/share/[key]/page.tsx`)

**Colors:**
- Stats: Blue/Purple/Green gradient cards ✅
- Tier header: `from-gray-50 to-gray-100` ✅
- Winner items: Numbered badges `from-blue-400 to-purple-500`
- Winner status: `bg-green-100 text-green-800` ✅

**Typography:**
- Title: `text-4xl font-bold` ✅

**Spacing:**
- Stats: `grid-cols-1 md:grid-cols-3` ✅
- Results: Single column, expandable

**Issues:**
- ✅ Clean, public-facing good UX

---

## 11. INCONSISTENCIES SUMMARY

### High Priority (Breaking Consistency)

| Issue | Pages | Current | Recommended | Impact |
|-------|-------|---------|-------------|--------|
| Status badge colors | Multiple | Yellow-100/yellow-800 AND yellow-200/yellow-900 | Standardize on 100/800 | High |
| Input padding | setup vs others | px-3 py-2 vs px-4 py-2 | Use px-4 py-2 everywhere | Medium |
| Heading sizes | Various pages | text-3xl/4xl mixed | text-3xl md:text-4xl standard | Medium |
| Form label color | Multiple | text-gray-900 vs 700 | Use text-gray-700 | Low |
| Button sizes | Multiple | 3 different sizes | Standardize sm/md/lg system | Medium |

### Medium Priority (Inconsistent Patterns)

| Issue | Current | Recommended |
|-------|---------|-------------|
| Stat card gradients | Color-50/100 (good) but some pages missing | Apply everywhere |
| Error message text | No unified approach | Create error component |
| Loading states | Text-only | Add spinners/icons |
| Form field errors | Not shown | Add validation feedback |
| Secondary buttons | Inconsistent hover | Apply hover:bg-gray-50 always |

### Low Priority (Polish)

| Issue | Current | Recommended |
|-------|---------|-------------|
| Dark mode | Missing | Implement if needed |
| XL breakpoints | Not used | Add xl: variants where needed |
| Custom animations | Generic names | Consider renaming for clarity |
| Accessibility | Focus states ok | Add aria attributes, labels |
| SEO metadata | Minimal | Improve meta descriptions |

---

## 12. RECOMMENDATIONS & ACTION PLAN

### Phase 1: High Priority (Immediate)

**1. Standardize Status Badge Colors**
```
Replace all instances:
- bg-yellow-100 text-yellow-800 (STANDARDIZE)
- bg-blue-100 text-blue-800 (GOOD)
- bg-green-100 text-green-800 (GOOD)

Remove:
- bg-yellow-200 text-yellow-900
- bg-blue-200 text-blue-900
- bg-green-200 text-green-900
```

**2. Fix Input Field Inconsistency**
```
All inputs should use: px-4 py-2 border border-gray-300 rounded-lg
Replace px-3 py-2 instances in setup page
```

**3. Standardize Heading Sizes**
```
Page titles (h1):
  Mobile: text-3xl font-bold
  Desktop: md:text-4xl font-bold
  
Sections (h2):
  text-2xl font-bold (consistent)
  
Subsections (h3):
  text-lg font-semibold (consistent)
```

**4. Fix Color Shade in Draw Animation**
```
Replace: from-yellow-300 to-yellow-400
With: from-yellow-400 to-yellow-500
(matches rest of application)
```

### Phase 2: Medium Priority (1-2 weeks)

**5. Create Component Abstractions**
```
lib/components/:
- FormInput.tsx
- FormLabel.tsx
- Button.tsx
- Card.tsx
- Badge.tsx
- Alert.tsx

Reduces duplication, increases consistency
```

**6. Implement Form Validation UI**
```
Add:
- Error message display
- Error input border (red)
- Required field indicator
- Loading spinner
```

**7. Standardize Button System**
```
Create button sizes:
- xs: px-3 py-1
- sm: px-4 py-2
- md: px-6 py-2
- lg: px-6 py-3

Create button variants:
- primary (blue)
- secondary (gray)
- success (green)
- danger (red)
```

### Phase 3: Polish (3+ weeks)

**8. Responsive Improvements**
```
Add xl: breakpoints
Optimize for ultra-wide screens
Consider mobile hamburger menu
```

**9. Dark Mode Implementation**
```
Add dark: prefixed classes
Create dark theme colors
Test on all pages
```

**10. Accessibility Audit**
```
Add aria labels
Improve focus indicators
Test keyboard navigation
Add skip links
```

---

## 13. QUICK REFERENCE: STANDARDIZED TAILWIND CLASSES

### Colors
```
PRIMARY:    blue-600 (buttons, links)
HOVER:      blue-700
SECONDARY:  purple-600
SUCCESS:    green-600
DANGER:     red-600
WARNING:    yellow-400
INFO:       blue-100
```

### Typography
```
H1: text-3xl md:text-4xl font-bold text-gray-900
H2: text-2xl font-bold text-gray-900
H3: text-lg font-semibold text-gray-900
BODY: text-base font-normal text-gray-900
LABEL: text-sm font-medium text-gray-700 mb-2
META: text-xs text-gray-500
```

### Spacing
```
CONTAINER: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12
CARD: p-6
FORM: space-y-4
GAP: gap-6 (sections), gap-4 (components), gap-3 (elements)
```

### Components
```
BUTTON: px-6 py-2 rounded-lg font-medium transition hover:opacity-90
INPUT: px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
CARD: bg-white rounded-lg shadow border border-gray-200 p-6
BADGE: px-3 py-1 rounded-full text-xs font-medium
ALERT: p-4 rounded-lg border
```

### Grids
```
TWO COL: grid grid-cols-1 md:grid-cols-2 gap-6
THREE COL: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
FOUR COL: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
FIVE COL: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4
```

---

## Summary Statistics

| Category | Score | Notes |
|----------|-------|-------|
| **Color Consistency** | 7/10 | Good palette, some shade inconsistencies |
| **Typography** | 7/10 | Good hierarchy, needs standardization |
| **Spacing** | 7/10 | Mostly consistent, some variations |
| **Responsiveness** | 8/10 | Excellent mobile-first, missing some breakpoints |
| **Components** | 6/10 | Good patterns, lacks abstraction |
| **Tailwind Compliance** | 8/10 | Proper utility-first, minimal custom CSS |
| **Accessibility** | 6/10 | Good focus states, needs aria labels |
| **Overall Design System** | 7/10 | Functional, needs standardization |

---

## Implementation Timeline

- **Week 1:** Fix high-priority inconsistencies (color shades, input padding, heading sizes)
- **Week 2-3:** Create component abstractions, improve form validation UI
- **Week 4+:** Responsive improvements, dark mode, accessibility audit

---

**Report Generated:** April 14, 2026  
**Application:** Raffle Pro v1.0  
**Framework:** Next.js 15 + Tailwind CSS v4
