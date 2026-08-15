/**
 * Configurazione Globale Google Gemini AI per uTrain
 * La chiave configurata qui (o tramite variabile d'ambiente VITE_GEMINI_API_KEY)
 * viene utilizzata automaticamente per tutti gli utenti senza necessità di richiederla nel browser.
 */

export const AI_CONFIG = {
  // Se presente una variabile d'ambiente VITE_GEMINI_API_KEY, usa quella; altrimenti usa la chiave statica predefinita
  DEFAULT_API_KEY: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
  DEFAULT_MODEL: 'gemini-1.5-flash',
  APP_NAME: 'uTrain AI Coach',
};
