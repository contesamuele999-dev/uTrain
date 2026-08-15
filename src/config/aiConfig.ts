/**
 * Configurazione Globale Google Gemini AI per uTrain
 * Modello predefinito: Gemini 2.0 Flash Lite (Ultra Veloce, Efficiente e Gratuito)
 */

export const AI_CONFIG = {
  DEFAULT_API_KEY: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
  DEFAULT_MODEL: (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-2.0-flash-lite',
  APP_NAME: 'uTrain AI Coach',
};
