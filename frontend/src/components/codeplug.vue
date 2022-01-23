<style scoped>
.codeplug {
  margin: 0;
  overflow-wrap: break-word;
}
.codeplug:hover {
}
.actions * {
  margin: 0px 1em;
}

</style>
<template>
  <div data-augmented-ui class="aug interactive codeplug" @click="select_codeplug(cpidx)" :title="title">
    <span class="actions" >
      <!--<span @click="select_codeplug(cpidx)" :disabled="selected">Select</span>-->
      <!--<button @click="edit_codeplug()">Edit</button>-->
      <!--[><button >Duplicate</button><]-->
      <button class="" @click="download_codeplug(cp)">Download</button>
      <!--<coveredcontrol  covertype="plain" label="⌦">-->
      <span class="control" @click.stop="delete_codeplug">⌦</span>
      <!-- need the .stop because the parent object has an @click and we don't want to propagate to that because it will override our routing to the CP selection page -->
      <!--</coveredcontrol>-->
    </span>
    <span class="filename" >
      {{cp.filename}}
    </span>
    <span class="extra" v-if="selected">
      <div class="dmrid" >
        DMR ID: {{cp.dmrid}}
        <!--DMRID({{cp.dmrid}})-->
      </div>
      <div class="model" >
        Radio: 
      {{cp.model}}
       <!--/ {{cp.editor["Basic Information"]["Model Name"]}}-->
      </div>
    </span>
  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex';
import { save_data } from '@/libs/misc.js';
import coveredcontrol from '@/components/coveredcontrol.vue'
export default {
  name: "CodeplugCom",
  props: ['cp','cpidx'],
  components: {
    //coveredcontrol,
  },
  computed: {
    ...mapState('codeplugs',['loaded_codeplugs','current_codeplug']),
    title(){
      return `${this.cp.model} ${this.cp.dmrid} ${this.cp.filename}`;
    },
    selected(){
      return this.cp == this.current_codeplug;
    },
    ...mapState('codeplugs',['loaded_codeplugs','current_codeplug']),
    safeForOEM(){
      //TODO specific to TYT RDT
      //specific to TYT codeplugs, sorry!
      const header = this.cp.rdt.slice(0,5);
      return false;
    },
  },
  methods: {
    ...mapMutations('codeplugs',['add_codeplug','select_codeplug','clear_codeplugs','set_definitions']),
    delete_codeplug(){
      console.log("WHAT THE SHIT");
      let wasthis = this.cp == this.current_codeplug;
      console.log("wasthis=",wasthis);
      this.$store.commit('codeplugs/delete_codeplug',this.cpidx);
      //need to fix this to handle URLs properly
      if( wasthis ){ //if we deleted the codeplug we're on, we need to reflect that and navigate somewhere else
        this.$router.push('/edit/cp/select');
        window.t = this
      }//else our view shouldn't change
    },
    edit_codeplug(){
      throw new Error("dont use edit_codeplug unless CPS handles URL for select_codeplug");
      /*
      this.select_codeplug(this.cpidx);
      let url = `/edit/${this.cpidx}`;
      console.log(url);
      this.$router.push(url);
      */
    },
    download_codeplug(cp){
      console.error("Warning: This codeplug may not have the necessary metadata to be used with the TYT CPS software.");
      window.cp = cp;
      //TODO detect if we have header data or not
      //show download if we do, show warning and download if we don't
      save_data(cp.rdt, cp.filename);
    },
  },
  data(){
    return {
    }
  }
}
</script>
