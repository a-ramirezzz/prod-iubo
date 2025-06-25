export interface TimeParts {
  hours: string;
  minutes: string;
  seconds: string;
}
export interface Task {
  id: string;
  text: string;
  completed: boolean;
}
export interface AppSettings {
  backgroundSound: string;
  volume: number;
  startInMiniMode: boolean;
  confirmOnStop: boolean;
  alwaysOnTop: boolean; // Para futuras implementaciones de escritorio
  language: 'es' | 'en';
  themeMode: 'light' | 'dark';
  selectedThemeId: string;
  
}