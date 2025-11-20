// src/constants/gradients.ts
export const AppGradients = {
  light: {
    background: [
      'hsl(146 25% 97%)', // top
      'hsl(158 64% 95%)', // bottom
    ],
    primary: ['#27B07D', '#36D399'],
  },

  dark: {
    background: [
      'hsl(158 32% 8%)', // top
      'hsl(158 32% 12%)', // bottom
    ],
    primary: ['#23A76F', '#2CCB91'],
  },
} as const;
