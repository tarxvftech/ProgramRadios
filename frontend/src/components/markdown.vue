<style scoped>
.markdown {
}
</style>
<template>
  <div class="markdown">
    <span v-html="renderedmarkdown"></span>
  </div>
</template>
<script>
//import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';
import markdown from 'markdown-it';

const md = markdown({
  html:         false,        // Enable HTML tags in source
  xhtmlOut:     false,        // Use '/' to close single tags (<br />).
  breaks:       false,        // Convert '\n' in paragraphs into <br>
  linkify:      false,        // Autoconvert URL-like text to links
});
console.log(md);
export default {
  name: "markdown",
  props: ['src'],
  components:{
  },
  computed:{
    renderedmarkdown(){
      //const first = this.$slots.default()[0];
      //console.log(first);
      //return md.render(first.children);
      return md.render(this.src);
    }
  },
  methods: {
  },
  data(){
    return {
    }
  }
}
</script>
