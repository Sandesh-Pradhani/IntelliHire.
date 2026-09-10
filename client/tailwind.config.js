/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'sidebar-expand': 'sidebarExpand 0.3s ease-in-out',
        'sidebar-collapse': 'sidebarCollapse 0.3s ease-in-out',
        'accordion-open': 'accordionOpen 0.3s ease-in-out',
        'accordion-close': 'accordionClose 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sidebarExpand: {
          '0%': { width: '80px' },
          '100%': { width: '280px' },
        },
        sidebarCollapse: {
          '0%': { width: '280px' },
          '100%': { width: '80px' },
        },
        accordionOpen: {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '384px', opacity: '1' },
        },
        accordionClose: {
          '0%': { maxHeight: '384px', opacity: '1' },
          '100%': { maxHeight: '0', opacity: '0' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '80': '20rem',
        '280': '280px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'sidebar': '4px 0 16px rgba(0, 0, 0, 0.08)',
        'navbar': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.08)',
      },
      transitionDuration: {
        '300': '300ms',
      },
      transitionTimingFunction: {
        'sidebar': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}