// src/app/lib/themes.ts

// Definimos la estructura de un objeto de Tema
export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  type: 'static' | 'animated';
  previewImage: string; // URL para la miniatura en los ajustes
  backgroundVideo?: string;
  styles: {
    '--bg-image'?: string; // El ? indica que es opcional
    '--bg-color': string; // El fondo de color es obligatorio
    '--panel-bg': string;
    // Podemos añadir más variables específicas de tema si es necesario
  };
}

// Array con todos nuestros temas
export const themes: Theme[] = [
  // --- TEMAS OSCUROS ---
  {
    id: 'dark-default',
    name: 'Oscuro Básico',
    mode: 'dark',
    type: 'static',
    previewImage: 'https://placehold.co/100x80/1a1a1a/f0f0f0?text=Básico',
    styles: {
      '--bg-color': '#1a1a1a',
      '--panel-bg': '#242526',
    },
  },
  {
    id: 'ocean-night',
    name: 'Noche Oceánica',
    mode: 'dark',
    type: 'static', 
    previewImage: 'https://placehold.co/100x80/0d1b2a/e0e1dd?text=Océano',
    styles: {
      '--bg-image': 'url("https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?q=80&w=1974&auto=format&fit=crop")',
      '--bg-color': '#0d1b2a',
      '--panel-bg': 'rgba(29, 41, 57, 0.8)',
    },
  },
  {
    id: 'deep-forest',
    name: 'Bosque Profundo',
    mode: 'dark',
    type: 'static', 
    previewImage: 'https://placehold.co/100x80/1A2A22/C4D3CA?text=Bosque',
    styles: {
      '--bg-image': 'url("https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop")',
      '--bg-color': '#1A2A22',
      '--panel-bg': 'rgba(20, 35, 28, 0.85)',
    },
  },
   {
    id: 'neon-noir',
    name: 'Neón Nocturno',
    mode: 'dark',
    type: 'static',
    previewImage: 'https://placehold.co/100x80/2A0A2A/FF00FF?text=Neón',
    styles: {
      '--bg-image': 'url("https://images.unsplash.com/photo-1574871786522-86462e3630a2?q=80&w=2070&auto=format&fit=crop")',
      '--bg-color': '#2A0A2A',
      '--panel-bg': 'rgba(30, 10, 30, 0.8)',
    },
  },
  
  // --- TEMAS CLAROS ---
  {
    id: 'light-default',
    name: 'Claro Básico',
    mode: 'light',
    type: 'static',
    previewImage: 'https://placehold.co/100x80/f8f9fa/212529?text=Básico',
    styles: {
      '--bg-color': '#f8f9fa',
      '--panel-bg': '#ffffff',
    },
  },
  {
    id: 'mint-fresh',
    name: 'Menta Fresca',
    mode: 'light',
    type: 'static',
    previewImage: 'https://placehold.co/100x80/F0FBF6/1F5C3C?text=Menta',
    styles: {
      '--bg-image': 'url("https://images.unsplash.com/photo-1530177150314-e4a79a32252a?q=80&w=2070&auto=format&fit=crop")',
      '--bg-color': '#f0fbf6',
      '--panel-bg': 'rgba(255, 255, 255, 0.85)',
    },
  },
  {
    id: 'parchment',
    name: 'Pergamino',
    mode: 'light',
    type: 'static', 
    previewImage: 'https://placehold.co/100x80/FDF6E3/584C3A?text=Pergamino',
    styles: {
      '--bg-image': 'url("https://images.unsplash.com/photo-1593902381395-928543324ed8?q=80&w=1932&auto=format&fit=crop")',
      '--bg-color': '#fdf6e3',
      '--panel-bg': 'rgba(253, 246, 227, 0.8)',
    },
  },
  {
    id: 'clear-sky',
    name: 'Cielo Despejado',
    mode: 'light',
    type: 'static', 
    previewImage: 'https://placehold.co/100x80/E1F5FE/01579B?text=Cielo',
    styles: {
      '--bg-image': 'url("https://images.unsplash.com/photo-1563630381-55b43b5e4344?q=80&w=1974&auto=format&fit=crop")',
      '--bg-color': '#e1f5fe',
      '--panel-bg': 'rgba(240, 248, 255, 0.85)',
    },
  },

  // --- TEMAS ANIMADOS  ---
  {
    id: 'animated-forest',
    name: 'Bosque Encantado',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/100x80/0d1a0a/90ee90?text=Bosque',
    backgroundVideo: '/bosque.mp4',
    styles: {
      '--bg-color': '#0d1a0a',
      '--panel-bg': 'rgba(20, 35, 28, 0.75)',
    },
  },
  {
    id: 'animated-modern',
    name: 'Flujo Moderno',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/100x80/e0e0e0/333333?text=Moderno',
    backgroundVideo: '/moderno.mp4',
    styles: {
      '--bg-color': '#e0e0e0',
      '--panel-bg': 'rgba(255, 255, 255, 0.7)',
    },
  },
];
