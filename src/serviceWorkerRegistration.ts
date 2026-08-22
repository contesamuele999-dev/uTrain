// Service Worker Registration for uTrain PWA

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[uTrain PWA] Nuova versione disponibile. Ricarica per aggiornare.');
                } else {
                  console.log('[uTrain PWA] Contenuti memorizzati nella cache per uso offline.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[uTrain PWA] Registrazione Service Worker non riuscita:', error);
        });
    });
  }
}
