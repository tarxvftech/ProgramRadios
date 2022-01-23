<style scoped>
.dmrid {
}
</style>
<template>
  <div class="dmrid">
    DMR ID: <input type="text" v-model="settings['Radio ID']" />
    <div v-if="loggedin">
      <label>Callsign Lookup: </label><input type="text" placeholder="callsign like 'W2FBI'" v-model="ID_search" @input="search" />
      <button @click="search">Search</button>
      <br>
      <button @click="useself">Self ({{callsign}})</button>
    </div>
    <!--<input type="number" v-model="newid" />-->
    <!--<button @click="addID(newid)" >Add by ID</button>-->

    <!--<input type="text" v-model="newcall" />-->
    <!--<button @click="addID(findID(newcall))" >Add by call</button>-->
    
  </div>
</template>
<script>
//TODO: https://vue-select.org/
import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

export default {
  name: "dmrid",
  props: [],
  components:{
  },
  mounted(){
    console.log("If logged in, DMRID.vue should query backend DB for user search");
    console.log("If logged in, DMRID.vue should support a one-click button for own-call.");
  },
  computed:{
    //...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    idmap(){
      return this.callsignmap;
    },
    settings(){
      return this.current_codeplug.editor["General Settings"];
      //["Radio ID"];
    },
    has_codeplug(){
      return this.current_codeplug != undefined;
    }
  },
  methods: {
    findID(name_or_call){
      console.log("findID",name_or_call);
      return this.callsignmap[name_or_call];
    },
    useself(){
      let callids = this.findID(this.callsign);
      if( callids.length ){
        this.settings['Radio ID'] = callids[0];
      }

    }
  },
  data(){
    return {
      callsign:"W2FBI",
      loggedin:false,
      idlist:[],
      callsignlist:[],
      callsignmap:{
        "W2FBI":[3125250,3125404,3125405],
      },
      newcall:null,
      newid:null,
      ID_search: "",
    }
  }
}
</script>
