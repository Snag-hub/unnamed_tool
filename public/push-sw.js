console.log('[push-sw] Custom Worker Loaded');

self.addEventListener('push', function (event) {
    console.log('[push-sw] Push Received');
    let data = { title: 'DayOS Notification', body: 'New alert!', url: '/' };

    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error('[push-sw] JSON Parse Error:', e);
    }

    const options = {
        body: data.body || 'New notification',
        // icon: data.icon, // Commenting out to rule out 404s
        // badge: data.icon,
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1',
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'DayOS', options)
            .catch(err => console.error('[push-sw] Show Notification Error:', err))
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});
