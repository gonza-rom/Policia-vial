// Service worker mínimo, solo para habilitar la instalación como PWA.
// No cachea nada ni intercepta pedidos: la app sigue requiriendo conexión.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
