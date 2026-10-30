/** @type {import('tailwindcss').Config} */

// Papéis de cor do Material 3 (valores em index.css, claro e escuro).
const roles = [
  'primary', 'on-primary', 'primary-container', 'on-primary-container',
  'secondary-container', 'on-secondary-container',
  'success', 'success-container', 'on-success-container',
  'warn', 'warn-container', 'on-warn-container',
  'error', 'error-container', 'on-error-container',
  'surface', 'surface-lowest', 'surface-low', 'surface-container', 'surface-high', 'surface-highest',
  'on-surface', 'on-surface-variant', 'outline', 'outline-variant',
  'nav', 'nav-line'
];

// Paleta de transição: as telas ainda não migradas para os papéis acima (Clientes, Financeiro,
// Nova venda…) usam slate/gray/rose. Aqui essas escalas apontam para os tons do Material 3,
// então elas já ficam no mesmo claro/escuro (inclusive o preto puro) sem mexer no markup.
const neutral = {
  50: '#FFF8F8', 100: '#FCEAEB', 200: '#F0DEE0', 300: '#D7C1C4', 400: '#9F8C8F',
  500: '#857375', 600: '#6A5A5C', 700: '#4A3D3F', 800: '#1C1617', 900: '#151112', 950: '#000000'
};
const rose = {
  50: '#FFF0F1', 100: '#FFD9DE', 200: '#F9BBC5', 300: '#F28FA1', 400: '#E0637C',
  500: '#B61F4B', 600: '#9C1740', 700: '#7F1034', 800: '#5E0A27', 900: '#40000F'
};

export default {
  darkMode: 'class',
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}', './views/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries(roles.map(r => [r, `var(--${r})`])),
        slate: neutral,
        gray: neutral,
        rose
      }
    }
  },
  plugins: []
};
