<style scoped>
.themeselect {
}
</style>
<template>
  <div class="themeselect">
    Theme: 
    <span v-for="themename of themes" :key="themename">
      <input type="radio" name="theme" @change="select(themename)" :value="themename" :checked="current_theme==themename">
    </span>
  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

export default {
  name: "themeselect",
  props: [],
  components:{
  },
  created(){
    let t = window.localStorage.getItem("theme");
    if( t == undefined ){
      t = "light";
    } 
    this.select(t);
  },
  computed:{
    ...mapState('themes',['current_theme','themes']),
    //...mapState('codeplugs',['current_codeplug']),
  },
  methods: {
    ...mapMutations('themes',['select_theme']),
    select(themename){
      console.log(themename);
      let sheet = document.createElement('link')
      sheet.rel = "stylesheet";
      sheet.href="/themes/" + themename + ".css";
      sheet.id="theme";
      document.body.appendChild(sheet);
      window.localStorage.setItem("theme", themename);
      this.select_theme(themename);
      let sheets = document.querySelectorAll('link#theme');
      for( let i = 0; i < sheets.length-1; i++ ){
        sheets[i].remove();
      }
    }
  },
  data(){
    return {
    }
  }
}
</script>
