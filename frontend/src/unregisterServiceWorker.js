navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
        Promise.all(registrations.map((r) => r.unregister())),
    )
