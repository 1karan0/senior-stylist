// Theme constants for easy reference
export const ThemeColors = {
  backgrounds: {
    light: '#FFFFFF',
    dark: '#000000',
  },
  gradients: {
    light: {
      onboarding: ['#ECFAF5', '#D1F6E7'],
      background: ['hsl(146, 25%, 97%)', 'hsl(158, 64%, 95%)'],
    },
    dark: {
      onboarding: ['hsl(158, 32%, 8%)', 'hsl(158, 32%, 12%)'],
      background: ['hsl(158, 32%, 8%)', 'hsl(158, 32%, 12%)'],
    },
  },
  text: {
    primary: {
      light: '#000000',
      dark: '#FFFFFF',
    },
  },
} as const;

export const Gradients = {
  primary: ['#667EEA', '#764BA2'],
  secondary: ['#F093FB', '#F5576C'],
  success: ['#4FACFE', '#00F2FE'],
  warning: ['#43E97B', '#38F9D7'],
} as const;
