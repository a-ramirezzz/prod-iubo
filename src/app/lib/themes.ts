// src/app/lib/themes.ts

export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  type: 'static' | 'animated';
  previewImage: string;
  backgroundVideo?: string;
  styles: {
    '--bg-image'?: string;
    '--bg-color': string;
    '--panel-bg': string;
  };
}

export const themes: Theme[] = [
  // --- TEMAS ESTÁTICOS OSCUROS ---
  {
    id: 'dark-default',
    name: 'Oscuro Básico',
    mode: 'dark',
    type: 'static',
    previewImage: 'https://placehold.co/120x90/1a1a1a/f0f0f0?text=Básico',
    styles: {
      '--bg-color': '#1a1a1a',
      '--panel-bg': '#242526',
    },
  },
  // ... (otros temas estáticos)

  // --- TEMAS ESTÁTICOS CLAROS ---
  {
    id: 'light-default',
    name: 'Claro Básico',
    mode: 'light',
    type: 'static',
    previewImage: 'https://placehold.co/120x90/f8f9fa/212529?text=Básico',
    styles: {
      '--bg-color': '#f8f9fa',
      '--panel-bg': '#ffffff',
    },
  },
  // ... (otros temas estáticos)

  // --- TEMAS ANIMADOS ---

  // Atardecer
  {
    id: 'animated-atardecer-dark', name: 'Atardecer', mode: 'dark', type: 'animated',
    previewImage: 'https://placehold.co/120x90/E47A5A/FFFFFF?text=Atardecer',
    backgroundVideo: '/atardecer.mp4',
    styles: { '--bg-color': '#E47A5A', '--panel-bg': 'rgba(40, 25, 20, 0.75)' }
  },
  {
    id: 'animated-atardecer-light', name: 'Atardecer', mode: 'light', type: 'animated',
    previewImage: 'https://placehold.co/120x90/F9D4A6/3E2F2E?text=Atardecer',
    backgroundVideo: '/atardecer.mp4',
    styles: { '--bg-color': '#F9D4A6', '--panel-bg': 'rgba(255, 245, 235, 0.8)' }
  },

  // Ciudad
  {
    id: 'animated-city-dark', name: 'Ciudad Nocturna', mode: 'dark', type: 'animated',
    previewImage: 'https://placehold.co/120x90/1E293B/94A3B8?text=Ciudad',
    backgroundVideo: '/city.mp4',
    styles: { '--bg-color': '#1E293B', '--panel-bg': 'rgba(15, 23, 42, 0.8)' }
  },
  {
    id: 'animated-city-light', name: 'Mañana en la Ciudad', mode: 'light', type: 'animated',
    previewImage: 'https://placehold.co/120x90/D1D5DB/1F2937?text=Ciudad',
    backgroundVideo: '/city.mp4',
    styles: { '--bg-color': '#D1D5DB', '--panel-bg': 'rgba(243, 244, 246, 0.8)' }
  },

  // Cyberpunk
  {
    id: 'animated-cyberpunk-dark', name: 'Cyberpunk', mode: 'dark', type: 'animated',
    previewImage: 'https://placehold.co/120x90/4C0519/F472B6?text=Cyber',
    backgroundVideo: '/cyberpunk.mp4',
    styles: { '--bg-color': '#4C0519', '--panel-bg': 'rgba(50, 5, 20, 0.75)' }
  },
  {
    id: 'animated-cyberpunk-light', name: 'Cyberpunk', mode: 'light', type: 'animated',
    previewImage: 'https://placehold.co/120x90/FBCFE8/831843?text=Cyber',
    backgroundVideo: '/cyberpunk.mp4',
    styles: { '--bg-color': '#FBCFE8', '--panel-bg': 'rgba(253, 232, 243, 0.8)' }
  },

  // Disco
  {
    id: 'animated-disco-dark', name: 'Disco', mode: 'dark', type: 'animated',
    previewImage: 'https://placehold.co/120x90/3B0764/D946EF?text=Disco',
    backgroundVideo: '/disco.mp4',
    styles: { '--bg-color': '#3B0764', '--panel-bg': 'rgba(40, 10, 70, 0.75)' }
  },
  {
    id: 'animated-disco-light', name: 'Disco', mode: 'light', type: 'animated',
    previewImage: 'https://placehold.co/120x90/F5D0FE/581C87?text=Disco',
    backgroundVideo: '/disco.mp4',
    styles: { '--bg-color': '#F5D0FE', '--panel-bg': 'rgba(245, 222, 254, 0.8)' }
  },
  
  // Electro
  {
    id: 'animated-electro-dark', name: 'Electro', mode: 'dark', type: 'animated',
    previewImage: 'https://placehold.co/120x90/075985/38BDF8?text=Electro',
    backgroundVideo: '/electro.mp4',
    styles: { '--bg-color': '#075985', '--panel-bg': 'rgba(8, 47, 73, 0.8)' }
  },
  {
    id: 'animated-electro-light', name: 'Electro', mode: 'light', type: 'animated',
    previewImage: 'https://placehold.co/120x90/E0F2FE/0369A1?text=Electro',
    backgroundVideo: '/electro.mp4',
    styles: { '--bg-color': '#E0F2FE', '--panel-bg': 'rgba(225, 245, 254, 0.8)' }
  },

  // Fuego
  {
    id: 'animated-fuego-dark', name: 'Fuego', mode: 'dark', type: 'animated',
    previewImage: 'https://placehold.co/120x90/7F1D1D/FBBF24?text=Fuego',
    backgroundVideo: '/fuego.mp4',
    styles: { '--bg-color': '#7F1D1D', '--panel-bg': 'rgba(70, 20, 20, 0.75)' }
  },
  {
    id: 'animated-fuego-light', name: 'Fuego', mode: 'light', type: 'animated',
    previewImage: 'https://placehold.co/120x90/FEF3C7/9A3412?text=Fuego',
    backgroundVideo: '/fuego.mp4',
    styles: { '--bg-color': '#FEF3C7', '--panel-bg': 'rgba(254, 243, 199, 0.8)' }
  },

  // Galaxia
  {
    id: 'animated-galaxy-dark', name: 'Galaxia', mode: 'dark', type: 'animated',
    previewImage: 'https://placehold.co/120x90/1E1B4B/A5B4FC?text=Galaxia',
    backgroundVideo: '/galaxy.mp4',
    styles: { '--bg-color': '#1E1B4B', '--panel-bg': 'rgba(30, 27, 75, 0.8)' }
  },
  {
    id: 'animated-galaxy-light', name: 'Galaxia', mode: 'light', type: 'animated',
    previewImage: 'https://placehold.co/120x90/E0E7FF/312E81?text=Galaxia',
    backgroundVideo: '/galaxy.mp4',
    styles: { '--bg-color': '#E0E7FF', '--panel-bg': 'rgba(224, 231, 255, 0.8)' }
  },

  // Nubes
  {
    id: 'animated-nubes-dark', name: 'Nubes', mode: 'dark', type: 'animated',
    previewImage: 'https://placehold.co/120x90/334155/CBD5E1?text=Nubes',
    backgroundVideo: '/nubes.mp4',
    styles: { '--bg-color': '#334155', '--panel-bg': 'rgba(51, 65, 85, 0.8)' }
  },
  {
    id: 'animated-nubes-light', name: 'Nubes', mode: 'light', type: 'animated',
    previewImage: 'https://placehold.co/120x90/F1F5F9/1E293B?text=Nubes',
    backgroundVideo: '/nubes.mp4',
    styles: { '--bg-color': '#F1F5F9', '--panel-bg': 'rgba(241, 245, 249, 0.8)' }
  },

  // Universo
  {
    id: 'animated-universo-dark',
    name: 'Universo',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/0C0A2E/EBEBFF?text=Universo',
    backgroundVideo: '/universo.mp4',
    styles: {
      '--bg-color': '#0C0A2E',
      '--panel-bg': 'rgba(12, 10, 46, 0.75)',
    },
  },
  {
    id: 'animated-universo-light',
    name: 'Universo',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/D8D8FF/0C0A2E?text=Universo',
    backgroundVideo: '/universo.mp4',
    styles: {
      '--bg-color': '#D8D8FF',
      '--panel-bg': 'rgba(235, 235, 255, 0.8)',
    },
  },
];
