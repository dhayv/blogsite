/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Sans', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.gray.700'),
            '--tw-prose-headings': theme('colors.gray.900'),
            '--tw-prose-links': theme('colors.blue.600'),
            '--tw-prose-code': theme('colors.gray.800'),
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            lineHeight: '1.6',
            p: { marginTop: '0.6em', marginBottom: '0.6em' },
            h2: { marginTop: '1em', marginBottom: '0.35em', fontSize: '1.35em' },
            h3: { marginTop: '0.8em', marginBottom: '0.25em', fontSize: '1.15em' },
            h4: { marginTop: '0.6em', marginBottom: '0.2em' },
            li: { marginTop: '0.15em', marginBottom: '0.15em' },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.gray.300'),
            '--tw-prose-headings': theme('colors.gray.100'),
            '--tw-prose-links': theme('colors.blue.400'),
            '--tw-prose-code': theme('colors.gray.200'),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
