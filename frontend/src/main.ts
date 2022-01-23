import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
//import './unregisterServiceWorker'
//


router.afterEach((to,from,failure)=>{
  console.log(to.fullPath);
  //sendToAnalytics(to.fullPath);
})

const a = createApp(App);
a.use(store).use(router).mount('#app');
a.config.globalProperties.$filters = {
  json(v: any){
    return JSON.stringify(v, null, 2)
  }
}

//TODO explain advantage of storing codeplugs in cloud:
//      great for mobile editing and synchronization
