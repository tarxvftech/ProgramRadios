<style scoped>
.disco {
}
</style>
<template>
  <div class="disco">
    <select v-model="connected">
      <option value="true">true</option>
      <option value="false">false</option>
    </select>
    <div>
    {{connected}}
    </div>
  </div>
</template>
<script>
//import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
import { wait_for } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

export default {
  name: "disco",
  props: [],
  created(){
    this.run();
  },
  components:{
  },
  computed:{
    //...mapState('devtools',['devmode']),
    //...mapState('codeplugs',['current_codeplug']),
  },
  methods: {
    //...mapMutations('codeplugs',['add_codeplug']),
    async run(){
      await wait_for(1000);
      this.connected = false;
    }
  },
  data(){
    return {
      connected: true,
    }
  }
}
</script>
