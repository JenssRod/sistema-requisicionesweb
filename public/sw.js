self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🚨 ¡NUEVA REQUISICIÓN ENVIADA DESDE EL SAMBIL!';
  const options = {
    body: data.body || 'Se ha recibido una nueva orden. Haz clic para revisar.',
    icon: '/logo.jpg',
    requireInteraction: true // Mantiene la alerta en pantalla hasta que la atiendan
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});