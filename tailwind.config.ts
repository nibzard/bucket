import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // Mobile-first spacing system
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      // Mobile-first typography
      fontSize: {
        "xs": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.025em" }],
        "sm": ["0.875rem", { lineHeight: "1.5", letterSpacing: "0.025em" }],
        "base": ["1rem", { lineHeight: "1.5", letterSpacing: "0.025em" }],
        "lg": ["1.125rem", { lineHeight: "1.5", letterSpacing: "0.025em" }],
        "xl": ["1.25rem", { lineHeight: "1.4", letterSpacing: "0.025em" }],
        "2xl": ["1.5rem", { lineHeight: "1.4", letterSpacing: "0.025em" }],
        "3xl": ["1.875rem", { lineHeight: "1.3", letterSpacing: "0.025em" }],
      },
      // Touch-friendly minimum sizes
      minWidth: {
        "touch": "44px",
        "button": "44px",
      },
      minHeight: {
        "touch": "44px",
        "button": "44px",
      },
      // Mobile-first animations
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "fade-out": "fadeOut 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-left": "slideLeft 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "bounce-gentle": "bounceGentle 0.6s ease-out",
        "pulse-gentle": "pulseGentle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideLeft: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGentle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      // Mobile-first breakpoints (already mobile-first by default)
      screens: {
        "xs": "475px",
        // sm: "640px", (default)
        // md: "768px", (default)
        // lg: "1024px", (default)
        // xl: "1280px", (default)
        // 2xl: "1536px", (default)
      },
    },
  },
  plugins: [],
};
export default config;