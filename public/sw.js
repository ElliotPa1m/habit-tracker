// self.addEventListener('install', e => self.skipWaiting())
// self.addEventListener('activate', e => e.waitUntil(clients.claim()))

// self.addEventListener('push', e => {
//     const data = e.data?.json() || {}
//     e.waitUntil(
//         self.registration.showNotification(data.title || 'Habit Tracker', {
//             body: data.body || 'Time to check your habits!',
//             icon: '/icon-192.png',
//             badge: '/icon-192.png'
//         })
//     )
// })