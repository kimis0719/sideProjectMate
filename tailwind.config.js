/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* 기존 시스템 토큰 (CSS 변수 연결 — 기존 컴포넌트 호환용) */
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          light: 'var(--brand-light)',
          foreground: 'var(--brand-foreground)',
        },

        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          foreground: 'var(--primary-foreground)',
          /* 신규 디자인 시스템 토큰 */
          container: '#2563eb',
          'on-container': '#eeefff',
          'on-fixed': '#00174b',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
          /* 신규 디자인 시스템 토큰 */
          container: '#acbfff',
          'on-secondary': '#ffffff',
          'on-container': '#394c84',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },

        /* ─── 신규 디자인 시스템 토큰 ─── */

        /* Surface 계열 */
        surface: {
          DEFAULT: '#f9f9f8',
          bright: '#f9f9f8',
          dim: '#dadad9',
          'container-lowest': '#ffffff',
          'container-low': '#f3f4f3',
          'container-high': '#e8e8e7',
          variant: '#e2e2e2',
          tint: '#0053db',
        },

        /* On-Surface */
        'on-surface': {
          DEFAULT: '#1a1c1c',
          variant: '#434655',
        },
        'on-background': '#1a1c1c',
        'on-primary': '#ffffff',
        'on-secondary': '#ffffff',

        /* Tertiary */
        tertiary: {
          DEFAULT: '#943700',
          container: '#bc4800',
          fixed: '#ffdbcd',
        },

        /* Error */
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        /* Outline */
        outline: {
          DEFAULT: '#737686',
          variant: '#c3c6d7',
        },

        /* Inverse */
        'inverse-surface': '#2f3130',
        'inverse-on-surface': '#f1f1f0',
        'inverse-primary': '#b4c5ff',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'sans-serif',
        ],
        /* 신규 디자인 시스템 폰트 */
        headline: ['var(--font-manrope)', 'Noto Sans KR', 'sans-serif'],
        body: ['var(--font-inter)', 'Noto Sans KR', 'sans-serif'],
        kr: ['var(--font-noto-sans-kr)', 'sans-serif'],
      },
      boxShadow: {
        ambient: '0 20px 40px rgba(26, 28, 28, 0.04)',
        modal: '0 20px 40px rgba(26, 28, 28, 0.08)',
      },
      borderRadius: {
        lg: '0.5rem',
        full: '9999px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      animation: {
        'slide-in-up': 'slide-in-up 0.25s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
