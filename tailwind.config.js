/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        'off-white': '#F0EEE8',
        'neon-yellow': '#FFFF00',
        'neon-purple': '#A855F7',
        'card': '#0A0A0A',
        'panel': '#111111',
        'border': '#1A1A1A',
        'border-bright': '#2A2A2A',
        'muted': '#666666',
        'active-green': '#22C55E',
        'idle-gray': '#444444',
        'error-red': '#EF4444',
        'warn-amber': '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-purple': 'glowPurple 2s ease-in-out infinite alternate',
        'glow-yellow': 'glowYellow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowPurple: {
          '0%': { boxShadow: '0 0 5px rgba(168, 85, 247, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.7), 0 0 40px rgba(168, 85, 247, 0.3)' },
        },
        glowYellow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 255, 0, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 255, 0, 0.7), 0 0 40px rgba(255, 255, 0, 0.3)' },
        },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
