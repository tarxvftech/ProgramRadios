<style >
/* General grid styles */
.icongrid {
  list-style: none;
  padding: 0 0 0 0;
  margin: 0;
  display: grid;
  grid-gap: 1px;
  grid-template-columns: repeat(auto-fill,minmax(18em, 1fr));
}
.icongrid li {
  text-align: center;
  height: 20em;
  display: flex;
  flex-direction: column;
}

.icongrid li a {
  text-transform: uppercase;
  text-decoration:none;
  display: block;
  padding-top: 2em;
  /*height: 100%;*/
  transition: background 0.2s;
  border: none;
}

/* the icon with pseudo class for icon font */
.icongrid img {
  display: inline-block;
  height: 8em;
  transition: transform 0.2s;
  margin-left: auto;
  margin-right: auto;
  /*padding-bottom: 2em;*/
  max-width: 20em;
}
.icongrid h3 {
  margin-top: auto;
  font-size: 2em;
  transition: transform 0.2s;
}

/* category */
.icongrid .description {
  text-transform: uppercase;
  display: inline-block;
  opacity: 0;
  transition: transform 0.15s, opacity 0.1s;
}
/* category */
.icongrid .description img {
  padding: 0;
  margin: 0;
  border: none;
  display: inline;
  float:left;
  margin-top: .5em;
  height: 1em;
}

.icongrid li:hover .description,
.touch .icongrid li .description {
  opacity: 1;
}

.icongrid li > a:hover img {
  transform: translateY(-.2em);
}

.icongrid li > a:hover h3 {
  transform: translateY(-.5em);
}

.icongrid li[disabled] {
  display: none;
}
/*TODO: redo ALL this CSS*/
/*Things jump when scrollbar appears and disappears on page*/

.mini {
  font-size: 2pt; /* because all the values are in em */
  padding: 3px;
}
.mini h3, .mini .description {
  display: none;
}
.mini a {
  width: 100%;
  height: 100%;
  padding: 0 !important;
}
.mini img {
  height: 100%;
  width: auto;
  margin: 0;
  padding: 0;
}
.mnemonic {
  display: none;
}
.mini .description {
  display: none;
}
.mini .mnemonic {
  display: block;
  font-size: 12pt;
  position: relative;
  top: -1em;
}
</style>
<template>
  <div class="home" :class="{mini:mini}" >
    <ul class="icongrid">
      <li :disabled="mini?null:true">
        <router-link to="/">
          <img src="/images/directory.svg" />
          <h3>Main</h3>
          <span class="description">Home page</span>
          <span class="mnemonic">DIR</span>
        </router-link>
      </li>
      <li v-for="link in links" :key="link.path" :disabled="link.disabled && ! devmode?true:null">
        <router-link :to="link.path">
          <img :src="link.img" />
          <h3>{{link.title}}</h3>
          <span class="description" v-html="link.description"></span>
          <span class="mnemonic" v-html="link.mnemonic"></span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'Home',
  props:[
    "mini"
  ],
  components: {
  },
  computed:{
    devmode(){
      return this.$store.state.devtools.devmode;
    }
  },
  data(){
    return {
      links:[
        {
          path:"/usb",
          img:"/images/usb3.svg",
          title:"Read/Write Radio",
          description:'Read and Write codeplugs using USB<br><img src="/images/chrome.svg" alt="chrome browser"/> Chrome browser only',
          mnemonic:"USB",
        },
        {
          path:"/keyloader",
          img:"/images/encryption2.svg",
          title:"Keyloader",
          description:'Convenient and secure encryption key management',
          disabled: false,
          mnemonic:"KEY",
        },
        {
          path:"/dmrid",
          img:"/images/fingerprint.svg",
          title:"DMR ID Manager",
          description:'Auto generate codeplugs with the right IDs for you and your group',
          disabled: true,
          mnemonic:"ID",
        },
        {
          path:"/manualcps",
          img:"/images/hierarchy.svg",
          title:"Channels and Zones",
          description:'',
          disabled: true,
          mnemonic:"CPS",
        },
        {
          path:"/autocps",
          img:"/images/automatically.svg",
          title:"Auto Programmer",
          description:'<img src="/images/m17.svg" alt="M17"/>alpha testing<br> DMR coming soon',
          disabled: true,
          mnemonic:"MAGIC",
        },
      ],
    }
  }
}
</script>
