<style scoped>
.codeplug_settings {
}
</style>
<template>
  <div class="codeplug_settings">
    <h2>Codeplug Settings</h2>
    <dmrid />
    <!--<RadioFeaturesMatrix />-->
  </div>
</template>
<script>
//import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';
import dmrid from '@/components/dmrid.vue'
import RadioFeaturesMatrix from '@/components/radiofeaturesmatrix.vue'

export default {
  name: "CodeplugSettings",
  props: [],
  components:{
    dmrid,
    //RadioFeaturesMatrix
  },
  computed:{
    //...mapState('devtools',['devmode']),
    //...mapState('codeplugs',['current_codeplug']),
  },
  methods: {
  },
  data(){
    return {
    }
  }
}
</script>
