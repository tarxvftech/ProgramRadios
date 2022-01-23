<style scoped>
.contact {
}
</style>
<template>
  <div class="contact">
    <label>Contact:</label>
    <select @change="select_contact($event)" >
    <!--<option value="0">None</option>--> 
    <!-- contact index 0 is stored as 1 so value 0 can be "no contact" - i think -->
      <option :value="cidx" v-for="(c,cidx) in contacts" :key="cidx" :selected="cidx == idx">
        {{cidx}} {{c["Contact Name"]}} ({{c["Call ID"]}})
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
  name: "Contact",
  props: ["idx"],
  components:{
  },
  mounted(){
    console.error("Rename contact.vue to contact_select.vue or something");
    //TODO rename this component
  },
  computed:{
    //...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    contacts(){
      if( this.has_codeplug ){
        return this.current_codeplug.editor.Contacts;
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
    select_contact($event){
      const idx = $event.target.value;
      //console.log($event,idx);
      this.$emit("select_contact",idx);
    },
  },
  data(){
    return {
    }
  }
}
</script>
