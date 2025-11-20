/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './src/**/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // -- FONT FAMILIES (custom) --
      fontFamily: {
        // Poppins (use separate names per weight for reliable RN rendering)
        poppins: ['Poppins-Regular'],
        'poppins-medium': ['Poppins-Medium'],
        'poppins-semibold': ['Poppins-SemiBold'],
        'poppins-bold': ['Poppins-Bold'],

        // Urbanist
        urbanist: ['Urbanist-Regular'],
        'urbanist-medium': ['Urbanist-Medium'],
        'urbanist-semibold': ['Urbanist-SemiBold'],
        'urbanist-bold': ['Urbanist-Bold'],
      },

      colors: {
        // Core theme colors
        background: {
          light: '#FFFFFF', // Pure white for light mode
          dark: '#000000', // Pure black for dark mode
          DEFAULT: '#FFFFFF',
        },
        surface: {
          light: '#F8FAFC', // Very light gray
          dark: '#111111', // Near black
          DEFAULT: '#F8FAFC',
        },

        // Primary gradient colors - define the gradient stops
        primary: {
          // Gradient from color
          from: '#667EEA', // Purple-blue
          // Gradient to color
          to: '#764BA2', // Deep purple
          // You can also keep solid variants for non-gradient elements
          50: '#f0f4ff',
          100: '#e0e7ff',
          500: '#667EEA',
          600: '#5A67D8',
          700: '#4C51BF',
          900: '#3730A3',
        },

        // Text colors
        text: {
          primary: {
            light: '#000000', // Black text in light mode
            dark: '#FFFFFF', // White text in dark mode
            DEFAULT: '#000000',
          },
          secondary: {
            light: '#4B5563', // Gray-600
            dark: '#D1D5DB', // Gray-300
            DEFAULT: '#4B5563',
          },
          inverse: {
            light: '#FFFFFF',
            dark: '#000000',
            DEFAULT: '#FFFFFF',
          },
        },

        // Border colors
        border: {
          light: '#E5E7EB', // Gray-200
          dark: '#374151', // Gray-700
          DEFAULT: '#E5E7EB',
        },

        // Additional semantic colors
        success: {
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
        error: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },

        // Neutral grays
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },

      // Custom gradient configurations
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'primary-gradient-horizontal': 'linear-gradient(90deg, #667EEA 0%, #764BA2 100%)',
        'primary-gradient-light': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'primary-gradient-dark': 'linear-gradient(135deg, #7E69AB 0%, #5D4A8C 100%)',

        // Alternative gradient options
        'gradient-1': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-2': 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
        'gradient-3': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
        'gradient-4': 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
