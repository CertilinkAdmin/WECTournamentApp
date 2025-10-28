![CSS_STYLE_GUIDE](CSS_STYLE_GUIDE.md)
# World Espresso Championship - CSS & Style Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Brand Identity](#brand-identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Component Styling](#component-styling)
6. [Theme System](#theme-system)
7. [Responsive Design](#responsive-design)
8. [Utility Classes](#utility-classes)
9. [Best Practices](#best-practices)
10. [File Structure](#file-structure)

## 🎨 Overview

The WEC platform uses a comprehensive design system built on:
- **Tailwind CSS** - Utility-first CSS framework
- **CSS Custom Properties** - For dynamic theming
- **Component-based styling** - Using shadcn/ui components
- **Brand-specific color palette** - Coffee-themed design system
- **Responsive-first approach** - Mobile-first design principles

## 🏷️ Brand Identity

### Primary Brand Colors (Official WEC Palette)

```css
/* Primary Brand Colors */
--brand-cinnamon-brown: #994D27;    /* Primary: Cinnamon Brown */
--brand-light-sand: #DECCA7;        /* Neutral: Light Sand */

/* Secondary Brand Colors */
--brand-forest-green: #3E3F24;      /* Dark Forest Green */
--brand-golden-brown: #C48D49;      /* Golden Brown */
--brand-navy-blue: #214966;         /* Navy Blue */
--brand-taupe: #BDA088;             /* Taupe */
```

### Brand Usage Guidelines

```css
/* Primary Actions & Headers */
.primary-action {
  background-color: var(--brand-cinnamon-brown);
  color: white;
}

/* Secondary Actions & Accents */
.secondary-action {
  background-color: var(--brand-light-sand);
  color: var(--brand-cinnamon-brown);
}

/* Utility Classes */
.bg-cinnamon-brown { background-color: var(--brand-cinnamon-brown); }
.text-cinnamon-brown { color: var(--brand-cinnamon-brown); }
.border-cinnamon-brown { border-color: var(--brand-cinnamon-brown); }
```

## 🎨 Color System

### Light Theme Colors

```css
:root {
  /* Core Colors */
  --background: #F5F0E8;              /* Soft sand background */
  --foreground: hsl(25 15% 15%);      /* Dark text */
  
  /* Surface Colors */
  --card: hsl(30 20% 98%);            /* Card backgrounds */
  --card-foreground: hsl(25 15% 15%); /* Card text */
  
  /* Interactive Colors */
  --primary: #994D27;                 /* Cinnamon Brown primary */
  --primary-foreground: #FFFFFF;
  --secondary: #DECCA7;               /* Light Sand secondary */
  --secondary-foreground: #7A3D1F;
  
  /* Functional Colors */
  --destructive: #DC2626;             /* Error states */
  --success: #16A34A;                 /* Success states */
  --warning: #D97706;                 /* Warning states */
  --info: #0891B2;                    /* Info states */
  
  /* Border & Input */
  --border: #E5E7EB;
  --input: #F9FAFB;
  --ring: var(--brand-cinnamon-brown);
}
```

### Dark Theme Colors

```css
.dark {
  /* Core Colors */
  --background: #994D27;              /* Cinnamon Brown dominant */
  --foreground: #FFFFFF;              /* White text */
  
  /* Surface Colors */
  --card: #1A0F0A;                    /* Dark cards */
  --card-foreground: #DECCA7;         /* Light Sand text */
  
  /* Interactive Colors */
  --primary: #DECCA7;                 /* Light Sand for primary */
  --primary-foreground: #994D27;      /* Cinnamon Brown text */
  --secondary: #7A3D1F;               /* Darker Cinnamon Brown */
  --secondary-foreground: #FFFFFF;
  
  /* Functional Colors */
  --destructive: #EF4444;
  --success: #22C55E;
  --warning: #F59E0B;
  --info: #06B6D4;
  
  /* Border & Input */
  --border: #B85A2F;
  --input: #B85A2F;
  --ring: var(--brand-cinnamon-brown);
}
```

### Coffee-themed Palette

```css
/* Espresso Colors */
--espresso-darkest: #1A0F0A;        /* Dark roast */
--espresso-dark: #2D1B12;           /* Dark espresso */
--espresso-medium: #994D27;         /* Cinnamon Brown base */
--espresso-light: #B85A2F;          /* Cinnamon Brown light */
--espresso-cream: #DECCA7;          /* Light Sand cream */
--espresso-foam: #F5F0E8;           /* Milk foam */

/* Accent Colors */
--accent-caramel: hsl(30 60% 65%);
--accent-honey: hsl(45 80% 70%);
--accent-vanilla: hsl(50 40% 85%);
--accent-cinnamon: hsl(20 60% 60%);
--accent-nutmeg: hsl(25 50% 55%);
```

## ✍️ Typography

### Font Families

```css
/* Font Stack */
:root {
  --font-sans: 'Inter', 'Open Sans', sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-montserrat: 'Montserrat', sans-serif;
  --font-mono: 'JetBrains Mono', Menlo, monospace;
}

/* Brand Typography */
.montserrat-title {
  font-family: "Montserrat", sans-serif;
  font-optical-sizing: auto;
  font-weight: 600;
  font-style: normal;
}
```

### Typography Scale

```css
/* Font Sizes */
.text-xs { font-size: 0.75rem; }      /* 12px */
.text-sm { font-size: 0.875rem; }     /* 14px */
.text-base { font-size: 1rem; }       /* 16px */
.text-lg { font-size: 1.125rem; }     /* 18px */
.text-xl { font-size: 1.25rem; }      /* 20px */
.text-2xl { font-size: 1.5rem; }      /* 24px */
.text-3xl { font-size: 1.875rem; }    /* 30px */
.text-4xl { font-size: 2.25rem; }     /* 36px */
.text-5xl { font-size: 3rem; }        /* 48px */
.text-6xl { font-size: 3.75rem; }     /* 60px */

/* Responsive Typography */
.responsive-heading-xl {
  @apply text-2xl font-bold leading-tight;
  @media (min-width: 768px) { font-size: 1.875rem; }
  @media (min-width: 1024px) { font-size: 2.25rem; }
  @media (min-width: 1280px) { font-size: 3rem; }
}
```

## 🧩 Component Styling

### Button Variants

```css
/* Primary Button */
.btn-primary {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
  @apply px-4 py-2 rounded-md font-medium;
  @apply transition-colors duration-200;
  @apply focus-visible:outline-none focus-visible:ring-2;
  @apply focus-visible:ring-ring focus-visible:ring-offset-2;
}

/* Secondary Button */
.btn-secondary {
  @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
  @apply px-4 py-2 rounded-md font-medium;
  @apply transition-colors duration-200;
}

/* Outline Button */
.btn-outline {
  @apply border border-input bg-background hover:bg-accent;
  @apply hover:text-accent-foreground;
  @apply px-4 py-2 rounded-md font-medium;
}

/* Ghost Button */
.btn-ghost {
  @apply hover:bg-accent hover:text-accent-foreground;
  @apply px-4 py-2 rounded-md font-medium;
}
```

### Card Components

```css
/* Base Card */
.card {
  @apply bg-card text-card-foreground rounded-lg border shadow-sm;
  @apply theme-transition; /* Smooth theme transitions */
}

.card-header {
  @apply flex flex-col space-y-1.5 p-6;
}

.card-content {
  @apply p-6 pt-0;
}

.card-footer {
  @apply flex items-center p-6 pt-0;
}
```

### Form Components

```css
/* Input Styles */
.input {
  @apply flex h-10 w-full rounded-md border border-input;
  @apply bg-background px-3 py-2 text-sm ring-offset-background;
  @apply file:border-0 file:bg-transparent file:text-sm file:font-medium;
  @apply placeholder:text-muted-foreground;
  @apply focus-visible:outline-none focus-visible:ring-2;
  @apply focus-visible:ring-ring focus-visible:ring-offset-2;
  @apply disabled:cursor-not-allowed disabled:opacity-50;
}

/* Label Styles */
.label {
  @apply text-sm font-medium leading-none;
  @apply peer-disabled:cursor-not-allowed peer-disabled:opacity-70;
}
```

## 🌓 Theme System

### Theme Transitions

```css
/* Base Theme Transition */
.theme-transition {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-transition-fast {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-transition-slow {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Theme Change Animations */
.theme-changing {
  animation: theme-fade 0.2s ease-out;
}

@keyframes theme-fade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

### Theme-Aware Components

```css
/* Theme-aware backgrounds */
.bg-theme-surface {
  @apply bg-background dark:bg-card;
}

.text-theme-primary {
  @apply text-foreground dark:text-card-foreground;
}

/* Theme-specific shadows */
.shadow-theme {
  box-shadow: 0 4px 6px -1px rgba(153, 77, 39, 0.1), 
              0 2px 4px -2px rgba(153, 77, 39, 0.1);
}

.dark .shadow-theme {
  box-shadow: 0 4px 6px -1px rgba(153, 77, 39, 0.3), 
              0 2px 4px -2px rgba(153, 77, 39, 0.3);
}
```

## 📱 Responsive Design

### Breakpoints

```css
/* Tailwind Breakpoints */
xs: '480px',        /* Extra small devices */
sm: '640px',        /* Small devices */
md: '768px',        /* Medium devices */
lg: '1024px',       /* Large devices */
xl: '1280px',       /* Extra large devices */
2xl: '1536px',      /* 2X large devices */

/* Custom Breakpoints */
tablet-portrait: '768px',
tablet-landscape: '1024px',
desktop-small: '1280px',
desktop-large: '1440px',
```

### Responsive Utilities

```css
/* Responsive Container */
.responsive-container {
  @apply w-full mx-auto px-4;
  max-width: 100%;
  
  @media (min-width: 768px) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    max-width: 95%;
  }
  
  @media (min-width: 1024px) {
    max-width: 90%;
  }
  
  @media (min-width: 1280px) {
    max-width: 85%;
  }
}

/* Mobile-First Grid */
.responsive-grid {
  @apply grid grid-cols-1 gap-4;
  @apply sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4;
  @apply xl:grid-cols-5 2xl:grid-cols-6;
}
```

### Mobile Optimizations

```css
/* Touch-Friendly Interactions */
.touch-target {
  @apply min-h-[44px] min-w-[44px]; /* iOS guidelines */
}

/* Mobile Navigation */
.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 z-50;
  @apply bg-background border-t border-border;
  @apply safe-area-inset-bottom; /* iOS safe area */
}

/* Scroll Optimizations */
.scroll-smooth {
  scroll-behavior: smooth;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

## 🛠️ Utility Classes

### Brand Utilities

```css
/* Brand Gradients */
.bg-brand-gradient {
  background: linear-gradient(135deg, #994D27, #DECCA7);
}

.bg-espresso-gradient {
  background: linear-gradient(135deg, #1A0F0A, #DECCA7);
}

/* Brand Shadows */
.shadow-brand {
  box-shadow: 0 4px 6px -1px rgba(153, 77, 39, 0.2), 
              0 2px 4px -2px rgba(153, 77, 39, 0.2);
}

.shadow-espresso {
  box-shadow: 0 4px 6px -1px rgba(153, 77, 39, 0.2), 
              0 2px 4px -2px rgba(153, 77, 39, 0.2);
}
```

### Animation Utilities

```css
/* Hover Animations */
.hover-lift {
  @apply transition-transform duration-200;
  @apply hover:transform hover:scale-105;
}

.hover-glow {
  @apply transition-shadow duration-200;
  @apply hover:shadow-lg hover:shadow-brand/25;
}

/* Loading States */
.animate-pulse-slow {
  animation: pulse 3s ease-in-out infinite;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Layout Utilities

```css
/* Content Spacing */
.content-with-anchored-footer {
  min-height: calc(100vh - 80px); /* Account for footer */
}

/* Safe Area Support */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Aspect Ratios */
.aspect-golden {
  aspect-ratio: 1.618; /* Golden ratio */
}

.aspect-coffee-cup {
  aspect-ratio: 3/4; /* Coffee cup proportion */
}
```

## 📏 Best Practices

### 1. Theme-Aware Development

```css
/* ✅ Good: Use semantic color tokens */
.my-component {
  @apply bg-background text-foreground border-border;
}

/* ❌ Bad: Use hardcoded colors */
.my-component {
  @apply bg-white text-black border-gray-200;
}
```

### 2. Responsive Design

```css
/* ✅ Good: Mobile-first approach */
.my-component {
  @apply text-sm md:text-base lg:text-lg;
  @apply p-4 md:p-6 lg:p-8;
}

/* ❌ Bad: Desktop-first approach */
.my-component {
  @apply text-lg md:text-base sm:text-sm;
}
```

### 3. Performance Optimizations

```css
/* ✅ Good: Use transform for animations */
.animate-element {
  @apply transition-transform duration-200;
  @apply hover:transform hover:scale-105;
}

/* ❌ Bad: Animate layout properties */
.animate-element {
  @apply transition-all duration-200;
  @apply hover:w-full hover:h-full;
}
```

### 4. Accessibility

```css
/* ✅ Good: Proper focus states */
.interactive-element {
  @apply focus-visible:outline-none focus-visible:ring-2;
  @apply focus-visible:ring-ring focus-visible:ring-offset-2;
}

/* ✅ Good: Sufficient contrast */
.high-contrast {
  @apply bg-primary text-primary-foreground;
  /* Ensures 4.5:1 contrast ratio */
}
```

### 5. Component Architecture

```css
/* ✅ Good: Composable utilities */
.btn-base {
  @apply px-4 py-2 rounded-md font-medium;
  @apply transition-colors duration-200;
  @apply focus-visible:outline-none focus-visible:ring-2;
}

.btn-primary {
  @apply btn-base bg-primary text-primary-foreground;
  @apply hover:bg-primary/90;
}
```

## 📁 File Structure

```
client/src/
├── styles/
│   ├── champions.css          # Champions page specific styles
│   ├── responsive.css         # Tournament bracket responsive styles
│   └── index.css             # Global styles and CSS variables
├── theme/
│   ├── brand-colors.ts       # Brand color definitions
│   ├── theme-tokens.ts       # Theme token system
│   └── theme-types.ts        # TypeScript definitions
├── utils/
│   ├── theme-utils.ts        # Theme utility functions
│   ├── theme-persistence.ts  # Theme storage utilities
│   └── theme-animations.ts   # Animation utilities
└── components/
    ├── ui/                   # shadcn/ui components
    └── theme-toggle.tsx      # Theme switching component
```

## 🎯 Component Examples

### Dashboard Card

```tsx
<div className="bg-card text-card-foreground rounded-lg border shadow-sm theme-transition">
  <div className="p-6">
    <h3 className="text-lg font-semibold mb-2">Dashboard Item</h3>
    <p className="text-muted-foreground mb-4">Description text</p>
    <button className="btn-primary">
      Primary Action
    </button>
  </div>
</div>
```

### Responsive Navigation

```tsx
<nav className="bg-background border-b border-border theme-transition">
  <div className="responsive-container">
    <div className="flex items-center justify-between h-16">
      <div className="flex items-center space-x-4">
        <img src="/logo.png" alt="WEC" className="h-8 w-8" />
        <span className="font-montserrat font-semibold text-primary">
          World Espresso Championship
        </span>
      </div>
      <div className="hidden md:flex items-center space-x-4">
        <a href="#" className="text-foreground hover:text-primary">Home</a>
        <a href="#" className="text-foreground hover:text-primary">Tournaments</a>
        <ThemeToggle />
      </div>
    </div>
  </div>
</nav>
```

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Maintained by**: WEC Development Team

This style guide ensures consistency across the World Espresso Championship platform while maintaining the coffee-themed brand identity and providing excellent user experience across all devices and themes.
