<style scoped>
.keyloader {
}
</style>
<template>
  <div class="keyloader">
    <div v-if="has_codeplug">
      <!-- has code plug -->
      <div v-for="(list,type) of encryption_keys" :key="type">
        <!--{{type}}-->
        <!--{{hashinput[type]}}-->
        <div v-if="! type.startsWith('_') && hashinput[type] ">
          <h3>{{type}}</h3>
          <div v-for="(key,idx) in list" :key="idx">
            <!-- if you use key directly, it's a local variable so it doesn't bind properly -->
            <!-- use idx and index into array instead -->
            <label> Key {{idx}} </label>
            Raw:
            <input type="text" style="font-family:monospace;width:32em;" v-model.lazy="encryption_keys[type][idx]" />
            <br>
            Hash input:
            <input type="text" style="font-family:monospace;width:auto;" v-model="hashinput[type][idx]" @input="hash(type,idx)" @change="hash(type,idx)" />
            SHA256("{{hashinput[type][idx]}}")
          </div>
        </div>
      </div>
    </div>
    <h2 v-else>Please load and select a codeplug</h2>
  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
import codeplugs from '@/libs/codeplug.js';

export default {
  name: "keyloader",
  props: [],
  components:{
  },
  computed:{
    //...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    encryption_keys(){
      if( this.has_codeplug ){
        return this.current_codeplug.editor["Privacy Settings"];
      } 
      return undefined;
    },
    has_codeplug(){
      return this.current_codeplug != undefined;
    }
  },
  mounted(){
    console.log("mounted()");
    //this.init();
  },
  beforeMount(){  //handles a codeplug already having been selected
    console.log("beforeMount()");
    this.init();
  },
  beforeUpdate(){ //handles user selecting a codeplug while already rendered
    console.log("beforeUpdate()");
    //this.init();
  },
  methods: {
    //...mapMutations('codeplugs',['add_codeplug']),
    hash: function(type,idx){
      let bs = codeplugs.js2cstr(this.hashinput[type][idx]); //this has a null byte at the end, which we don't want
      bs = bs.slice(0,bs.length-1); //so remove it before we hash
      console.log(idx,bs);
      //nota bene: crypto.subtle only available with ssl
      crypto.subtle.digest('SHA-256', new Uint8Array(bs)).then(hashbytes=>{
        let key = codeplugs.bytes2hex(new Uint8Array((hashbytes)));
        let max = this.encryption_keys[type][idx].length;
        this.encryption_keys[type][idx] = key.slice(0,max); //enforce max length
        this.$forceUpdate();
      });
    },
    init(){
      if( this.has_codeplug && Object.keys(this.encryption_keys).length != 0 && Object.keys(this.hashinput) == 0){
        console.log( this.encryption_keys );
        window.EK = this.encryption_keys;
        this.types = [];
        for( let type in this.encryption_keys.fields ){
          console.log(type);
          if( type.startsWith("_") ){ continue }
          this.types.push(type);
          this.hashinput[type] = [];
          for( let i = 0; i < this.encryption_keys[type].length; i++ ){
            this.hashinput[type].push("");
          }
        }
      }
    }
  },
  data(){
    return {
      hashinput:{},
      types:[],
    }
  }
}
//TODO: hashinput is cached when switching between codeplugs
</script>
