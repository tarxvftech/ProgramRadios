<style scoped>
.zone {
}
.name {
}
.AChannels {
}
.BChannels {
}
.entry {
  width: 100%;
}
</style>
<template>
  <div class="zone">
    <!--<button @click="debug">debug</button>-->
    <div class="name">
      <label>Zone {{zoneidx}}</label>
      <label>Zone Name:</label><input type="text" v-model.lazy="thiszone['Zone Name']" @change="updateParent" />
    </div>
    <coveredcontrol covertype="plain" label="CLEAR ZONE">
      <button style="width:100%; margin: auto;" @click="clear_zone">Clear Zone</button>
    </coveredcontrol>
    <h4>Channels in Zone</h4>

    <div class="Channels" >
      <div class="entry draggable" v-for="(chanidx,zonechanidx) in channels" :key="zonechanidx" 
                         draggable="true" 
                         @dragstart="dodragstart($event, zonechanidx)"
                         @dragend="dragend"
                         @dragover.prevent
                         @dragenter.prevent="dragenter"
                         @dragleave.prevent="dragleave"
                         @drop.capture="dragdrop($event, zonechanidx)"
                         >
                         <!--{{chanidx-1}}-->
        <!--<button @click="select(chanidx-1)">Modify</button>-->
        <!--<Channel @click="select(chanidx-1)" v-if="chanidx!=0" :chanidx="chanidx-1" :rw='false' :onlyname="true" />-->
        <span class="textinteractive control" @click="zonermchan(zonechanidx)">⌦ </span>
        <!--<span class="control">🖉 </span>-->
        <!--{{chanidx}},{{zonechanidx}}-->
        <MicroChannel v-if="chanidx!=0" :chanidx="chanidx-1" :rw="false" :onlyname="true" />
        <span v-else>(Empty)</span>
        <!--<button @click="">del from zone</button>-->
      </div>
    </div>

  </div>
</template>
<script>
//TODO: make channels draggable within zone
//TODO: allow for automatic A/B copying, so A and B are equal and zones are simpler


//https://github.com/anish2690/vue-draggable-next/blob/master/src/VueDraggableNext.ts
import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
import Channel from '@/components/channel.vue'
import MicroChannel from '@/components/microchannel.vue'
import coveredcontrol from '@/components/coveredcontrol.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

export default {
  name: "zone",
  props: ['zoneidx'],
  components:{
    //Channel,
    MicroChannel,
    coveredcontrol,
  },
  computed:{
    //...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    ABChannels(){
      return this.thiszone && Object.keys(this.thiszone).includes("A Channels");
    },
    thiszone(){
      return this.zones[this.zoneidx];
    },
    channels(){
      //console.log(this);
      let x =(key)=>this.thiszone[key];
      //x= (key)=>this.thiszone[key].filter(x=>x!=0);
      //console.log("channels", x('Channels'));
      return x('Channels');
    },
    zones(){
      if( this.has_codeplug ){
        return this.current_codeplug.editor.Zones;
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
    debug(){
      console.log(this);
    },
    updateParent(){
      this.$parent.$forceUpdate();
    },
    select(chanidx){
      this.$emit('selectchannel', chanidx);
    },
    zonermchan(zonechanidx){
      let z = this.zones[this.zoneidx];
      let zc = z.Channels;
      console.log("del",zonechanidx);
      zc[zonechanidx] = 0;
      this.consolidate();
    },
    clear_zone(){
      let z = this.zones[this.zoneidx];
      let zc = z.Channels;
      console.log(zc.max);
      for( let i = 0; i < zc.max; i++ ){
        zc[i] = 0;
      }
      this.consolidate();
    },
    consolidate(){
      //console.log("CONSOLIDATE CHANNELS");
      let key = "Channels";
      let z = this.zones[this.zoneidx];
      let zc = z.Channels;
      for( let i = 0; i < zc.max; i++){
        //console.log("cons i: ",i);
        if( zc[i] == 0 ){
          for( let j = i+1; j < zc.max; j++ ){
            //console.log("cons j: ",j);
            if( zc[j] != 0 ){
              zc[i] = zc[j];
              zc[j] = 0;
              break;
            }
          }
        }
      }
      this.updateParent();
      this.$forceUpdate();

    },
    dodragstart(evt, zchanidx){
      //console.log("start");
      evt.dataTransfer.dropEffect = 'move';
      evt.dataTransfer.effectAllowed = 'move';
      evt.dataTransfer.setData('zchanidx', zchanidx); //could be set to a csv entry for the channel i guess
      evt.dataTransfer.setData('zidx', this.zoneidx); //could be set to a csv entry for the channel i guess
      evt.target.style.opacity = .4;
    },
    dragend(evt){
      evt.target.style.opacity = 1;
    },
    dragdrop(evt, newpos){
      console.log("drop",evt);
      //evt.target.style.border = "1px solid green";
      const oldpos = parseInt(evt.dataTransfer.getData("zchanidx"));
      console.log(`move ${oldpos} to ${newpos}`);
      let z = this.zones[this.zoneidx];
      let zc = z.Channels;

      const temp = zc[newpos]; //keep a copy of old channel number in the new position so we don't lose that data
      const target = zc[oldpos]; //keep a copy of old channel number in the new position so we don't lose that data

      //zc[oldpos] = temp; //restore non-target channel to old position of target channel //was an early swap option

      //or we can pull, insert, and maintain existing order
      let span = oldpos - newpos;
      if( span > 0 ){ 
        for( let i = oldpos; i > newpos; i-- ){
          console.log(`${i} = ${i-1}`);
          zc[i] = zc[i-1];
        }
      } else if ( span < 0 ){
        for( let i = oldpos; i < newpos; i++ ){ 
          console.log(`${i} = ${i+1}`);
          zc[i] = zc[i+1];
        }
      }// else span == 0, so do nothing anyway
      zc[newpos] = target; //and finally copy our dragged item
      this.consolidate();
    },
  },
  data(){
    return {
    }
  }
}
</script>
