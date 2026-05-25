module.exports = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/pages/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        accent: '#06b6d4',
        soft: '#f3f4f6'
      },
      fontSize: {
        '2xs': '0.65rem',  // ~10.4px
        '3xs': '0.55rem',  // ~8.8px
        '4xs': '0.5rem',   // ~8px
      },
      spacing: {
        '4.5': '1.125rem', // ~18px
        '7.5': '1.875rem', // ~30px
        '8.5': '2.125rem', // ~34px
      }
    }
  },
  plugins: []
}
