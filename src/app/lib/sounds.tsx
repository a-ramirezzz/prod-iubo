// src/app/lib/sounds.tsx
import React, { JSX } from 'react'; // Buena práctica para archivos .tsx

// Definimos la estructura de un objeto de Sonido
export interface Sound {
  id: string; // Corresponderá al nombre del archivo sin extensión
  name: string;
  src: string;
  icon: JSX.Element;
}

// Un objeto para acceder a los iconos fácilmente
const ICONS = {
  Leaf: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 4 13H2a10 10 0 0 0 10 10z" /><path d="M12 4a10 10 0 0 0-10 10h2A7 7 0 0 1 11 4z" /></svg>,
  Sun: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Music: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M6 12c0-1.7.7-3.2 1.8-4.2"/><path d="M12 6c1.7 0 3.2.7 4.2 1.8"/></svg>,
  Rocket: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.05-3.05A7.01 7.01 0 0 0 4.5 16.5z"/><path d="m12 15-3-3a7 7 0 0 1 3-9 7 7 0 0 1 6.5 4c0 2.5-1.47 5.4-7 6.5z"/></svg>,
  CloudRain: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>,
  None: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="5" x2="19" y2="19" /></svg>
};

// Array con todos los sonidos disponibles
export const sounds: Sound[] = [
  { id: 'noche-campo', name: 'Noche en el Campo', src: '/noche-campo.mp3', icon: ICONS.Leaf },
  { id: 'nuevo-dia', name: 'Nuevo Día', src: '/nuevo-dia.mp3', icon: ICONS.Sun },
  { id: 'noche-de-disco', name: 'Noche de Disco', src: '/noche-de-disco.mp3', icon: ICONS.Music },
  { id: 'espacio', name: 'Espacio Sideral', src: '/espacio.mp3', icon: ICONS.Rocket },
  { id: 'lluvia-relajante', name: 'Lluvia Relajante', src: '/lluvia-relajante.mp3', icon: ICONS.CloudRain },
];

// Opción para no tener sonido
export const noSound: Sound = { id: 'none', name: 'Ninguno', src: '', icon: ICONS.None };
