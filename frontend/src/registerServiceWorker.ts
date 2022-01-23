/* eslint-disable no-console */

import { register } from 'register-service-worker'

declare global {
  interface Window {
    needsrefresh: any;
  }
}
window.needsrefresh = false;
//https://stackoverflow.com/questions/40100922/activate-updated-service-worker-on-refresh
//https://forum.quasar-framework.org/topic/2560/solved-pwa-force-refresh-when-new-version-released/23
//https://github.com/vuejs-templates/pwa/issues/70
//https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
//https://stackoverflow.com/questions/51435349/my-pwa-web-app-keep-showing-old-version-after-a-new-release-on-safari-but-works
//https://stackoverflow.com/questions/51435349/my-pwa-web-app-keep-showing-old-version-after-a-new-release-on-safari-but-works
//TODO: need to set caching headers in caddy

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready () {
      console.log(
        'App is being served from cache by a service worker.\n' +
        'For more details, visit https://goo.gl/AFskqB'
      )
    },
    registered () {
      console.log('Service worker has been registered.')
    },
    cached () {
      console.log('Content has been cached for offline use.')
    },
    updatefound () {
      console.log('New content is downloading.')
    },
    updated () {
      console.log('New content is available; please refresh.')
      window.needsrefresh = true;
      //window.location.reload(true);
      //caches.keys().then(function(names) {
        //for (let name of names){
          //caches.delete(name);
        //}
      //});
    },
    offline () {
      console.log('No internet connection found. App is running in offline mode.')
    },
    error (error) {
      console.error('Error during service worker registration:', error)
    }
  })
}
