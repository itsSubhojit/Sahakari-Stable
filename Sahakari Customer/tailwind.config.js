/** @type {import('tailwindcss').Config} */

// Helper to make Tailwind colors support opacity modifiers (e.g. bg-primary/10)
const c = (varName) => `rgb(var(${varName}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Base surfaces
        surface:                    c("--surface"),
        "surface-dim":              c("--surface-dim"),
        "surface-bright":           c("--surface-bright"),
        "surface-container-lowest": c("--surface-container-lowest"),
        "surface-container-low":    c("--surface-container-low"),
        "surface-container":        c("--surface-container"),
        "surface-container-high":   c("--surface-container-high"),
        "surface-container-highest":c("--surface-container-highest"),
        "on-surface":               c("--on-surface"),
        "on-surface-variant":       c("--on-surface-variant"),
        "inverse-surface":          c("--inverse-surface"),
        "inverse-on-surface":       c("--inverse-on-surface"),
        outline:                    c("--outline"),
        "outline-variant":          c("--outline-variant"),
        "surface-tint":             c("--surface-tint"),
        "surface-variant":          c("--surface-variant"),

        // Primary brand
        primary:                    c("--primary"),
        "on-primary":               c("--on-primary"),
        "primary-container":        c("--primary-container"),
        "on-primary-container":     c("--on-primary-container"),
        "inverse-primary":          c("--inverse-primary"),
        "primary-fixed":            c("--primary-fixed"),
        "primary-fixed-dim":        c("--primary-fixed-dim"),
        "on-primary-fixed":         c("--on-primary-fixed"),
        "on-primary-fixed-variant": c("--on-primary-fixed-variant"),

        // Secondary brand
        secondary:                    c("--secondary"),
        "on-secondary":               c("--on-secondary"),
        "secondary-container":        c("--secondary-container"),
        "on-secondary-container":     c("--on-secondary-container"),
        "secondary-fixed":            c("--secondary-fixed"),
        "secondary-fixed-dim":        c("--secondary-fixed-dim"),
        "on-secondary-fixed":         c("--on-secondary-fixed"),
        "on-secondary-fixed-variant": c("--on-secondary-fixed-variant"),

        // Tertiary brand
        tertiary:                    c("--tertiary"),
        "on-tertiary":               c("--on-tertiary"),
        "tertiary-container":        c("--tertiary-container"),
        "on-tertiary-container":     c("--on-tertiary-container"),
        "tertiary-fixed":            c("--tertiary-fixed"),
        "tertiary-fixed-dim":        c("--tertiary-fixed-dim"),
        "on-tertiary-fixed":         c("--on-tertiary-fixed"),
        "on-tertiary-fixed-variant": c("--on-tertiary-fixed-variant"),

        // Status & background
        error:               c("--error"),
        "on-error":          c("--on-error"),
        "error-container":   c("--error-container"),
        "on-error-container":c("--on-error-container"),
        background:          c("--background"),
        "on-background":     c("--on-background"),
      },
      fontFamily: {
        sans:    ["Plus Jakarta Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Plus Jakarta Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "sans-serif"],
        headline:["Outfit", "Plus Jakarta Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "sans-serif"],
        body:    ["Plus Jakarta Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "sans-serif"],
      },
      fontSize: {
        "display-lg":        ["48px", { lineHeight: "56px", letterSpacing: "-0.03em", fontWeight: "800" }],
        "display-lg-mobile": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md":       ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-sm":       ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg":           ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md":           ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md":          ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-sm":          ["12px", { lineHeight: "16px", fontWeight: "600" }],
      },
      borderRadius: {
        sm:      "0.375rem",
        DEFAULT: "0.75rem",
        md:      "1rem",
        lg:      "1.25rem",
        xl:      "1.75rem",
        "2xl":   "2rem",
        full:    "9999px",
      },
      boxShadow: {
        xs:   "0 1px 2px 0 rgba(0,0,0,0.04)",
        sm:   "0 2px 8px -2px rgba(0,0,0,0.05), 0 1px 4px -1px rgba(0,0,0,0.03)",
        md:   "0 12px 24px -6px rgba(0,0,0,0.06), 0 4px 8px -2px rgba(0,0,0,0.03)",
        lg:   "0 20px 40px -12px rgba(0,0,0,0.08), 0 8px 16px -4px rgba(0,0,0,0.04)",
        xl:   "0 25px 50px -12px rgba(0,0,0,0.12)",
        glow: "0 0 25px -5px rgba(79,70,229,0.3)",
      },
    },
  },
  plugins: [],
};
