<style scoped>
.login-menu {
}
</style>
<template>
  <div class="login-menu" hidden>
    <span v-if="online && loggedin"><a href="https://dev.dmr.tools/accounts/profile/">Profile</a></span>
    <span hidden v-if="online && loggedin"><a href="https://dev.dmr.tools/accounts/logout/?next=/">Logout</a></span>
    <span v-if="online && !loggedin"><a href="https://dev.dmr.tools/accounts/login/?next=/">Login</a></span>
    <span v-if="!online">Offline ({{offline_reason}})</span>
  </div>
</template>
<script>
//import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

export default {
  name: "login",
  props: [],
  components:{
  },
  computed:{
    //...mapState('devtools',['devmode']),
    //...mapState('codeplugs',['current_codeplug']),
  },
  methods: {
    //...mapMutations('codeplugs',['add_codeplug']),
    async remote_main_api_version(){
      const uri = "/cheep/version/";
      const version_regex = /^\d+\.\d+\.\d+$/;
      try {
        const p = await fetch(uri);
        console.log(p);
        if( ! p.ok ){
          this.offline_reason = p.statusText;
          return false;
        }
        const r = await p.blob();
        console.log(r);
        const version = await r.text();
        if( version.size < 20 ){
          console.log(version);
        }
        if( version.match( version_regex ) ){
          return true;
        } else {
          this.offline_reason = "API nonsensical";
          return false;
        }
      } catch (e) {
        console.log(e);
        this.offline_reason = e;
        return false;
      }
    },
    async checkonline(){
      console.log("online check");
      this.online = await this.remote_main_api_version();
      if( this.online ){
        this.checkloggedin();
      } 
    },
    async checkloggedin(){
      console.log("login check");
      this.loggedin = true;
    },
    async login(){
      console.log("login attempt");
    },
    async logout(){
      console.log("logout attempt");
    }
  },
  created(){
    this.checkonline();
  },
  data(){
    return {
      loggedin: false,
      online: false,
      offline_reason: ""
    }
  }
}
</script>
