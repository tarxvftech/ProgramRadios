<style scoped>
.radiofeaturesmatrix {
}
</style>
<template>
  <div class="radiofeaturesmatrix" hidden>
    (Features matrix in development)
    <br>
    <button>Hamify</button>
    <br>
    <button>FCC Part 90 Compliance</button>
    <br>
    <button>Enable all features lol</button>
    <br>
    Features Grid: [
    <input type="checkbox" v-model="cp['Menu Items']['Manual Dial']" />
    <input type="checkbox" v-model="cp['Menu Items']['VOX']" />
    <input type="checkbox" v-model="cp['Menu Items']['Scan']" />
    <input type="checkbox" v-model="cp['Menu Items']['Squelch']" />
    <input type="checkbox" v-model="cp['Menu Items']['GPS']" />
    <input type="checkbox" v-model="cp['Menu Items']['Program Radio']" />
    ]
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
  name: "RadioFeaturesMatrix",
  props: [],
  components:{
  },
  mounted(){
    window.cp = this.cp;
  },
  computed:{
    //...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    cp(){
      return this.current_codeplug.editor;
    },
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
