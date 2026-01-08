// Theme configuration for consistent styling across the application

export const theme = {
  // Colors
  colors: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5', // Main primary
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
  },

  // Input sizes
  inputSizes: {
    sm: {
      padding: 'px-3 py-1.5',
      text: 'text-xs',
      height: 'h-8',
    },
    md: {
      padding: 'px-3 py-2',
      text: 'text-sm',
      height: 'h-10',
    },
    lg: {
      padding: 'px-4 py-2.5',
      text: 'text-base',
      height: 'h-12',
    },
  },

  // Button sizes
  buttonSizes: {
    sm: {
      padding: 'px-3 py-1.5',
      text: 'text-xs',
    },
    md: {
      padding: 'px-4 py-2',
      text: 'text-sm',
    },
    lg: {
      padding: 'px-6 py-3',
      text: 'text-base',
    },
  },

  // Border radius
  borderRadius: {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  },

  // Spacing
  spacing: {
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
  },

  // Shadows
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },
};

export default theme;

