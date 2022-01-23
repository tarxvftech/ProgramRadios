<style scoped>
.singlechannel {
  border: 1px solid black;
  display: block;
  width: 100%;
  height: 100%;
  clear: both;
}
.channel_editor {
}
.channel_filter {
  width: 100%;
}
.channel_list {
  border: 1px dashed blue;
  float: left;
  width: 35vw;
  height: 80vh;
  overflow-y: scroll;
}
.zone_filter {
  width: 100%;
}
.zone_list {
  border: 1px dashed red;
  float: left;
  height: 80vh;
  overflow-y: scroll;
  width: 10vw;
}
.zone_editor {
  border: 1px dashed green;
  float: left;
  width: 50vw;
}
</style>
<template>
  <div class="singlechannel">
    <div v-if="has_codeplug">
      <div class="channel_editor" >
        <label>Channel number</label>
        <input type='number' min="0" :max="channels.length-1" v-model.lazy="chanidx"/>
        <!--<button @click="addToZone(chanidx, zoneidx)">Add to current Zone</button>-->
        <!--<div v-for="(chan,chanidx) of channels" :key="chanidx">-->
        <!--<MicroChannel :chanidx="chanidx" :rw="false" />-->
        <!--</div>-->
        <Channel :chanidx="chanidx" :rw="true" />
      </div>
    </div>
    <div v-else>
      <h2>Select a codeplug first</h2>
    </div>
  </div>
</template>
<script>

import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
import Channel from '@/components/channel.vue'
import MicroChannel from '@/components/microchannel.vue'
import Zone from '@/components/zone.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

export default {
  name: "singlechannel",
  props: [],
  components:{
    Channel,
  },
  computed:{
    ...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    filtered_channels(){
      if( this.channel_filter_value ){
        const fs = this.channel_filter_value.split(" ");
        console.log(fs);
        let filter_test = (channel, index)=>{
          const name = channel["Channel Name"];
          const cc = channel["Color Code"];
          const ts = channel["Repeater Slot"];
          const rx = channel["Rx Frequency (MHz)"];
          const tx = channel["Tx Offset (MHz)"];
          const m = channel['Channel Mode'];
          const mode = ["UNK","FM","DMR"][m];
          //const tg = contacts[ channel["Contact Name"] ];
          //TODO: Bug! analog channels can have valid dmr settings and
          //vice versa, so filtering on those attributes doesn't imply
          //a DMR channel and still returns analog channels too!
          //TODO: users would probably expect to be able to search based on what they see, so match against the singleline display also
          for( let f of fs ){
            let flow = f.toLowerCase();
            let test = (
            name.toLowerCase().includes(flow)
              || `CC${cc}` == f
              || `TS${ts}` == f
              //|| `TG${tg}` == f
            || String(rx).includes(f)
            || String(tx).includes(f)
            || mode == f
            || rf.freq_to_band(rx) == f
            );
            if( ! test ){
              return false;
            }
          }
          return true;
        }
        let chans = this.channels.filter(filter_test);
        return chans;
      } else {
        console.log("#nofilter");
        return this.channels;
      }
    },
    channels(){
      if( this.has_codeplug ){
        return this.current_codeplug.editor.Channels;
      } else {
        return [];
      }
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
    //TODO: hovering over a channel in zone should highlight the channel in the channel list
    //TODO: hovering over a channel in channel list should highlight the zones it is in
    //TODO: needs a mobile interface with buttons, drag and drop may not be good here :/
    //TODO: need proper record add/delete for zones and channels, and need it fast
    //...mapMutations('codeplugs',['add_codeplug']),
    forceUpdate(){
      this.$forceUpdate();
    },
    setselectedchannel(newchanidx){
      this.chanidx = newchanidx;
    },
    addToZone(chanidx, zoneidx){
      console.log(`add CH${chanidx} to Z${zoneidx}`);
      //TODO: i need better primites in the editor for this, i think
      //TODO: want a better interface - 
      //  like a Select2 for generating a list of channels to auto-add to a zone
    },
    addzone(){
      let x = this.zones.add();
      this.$forceUpdate(); //TODO why do I need to do this?
      return x;
    },
    delzone(zidx){
      console.log("delete zone",zidx);
      this.zones[zidx].delete();
      this.consolidate();
      this.$forceUpdate(); //TODO why do I need to do this?
    },
    dodragstart(evt, zidx){
      //console.log("start");
      evt.dataTransfer.dropEffect = 'move';
      evt.dataTransfer.effectAllowed = 'move';
      evt.dataTransfer.setData('zidx', zidx); //could be set to a csv entry for the channel i guess
      evt.target.style.opacity = .4;
    },
    dragend(evt){
      evt.target.style.opacity = 1;
    },
    dragdrop(evt, newpos){

      //TODO dragging doesn't actually update the zones, because i am doing shallow overwrites and not actually changing the underlying file

      console.log("drop",evt);
      //evt.target.style.border = "1px solid green";
      const oldpos = parseInt(evt.dataTransfer.getData("zidx"));
      console.log(`move ${oldpos} to ${newpos}`);
      let z = this.zones;

      const temp = z[newpos]; //keep a copy of old channel number in the new position so we don't lose that data
      const target = z[oldpos]; //keep a copy of old channel number in the new position so we don't lose that data

      //zc[oldpos] = temp; //restore non-target channel to old position of target channel //was an early swap option

      //or we can pull, insert, and maintain existing order
      let span = oldpos - newpos;
      if( span > 0 ){ 
        for( let i = oldpos; i > newpos; i-- ){
          console.log(`${i} = ${i-1}`);
          z[i] = z[i-1];
        }
      } else if ( span < 0 ){
        for( let i = oldpos; i < newpos; i++ ){ 
          console.log(`${i} = ${i+1}`);
          z[i] = z[i+1];
        }
      }// else span == 0, so do nothing anyway
      z[newpos] = target; //and finally copy our dragged item
      this.$forceUpdate();
    },
    consolidate(){
      return;
      /*
      let z = this.zones;
      for( let i = 0; i < z.max; i++){
        if( z[i].deleted() ){
          for( let j = i+1; j < z.max; j++ ){
            if( ! z[j].deleted() ){
              console.log(`consolidating j=${j} to i=${i}`)
//need this to be a deep copy, not a pointer overwrite like it is by default
//disabling for now
              z[i] = z[j];
              z[j].delete();
              break;
            }
          }
        }
      }
       */

},
},
  data(){
    return {
      chanidx: 0,
      zoneidx: 0,
      channel_filter_value: "",
    }
  }
}
</script>
