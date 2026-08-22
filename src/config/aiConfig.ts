/**
 * Configurazione Globale Google Gemini AI per uTrain
 * Modello predefinito: Gemini 3.5 Flash
 */

export const AI_CONFIG = {
  DEFAULT_API_KEY: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
  DEFAULT_MODEL: (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-3.5-flash',
  APP_NAME: 'uTrain AI Coach',
};
