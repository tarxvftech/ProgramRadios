<style scoped>
/*
020202 black
0d324d dark blue
d00000 red
6ea4bf light blue
9da2ab grey
*/
.app {
}
.down {
}
.rest {
}
.nav {
}
.minimenu {
  max-width: 40em;
  height: 2em;
  margin: 0 auto;
  padding: 0 0;
}
.minimenu ul {
  list-style-type: none;
  height: 100%;
  margin: 0 0;
  padding: 0 0;
}
.minimenu ul li {
  float: left;
  padding: 0 1em;
  height: 100%;
}
.devmode {
}
</style>
<template>
  <div class="app">
    <div class="minimenu">
      <ul>
        <li v-if="currentview != 'MainMenu'"> <router-link to="/">Main Menu</router-link> </li>
        <li hidden v-if="currentview != 'MainMenu'"> <router-link to="/select">Codeplugs</router-link> </li>
        <li hidden v-if="currentview != 'MainMenu'"> <router-link to="/flashfirmware">Firmware</router-link> </li>
        <li v-if="currentview != 'MainMenu'"> <router-link to="/about">About</router-link> </li>
        <li v-if="currentview != 'MainMenu'"><Login /> </li>
        <li v-if="currentview != 'MainMenu'"> <ThemeSelect/></li>
        <!--<li> <router-link to="/">Help</router-link> </li>-->
        <!-- a link to a popup video showing what to do on each page -->
        <!--<li>view={{currentview}}</li>-->

        <li v-if="showdev"><button class="devmode aug" data-augmented-ui @click="toggledevmode">Dev {{devmode?1:0}}</button></li>
      </ul>
    </div> <!-- minimenu -->
    <router-view />


  </div> <!-- /app -->
</template>
<script>
import { mapState, mapMutations } from 'vuex';
import ThemeSelect from '@/components/themeselect.vue'
import Login from '@/components/login.vue'

export default {
  name: "App",
  components:{
    ThemeSelect,
    Login
  },
  methods: {
    ...mapMutations('devtools',['toggledevmode']),
  },

  computed:{
    ...mapState('devtools',['devmode']),
    showdev(){
      return ["dev.dmr.tools","localhost","127.0.0.1","test.dmr.tools"].includes(window.location.hostname);
    },
    currentview(){
      return this.$route.name;
    },
  },
  data(){
    return {
    }
  },
}
</script>
