# ACMS Design System

## Brand Identity

- **Product Name:** ACMS (Apartment Committee Management System)
- **Tagline:** Smart Society Management
- **Tone:** Professional, Trustworthy, Modern, Approachable

## Color Palette

### Primary Colors
| Token | Value | Usage |
|-------|-------|-------|
| `primary-50`  | `#EEF2FF` | Backgrounds, hover states |
| `primary-100` | `#E0E7FF` | Light backgrounds |
| `primary-200` | `#C7D2FE` | Borders, dividers |
| `primary-300` | `#A5B4FC` | Disabled states |
| `primary-400` | `#818CF8` | Hover accents |
| `primary-500` | `#6366F1` | **Primary buttons, links, active states** |
| `primary-600` | `#4F46E5` | Button hover, focus rings |
| `primary-700` | `#4338CA` | Active press states |
| `primary-800` | `#3730A3` | Text on light bg |
| `primary-900` | `#312E81` | Deep accents |

### Neutral / Gray Scale
| Token | Value | Usage |
|-------|-------|-------|
| `gray-50`  | `#F9FAFB` | Page background |
| `gray-100` | `#F3F4F6` | Card backgrounds, table headers |
| `gray-200` | `#E5E7EB` | Borders, dividers |
| `gray-300` | `#D1D5DB` | Input borders |
| `gray-400` | `#9CA3AF` | Disabled text |
| `gray-500` | `#6B7280` | Secondary text |
| `gray-600` | `#4B5563` | Body text |
| `gray-700` | `#374151` | Heading text |
| `gray-800` | `#1F2937` | Strong text |
| `gray-900` | `#111827` | Darkest text |

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#059669` | Paid, active, resolved, confirmed |
| `warning` | `#D97706` | Pending, in-progress, overdue |
| `error` | `#DC2626` | Unpaid, suspended, failed, deleted |
| `info` | `#0284C7` | Informational badges |
| `success-bg` | `#D1FAE5` | Success badge background |
| `warning-bg` | `#FEF3C7` | Warning badge background |
| `error-bg` | `#FEE2E2` | Error badge background |
| `info-bg` | `#DBEAFE` | Info badge background |

## Typography

### Font Stack
- **UI:** `Inter`, system-ui, -apple-system, sans-serif
- **Monospace:** `JetBrains Mono`, 'Fira Code', monospace (for code/amounts)

### Type Scale
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `h1` | `1.875rem` (30px) | 700 | 2.25rem | Page titles |
| `h2` | `1.5rem` (24px) | 600 | 2rem | Section headers |
| `h3` | `1.25rem` (20px) | 600 | 1.75rem | Card titles |
| `body` | `0.875rem` (14px) | 400 | 1.25rem | Default text |
| `body-sm` | `0.75rem` (12px) | 400 | 1rem | Labels, captions |
| `caption` | `0.625rem` (10px) | 500 | 0.75rem | Badge text, timestamps |

## Spacing System

Based on a 4px grid:
- `xs`: 4px (p-1)
- `sm`: 8px (p-2)
- `md`: 12px (p-3)
- `lg`: 16px (p-4)
- `xl`: 24px (p-6)
- `2xl`: 32px (p-8)
- `3xl`: 48px (p-12)

## Component Design Tokens

### Buttons
| Variant | Classes |
|---------|---------|
| **Primary** | `bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500` |
| **Secondary** | `bg-white text-gray-700 border border-gray-300 hover:bg-gray-50` |
| **Danger** | `bg-red-600 text-white hover:bg-red-700` |
| **Ghost** | `text-gray-600 hover:text-gray-900 hover:bg-gray-100` |
| **Size - sm** | `px-3 py-1.5 text-xs` |
| **Size - md** | `px-4 py-2 text-sm` |
| **Size - lg** | `px-6 py-3 text-base` |

### Cards
- **Default:** `bg-white rounded-xl shadow-sm border border-gray-100 p-6`
- **Stat Card:** `bg-white rounded-xl p-5 shadow-sm border border-gray-100`
- **Hover Card:** `bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all`

### Tables
- **Header:** `bg-gray-50 border-b border-gray-100 text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider`
- **Cell:** `px-6 py-4 text-sm text-gray-900`
- **Row hover:** `hover:bg-gray-50 transition-colors`

### Status Badges
| Status | Classes |
|--------|---------|
| active / paid / resolved | `bg-green-100 text-green-700` |
| in_progress / pending | `bg-blue-100 text-blue-700` |
| open / unpaid | `bg-yellow-100 text-yellow-700` |
| suspended / inactive / overdue | `bg-red-100 text-red-700` |

### Forms
- **Input:** `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500`
- **Label:** `block text-sm font-medium text-gray-700 mb-1`
- **Error:** `text-sm text-red-600 mt-1`
- **Select:** Same as input with appearance-none

### Navigation Sidebar
- **Background:** `bg-gray-900 text-white`
- **Active link:** `bg-primary-600 text-white`
- **Inactive link:** `text-gray-300 hover:bg-gray-800 hover:text-white`
- **Width:** `w-64` desktop, full overlay mobile
- **Header height:** `h-16`

### Modals
- **Overlay:** `fixed inset-0 z-50 bg-black/50`
- **Content:** `bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto`
- **Title:** `text-xl font-semibold text-gray-900`
- **Close button:** Top-right X icon with ghost styling

## Layout

### Desktop (≥1024px)
```
┌─────────┬──────────────────────────────────────────┐
│ Sidebar │               Header Bar                  │
│   w-64  ├──────────────────────────────────────────┤
│         │                                           │
│  Nav    │            Main Content Area               │
│  Links  │         (max-w-7xl mx-auto)                │
│         │                                           │
└─────────┴──────────────────────────────────────────┘
```

### Mobile (<1024px)
```
┌────────────────────────────────────────────────────┐
│  Header (hamburger + title + user)                  │
├────────────────────────────────────────────────────┤
│                                                     │
│                 Full-width Content                   │
│                                                     │
└────────────────────────────────────────────────────┘
│  Sidebar slides in as overlay from left              │
└────────────────────────────────────────────────────┘
```

### Content Widths
- **Page max-width:** `max-w-7xl` (1280px)
- **Form max-width:** `max-w-lg` (512px)
- **Table max-width:** Full width with horizontal scroll

## Responsive Breakpoints
| Breakpoint | Width | Layout |
|-----------|-------|--------|
| `sm` | 640px | Single column |
| `md` | 768px | 2-column cards |
| `lg` | 1024px | Sidebar visible, 3-column cards |
| `xl` | 1280px | 4-column cards |

## Animation Tokens

- **Transitions:** `transition-all duration-200 ease-in-out`
- **Hover lift:** `hover:-translate-y-0.5`
- **Modal enter:** `animate-in fade-in zoom-in-95 duration-200`
- **Skeleton pulse:** `animate-pulse`
- **Toast slide:** Slide in from right, fade out

## Empty States

All empty states should include:
1. An illustration/icon (48-64px)
2. A descriptive title
3. A brief explanation
4. A CTA button (when applicable)

## Accessibility Requirements

- All interactive elements must be keyboard accessible
- All modals must trap focus and close on Escape
- Color must not be the only way to convey information
- All images must have `alt` text
- All forms must have associated `<label>` elements
- Interactive elements must have visible focus indicators
- Use semantic HTML (`<nav>`, `<main>`, `<table>`, `<button>`, etc.)
