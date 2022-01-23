<style scoped>
</style>
<template>
  <div class="dev" :hidden="showdevtools">
    <button @click="reload" >Reload</button>
    <button @click="debug" >Debug w.el</button>
    <button @click="toggledevmode">TogDevmode</button>
  </div>
</template>
<script>
import { mapMutations } from 'vuex';
export default {
  name: "DevTools",
  props: [],
  computed: {
    showdevtools(){
      return ! ["dev.dmr.tools","localhost","127.0.0.1","test.dmr.tools","demo.dmr.tools"].includes(window.location.hostname);
    },
  },
  methods: {
    ...mapMutations('devtools',['toggledevmode']),
    debug(){
      console.log(this);
      window.el = this.$parent;
    },
    reload(){
      window.document.location.reload();
    },
  },
}
</script>
