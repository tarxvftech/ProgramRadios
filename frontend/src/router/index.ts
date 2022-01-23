import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import MainMenu from '@/views/Main.vue'
import WebDFURadio from '@/components/webdfuradio.vue'
import Keyloader from '@/components/keyloader.vue'
import DMRID from '@/components/dmrid.vue'
import CodeplugsList from '@/components/codeplugslist.vue'
import ManualCPS from '@/components/manualcps.vue'
import CodeplugSettings from '@/components/codeplug_settings.vue'
import Contacts from '@/components/contacts.vue'
import ChangeLog from '@/views/changelog.vue'
import SingleChannel from '@/components/singlechannel.vue'
import Dev from '@/components/currentdev.vue'
import NotFound from '@/views/notfound.vue'
import Columns from '@/views/Columns.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'MainMenu',
    component: MainMenu
  },
  {
    path: '/changelog',
    name: 'ChangeLog',
    component: ChangeLog
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    //component: () => import([> webpackChunkName: "about" <] '../views/About.vue')
    component: About
  },
  //{
    //path: '/flash/',
    //name: 'Flash',
    //component: Columns
  //},
  {
    path: '/edit/cp/select/',
    name: 'SelectCodeplug',
    component: CodeplugsList,
    children: [
      //TODO Show help/instructions, and once _first_ codeplug is uploaded automatically select it
    ]
  },
  {
    path: '/edit/cp/:id/',
    name: 'Codeplug',
    component: Columns,
    children: [
      {
        path: '',
        name: 'Default',
        //path: ':id',
        component: ManualCPS
        //TODO: codeplug homepage
        
      },
      {
        path: 'manualcps',
        name: 'manualcps',
        //path: ':id',
        component: ManualCPS
        //use this for editing stuff from backend later?
      },
      {
        path: 'settings',
        name: 'settings',
        //path: ':id',
        component: CodeplugSettings
        //use this for editing stuff from backend later?
      },
      {
        path: 'contacts',
        name: 'contacts',
        //path: ':id',
        component: Contacts
        //use this for editing stuff from backend later?
      },
      {
        path: 'keyloader',
        name: 'keyloader',
        //path: ':id',
        component: Keyloader,
        //use this for editing stuff from backend later?
      },
    ],
  },
  {
    path: '/usb/',
    name: 'USB',
    component: Columns,
    children: [
      {
        path: '',
        name: 'USB',
        //path: ':id',
        component: WebDFURadio
        //use this for editing stuff from backend later?
      }
    ],
  },
  //{
    //path: '/componentdev',
    //name: 'Dev',
    //component: Dev
  //},
  //{
    //path: '/usb',
    //name: 'USB',
    //component: WebDFURadio,
  //},
  {
    path: '/flashfirmware',
    name: 'firmware',
    component: WebDFURadio,
  },
  //{
    //path: '/recoverradios',
    //name: 'recover',
    //component: WebDFURadio,
  //},
  //{
    //path: '/keyloader',
    //name: 'Keyloader',
    //component: Keyloader,
  //},
  //{
    //path: '/dmrid',
    //name: 'ID Manager',
    //component: DMRID
  //},
  //{
    //path: '/autocps',
    //name: 'Auto CPS',
    //component: Home
  //},
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
