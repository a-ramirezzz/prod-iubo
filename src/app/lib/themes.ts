// src/app/lib/themes.ts

export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  type: 'static' | 'animated';
  previewImage: string;
  backgroundVideo?: string;
  styles: {
    // Estilos existentes
    '--bg-color': string;
    '--panel-bg': string;
    '--bg-image'?: string;

    // --- NUEVOS ESTILOS OPCIONALES POR TEMA ---
    '--text-highlight-color'?: string; // Color para el contador y títulos
    '--text-shadow'?: string;          // Sombra/contorno para el texto
    '--button-accent-bg'?: string;     // Color de acento para botones
  };
}

// Array con todos nuestros temas
export const themes: Theme[] = [
  // --- TEMAS ESTÁTICOS ---
  {
    id: 'dark-default',
    name: 'Oscuro Básico',
    mode: 'dark',
    type: 'static',
    previewImage: 'https://placehold.co/120x90/1a1a1a/f0f0f0?text=Básico',
    styles: {
      '--bg-color': '#1a1a1a',
      '--panel-bg': '#242526',
      '--text-highlight-color': '#f0f0f0', // Texto blanco/claro
      '--text-shadow': 'none',
      '--button-accent-bg': '#333', // Botones gris oscuro
    },
  },
  {
    id: 'light-default',
    name: 'Claro Básico',
    mode: 'light',
    type: 'static',
    previewImage: 'https://placehold.co/120x90/f8f9fa/212529?text=Básico',
    styles: {
      '--bg-color': '#f8f9fa',
      '--panel-bg': '#ffffff',
      '--text-highlight-color': '#212529', // Texto oscuro
      '--text-shadow': 'none',
      '--button-accent-bg': '#f8f9fa', // Botones claros
    },
  },
  
  // --- TEMAS ANIMADOS CON ESTILOS ---

  // Atardecer (Claro): Texto blanco con sombra oscura y cálida mejorada para mayor visibilidad.
  {
    id: 'animated-atardecer-light',
    name: 'Atardecer',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/F9D4A6/3E2F2E?text=Atardecer',
    backgroundVideo: '/atardecer.mp4',
    styles: { 
      '--bg-color': '#F9D4A6',
      '--panel-bg': 'rgba(255, 245, 235, 0.8)',
      '--text-highlight-color': '#ffffff', // Texto blanco para contraste
      '--text-shadow': '0 0 10px rgba(62, 47, 46, 0.8), 0 0 20px rgba(62, 47, 46, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)' // Contorno mejorado y más visible
    }
  },
  {
    id: 'animated-atardecer-dark',
    name: 'Atardecer',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/E47A5A/FFFFFF?text=Atardecer',
    backgroundVideo: '/atardecer.mp4',
    styles: {
      '--bg-color': '#E47A5A',
      '--panel-bg': 'rgba(40, 25, 20, 0.75)',
      '--text-highlight-color': '#ffffff',
      '--text-shadow': '0 2px 8px rgba(0, 0, 0, 0.5)',
    },
  },

  // Ciudad (Claro y Oscuro): Texto blanco con sombra oscura mejorada para mayor visibilidad.
  {
    id: 'animated-city-light',
    name: 'Mañana en la Ciudad',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/D1D5DB/1F2937?text=Ciudad',
    backgroundVideo: '/city.mp4',
    styles: {
      '--bg-color': '#D1D5DB',
      '--panel-bg': 'rgba(243, 244, 246, 0.8)',
      '--text-highlight-color': '#ffffff', // White text for contrast against varied background colors
      '--text-shadow': '0 0 15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.4)' // Enhanced outline for better visibility against yellow, blue, gray, and black backgrounds
    }
  },
  {
    id: 'animated-city-dark',
    name: 'Ciudad Nocturna',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/1E293B/94A3B8?text=Ciudad',
    backgroundVideo: '/city.mp4',
    styles: { 
      '--bg-color': '#1E293B',
      '--panel-bg': 'rgba(15, 23, 42, 0.8)',
      '--text-highlight-color': '#FFFFFF', // White text for maximum contrast
      '--text-shadow': '0 0 12px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 0, 0, 0.7), 0 2px 6px rgba(0, 0, 0, 0.5)', // Enhanced outline for better prominence against varied city colors
      '--button-accent-bg': '#38bdf8'
    }
  },

  // Cyberpunk (Claro y Oscuro): Tema futurista con colores dinámicos y llamativos
  {
    id: 'animated-cyberpunk-light',
    name: 'Cyberpunk',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/FBCFE8/831843?text=Cyber',
    backgroundVideo: '/cyberpunk.mp4',
    styles: { 
      '--bg-color': '#FBCFE8', // Light pink background to complement the video
      '--panel-bg': 'rgba(15, 15, 25, 0.85)', // Dark panel with high opacity for contrast against pink/yellow/black background
      '--text-highlight-color': '#FF1493', // Strong deep pink for maximum visibility without blurry glow
      '--text-shadow': '0 2px 4px rgba(0, 0, 0, 0.8)', // Simple sharp shadow for definition without blur
      '--button-accent-bg': '#FF00FF' // Magenta accent for buttons to create vibrant contrast with strong pink timer
    }
  },
  {
    id: 'animated-cyberpunk-dark',
    name: 'Cyberpunk',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/4C0519/F472B6?text=Cyber',
    backgroundVideo: '/cyberpunk.mp4',
    styles: { 
      '--bg-color': '#4C0519', // Dark background to complement the video
      '--panel-bg': 'rgba(20, 20, 30, 0.9)', // Very dark panel with high opacity for maximum contrast
      '--text-highlight-color': '#FF1493', // Strong deep pink for maximum visibility without blurry glow
      '--text-shadow': '0 2px 4px rgba(0, 0, 0, 0.9)', // Simple sharp shadow for definition without blur
      '--button-accent-bg': '#FF00FF' // Bright magenta for vibrant button contrast with strong pink timer
    }
  },

  // Disco (Claro y Oscuro)
  {
    id: 'animated-disco-light',
    name: 'Disco',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/F5D0FE/581C87?text=Disco',
    backgroundVideo: '/disco.mp4',
    styles: { 
      '--bg-color': '#F5D0FE',
      '--panel-bg': 'rgba(245, 222, 254, 0.8)',
      '--text-highlight-color': '#ffffff',
      '--text-shadow': '0 0 10px rgba(88, 28, 135, 0.6)'
    }
  },
  {
    id: 'animated-disco-dark',
    name: 'Disco',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/3B0764/D946EF?text=Disco',
    backgroundVideo: '/disco.mp4',
    styles: { 
      '--bg-color': '#3B0764',
      '--panel-bg': 'rgba(40, 10, 70, 0.75)',
      '--text-highlight-color': '#FFFFFF',
      '--text-shadow': '0 0 15px rgba(0,0,0,0.7)',
      '--button-accent-bg': '#d946ef'
    }
  },

  // Electro (Claro y Oscuro): Tema energético con colores vibrantes para música electrónica
  {
    id: 'animated-electro-light',
    name: 'Electro',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/E0F2FE/0369A1?text=Electro',
    backgroundVideo: '/electro.mp4',
    styles: { 
      '--bg-color': '#E0F2FE', // Light blue background to complement the video
      '--panel-bg': 'rgba(10, 10, 15, 0.9)', // Very dark panel for maximum contrast against black/reddish background
      '--text-highlight-color': '#FFD700', // Bright yellow for energetic timer display - contrasts well with black and red backgrounds
      '--text-shadow': '0 0 15px rgba(255, 215, 0, 0.8), 0 0 25px rgba(255, 215, 0, 0.6)', // Glowing yellow outline for energetic effect
      '--button-accent-bg': '#FF4500' // Electric orange for vibrant button contrast with yellow timer
    }
  },
  {
    id: 'animated-electro-dark',
    name: 'Electro',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/075985/38BDF8?text=Electro',
    backgroundVideo: '/electro.mp4',
    styles: { 
      '--bg-color': '#075985', // Dark blue background to complement the video
      '--panel-bg': 'rgba(5, 5, 10, 0.95)', // Very dark panel for maximum contrast against black/reddish background
      '--text-highlight-color': '#FFD700', // Bright yellow for maximum energy and visibility against dark background
      '--text-shadow': '0 0 20px rgba(255, 215, 0, 0.9), 0 0 30px rgba(255, 215, 0, 0.7)', // Intense yellow glow for dramatic energetic effect
      '--button-accent-bg': '#FF4500' // Electric orange for vibrant button contrast with yellow timer
    }
  },

  // Fuego (Claro y Oscuro): Tema con colores cálidos y energéticos
  {
    id: 'animated-fuego-light',
    name: 'Fuego',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/FEF3C7/9A3412?text=Fuego',
    backgroundVideo: '/fuego.mp4',
    styles: { 
      '--bg-color': '#FEF3C7', // Light background to complement the video
      '--panel-bg': 'rgba(254, 243, 199, 0.8)', // Panel background for contrast
      '--text-highlight-color': '#FBBF24', // Golden yellow timer color - same as dark mode for consistency
      '--text-shadow': '0 0 8px rgba(0, 0, 0, 0.9)', // Black shadow - same as dark mode for consistency
    }
  },
  {
    id: 'animated-fuego-dark',
    name: 'Fuego',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/7F1D1D/FBBF24?text=Fuego',
    backgroundVideo: '/fuego.mp4',
    styles: { 
      '--bg-color': '#7F1D1D',
      '--panel-bg': 'rgba(70, 20, 20, 0.75)',
      '--text-highlight-color': '#FBBF24',
      '--text-shadow': '0 0 8px rgba(0,0,0,0.9)',
    }
  },
  
  // Galaxia (Claro y Oscuro)
  {
    id: 'animated-galaxy-light',
    name: 'Galaxia',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/E0E7FF/312E81?text=Galaxia',
    backgroundVideo: '/galaxy.mp4',
    styles: { 
      '--bg-color': '#E0E7FF',
      '--panel-bg': 'rgba(224, 231, 255, 0.8)',
      '--text-highlight-color': '#ffffff',
      '--text-shadow': '0 0 10px rgba(49, 46, 129, 0.6)'
    }
  },
  {
    id: 'animated-galaxy-dark',
    name: 'Galaxia',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/1E1B4B/A5B4FC?text=Galaxia',
    backgroundVideo: '/galaxy.mp4',
    styles: { 
      '--bg-color': '#1E1B4B',
      '--panel-bg': 'rgba(30, 27, 75, 0.8)',
      '--text-highlight-color': '#FFFFFF',
      '--text-shadow': '0 0 10px rgba(224, 231, 255, 0.5)'
    }
  },

  // Nubes (Claro y Oscuro)
  {
    id: 'animated-nubes-light',
    name: 'Nubes',
    mode: 'light',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/F1F5F9/1E293B?text=Nubes',
    backgroundVideo: '/nubes.mp4',
    styles: { 
      '--bg-color': '#F1F5F9',
      '--panel-bg': 'rgba(241, 245, 249, 0.8)',
      '--text-highlight-color': '#ffffff',
      '--text-shadow': '0 2px 8px rgba(30, 41, 59, 0.6)'
    }
  },
  {
    id: 'animated-nubes-dark',
    name: 'Nubes',
    mode: 'dark',
    type: 'animated',
    previewImage: 'https://placehold.co/120x90/334155/CBD5E1?text=Nubes',
    backgroundVideo: '/nubes.mp4',
    styles: {
      '--bg-color': '#334155',
      '--panel-bg': 'rgba(51, 65, 85, 0.8)',
      '--text-highlight-color': '#ffffff',
      '--text-shadow': '0 2px 8px rgba(0, 0, 0, 0.5)',
    },
  },

  // Universo (Claro y Oscuro)
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
      '--text-highlight-color': '#ffffff',
      '--text-shadow': '0 0 10px rgba(12, 10, 46, 0.6)'
    }
  },
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
      '--text-highlight-color': '#fefce8',
      '--text-shadow': '0 0 10px rgba(0, 0, 0, 0.8)',
      '--button-accent-bg': '#facc15'
    }
  },
];
