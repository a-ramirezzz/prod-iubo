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
  startInMiniMode: boolean;
  confirmOnStop: boolean;
  alwaysOnTop: boolean; // Para futuras implementaciones de escritorio
  language: 'es' | 'en';
}