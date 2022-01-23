<style scoped>
.rxgrouplist {
}
</style>
<template>
  <div class="rxgrouplist">
    <label>RXGroupList:</label>
    <select @change="select_rxgrouplist($event)" >
      <option :value="rxgidx" v-for="(rxg,rxgidx) in rxgrouplists" :key="rxgidx" :selected="rxgidx == idx">
      {{rxgidx}} {{rxg["RX Group List Name"]}}
      </option>
    </select>
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
  name: "RXGroupList",
  props: ["idx"],
  components:{
  },
  computed:{
    //...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    rxgrouplists(){
      if( this.has_codeplug ){
        return this.current_codeplug.editor["RX Group Lists"];
      } else {
        return [];
      }
    },
    thischan(){
      return this.channels[this.chanidx];
    },
    thisdef(){
      return this.current_codeplug.def;
    },
    channels(){
      if( this.has_codeplug ){
        return this.current_codeplug.editor.Channels;
      } else {
        return [];
      }
    },
    has_codeplug(){
      return this.current_codeplug != undefined;
    }
  },
  methods: {
    //...mapMutations('codeplugs',['add_codeplug']),
    log(...args){
      console.log(...args);
    },
    select_rxgrouplist($event){
      const idx = $event.target.value;
      //console.log($event,idx);
      this.$emit("select_rxgrouplist",idx);
    },
  },
  data(){
    return {
    }
  }
}
</script>
