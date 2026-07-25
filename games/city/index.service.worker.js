// Скрипт-самоликвидатор. Раньше здесь был кеширующий воркер Godot, который
// намертво держал старую сборку. Теперь единственная задача файла — при первом
// же обновлении снести сам себя, очистить все кеши и перезагрузить страницу.
// Свежим посетителям этот воркер не регистрируется (index.html его не подключает).
self.addEventListener('install', function () {
  self.skipWaiting();
});
self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(function (c) { c.navigate(c.url); });
  })());
});
// На всякий случай не кешируем и не перехватываем — отдаём всё в сеть напрямую.
self.addEventListener('fetch', function () {});
