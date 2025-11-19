// Theme constants for easy reference
export const ThemeColors = {
  backgrounds: {
    light: '#FFFFFF',
    dark: '#000000',
  },
  gradients: {
    primary: {
      from: '#667EEA',
      to: '#764BA2',
      class: 'bg-primary-gradient',
    },
    primaryHorizontal: {
      class: 'bg-primary-gradient-horizontal',
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
