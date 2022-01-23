<style scoped>
.codeplugtabs {
}

@media only screen and (max-width: 400px){
  .codeplugtabs > a{
    margin: .5em;
  }
}
@media only screen and (min-width: 401px){
  .codeplugtabs > a{
    margin: 1em 2em;
  }
}
</style>
<template>
  <div class="codeplugtabs">
    <router-link to="manualcps">Channels</router-link>
    <router-link to="contacts">Contacts</router-link>
    <router-link to="settings">Settings</router-link>
    <router-link to="keyloader">Encryption</router-link>
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
  name: "CodeplugTabs",
  props: [],
  components:{
  },
  computed:{
    //...mapState('devtools',['devmode']),
    //...mapState('codeplugs',['current_codeplug']),
  },
  methods: {
    //...mapMutations('codeplugs',['add_codeplug']),
  },
  data(){
    return {
    }
  }
}
</script>
