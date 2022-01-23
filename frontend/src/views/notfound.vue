<style scoped>
li h4 {
  display: inline-block;
}
</style>
<template>
  <div class="notfound">
    <markdown :src="src">
    </markdown>
  </div>
</template>
<script>
//TODO use a markdown editor from now on somehow
//https://github.com/JanGuillermo/vue3-markdown-it
//markdown-it, etc
import markdown from '@/components/markdown.vue'
const txt=`
# Page Not found
`
export default {
  components: {
    markdown
  },
  data(){
    return {
      src:txt
    }
  }
}
</script>
<style>
</style>
