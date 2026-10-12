/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        asphalt: '#0B0D10',
        graphite: '#14181D',
        steel: '#232A32',
        titanium: '#9AA5B1',
        bone: '#ECE8DF',
        amber: {
          DEFAULT: '#FFB020',
          glow: 'rgba(255, 176, 32, 0.25)',
          muted: 'rgba(255, 176, 32, 0.12)',
        },
        mint: {
          DEFAULT: '#35F2C2',
          glow: 'rgba(53, 242, 194, 0.25)',
          muted: 'rgba(53, 242, 194, 0.12)',
        },
        signal: {
          DEFAULT: '#FF4D4D',
          glow: 'rgba(255, 77, 77, 0.25)',
          muted: 'rgba(255, 77, 77, 0.12)',
        },
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
      boxShadow: {
        'amber-focus': '0 0 0 2px #0B0D10, 0 0 0 4px #FFB020',
        'mint-focus': '0 0 0 2px #0B0D10, 0 0 0 4px #35F2C2',
        'subtle': '0 4px 20px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
