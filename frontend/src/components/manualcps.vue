<style scoped>
.highlight {
  color: var(--interaction-hover);
  background-color: var(--interaction-hover-background);
}
.manualcps {
  z-index: 150;
  border: 1px solid black;
}
.channel_editor {
}
.channel_filter {
  width: 100%;
}
.channel_list {
}
.channel_list:hover {

}
.zone_filter {
  width: 100%;
}
.zone_list {
  min-width: 7em;
}
.editor {
  min-width: 16em;
}
.channels.warnings {
}
.channels.controls {
  margin-bottom: 1em;
}
.channel span.control {
  margin: 0em .15em;
}
@media only screen and (max-width: 1200px){
  .pane {
    display: grid;
    //grid: 100% / 1fr;
  }
}
@media only screen and (min-width: 1201px){
  .pane {
    display: grid;
    grid: 100% / 32em 7em auto;
  }
}
.pane > * {
  max-height: 100vh;
  max-height: calc(100vh - 7em);
  overflow-y: scroll;
  -border: 1px solid black;
}
.addall {
  padding: .1em .2em;
}

.helptext {
  max-width: 800px;
  padding-left: 2em;
}

.channel_list, .zone_list, .editor {
  border: 1px inset grey;
}
</style>
<template>
  <div class="manualcps">
    <!--<button @click="debug">debug</button>-->
    <div class="pane" v-if="has_codeplug">
      <div class="channel_list">
        <label>Channels</label>
        <div class="channels warnings">
          <div v-if="channels.max > 1000">
            Note: filtering can be slow with large codeplugs like this one
          </div>
          <div v-if="channels.max > 1000">
            Note: Zone/Channel hover highlights disabled
          </div>
        </div>
        <div class="channels controls">
          <input placeholder="filter" type="filter" class="channel_filter" v-model="channel_filter_value" />
          <span data-augmented-ui class="aug control interactive addall" 
                @click="addallchanstozone()" 
                v-if="channel_filter_value.length > 0">
            + add all visible to zone (until full)
          </span>
          <coveredcontrol v-if="channel_filter_value.length > 0" covertype="plain" label="DEL ALL VIS">
            <span class="control interactive " 
                  @click="delallchans()" 
                  v-if="channel_filter_value.length > 0">
              ⌦ delete all visible channels
            </span>
          </coveredcontrol>
        </div>
        <!-- TODO: options like UHF, VHF, 2m, 70cm, specific frequency, CC, talkgroups, etc -->
        <!-- this is also where I'll support filtering by tags! -->
        <!-- all in plain text! -->
        <!-- https://stackoverflow.com/questions/777455/is-there-a-query-language-for-json -->
        <div v-for="(chan,cidx) of filtered_channels" :key="chan.ridx" 
             @mouseover="hover_chan(chan)" :id="`chan_${cidx}`"
             class="channel textinteractive"
             :class="{ highlight: (!edit_zone && chan.ridx == chanidx) || highlightchans.includes(cidx) }"
             >
             <!-- mousover disabled because it was interrupting scrolling on large codeplugs even when just console.log-ing -->
          <!--{{String(cidx).padStart(4,"0")}}-->
          <span class="" v-if="! chan.deleted" >
            <span class="textinteractive control" @click="chandel(chan)">⌦</span>
            <span class="textinteractive control" @click="chanedit(chan)">🖉</span>
            <span class="textinteractive control" @click="addchantozone(chan)">+</span>
            <!--<span class="control" @click="addchantozone(chan)">＋+➕</span>-->

            <MicroChannel class="" :chanidx="chan.ridx" :rw="true" />
          </span>
          <span class="textinteractive" v-else @click="chanundel(chan)">
            <!--<span class="control" @click="chanundel(chan)">+ </span>-->
            (empty channel, click to add)
          </span>
        </div>
      </div>
      <div class="zone_list">
        <label>Zones</label>
        <input placeholder="filter" type="filter" class="zone_filter" v-model="zone_filter_value" />

        <div v-for="(z,zidx) in filtered_zones" :key="z.ridx"
             draggable="false" 
             @dragstart="dodragstart($event, zidx)"
             @dragend="dragend"
             @dragover.prevent
             @dragenter.prevent="dragenter"
             @dragleave.prevent="dragleave"
             @drop.capture="dragdrop($event, zidx)"
             @mouseover="hover_zone(z)"
             class="textinteractive"
             :class="{ highlight: highlightzones.includes(zidx) || (zidx == zoneidx && edit_zone) }"
             >
             <!--{{zidx}}-->
          <span class="" @click="zoneedit(z)">
            <!--<span class="control" @click="zonedel(z)">⌦ </span>-->
            {{z["Zone Name"].length ? z["Zone Name"] : "(empty)"}}
          </span>
        </div>
      </div>
      <div class="editor" v-if="editor_open">
        <span v-if="edit_zone">
          <Zone ref="zone" @selectchannel="setselectedchannel" :zoneidx="zoneidx" />
        </span>
        <span v-else>
          <Channel :chanidx="chanidx" :rw="true" />
        </span>
      </div>
    </div>
    <div v-else class="helptext">
      <h2>Upload and Select a codeplug</h2>
      <p>You're seeing this because you have not selected to edit a codeplug yet.</p>
      <p>You may upload a codeplug from your computer (supported all platforms), or read one from a radio directly using USB (Chrome/Chromium on Linux, Mac, Android only).</p>
      <p>Once you have a codeplug in the Codeplug List, click on it to open the codeplug editor.</p>
      <!--<p>&lt;-- Use these buttons to the left!</p>-->
    </div>
  </div>
</template>
<script>

import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
import Channel from '@/components/channel.vue'
import MicroChannel from '@/components/microchannel.vue'
import Zone from '@/components/zone.vue'
import coveredcontrol from '@/components/coveredcontrol.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

//i expected the rightmost pane to become the channel editor when clicking a channel, and a zone editor when click a zone
//i also expected to be able to drag channels onto zones
//also expected to be able to rearrange channels in the channel list

export default {
  name: "manualcps",
  props: [],
  components:{
    MicroChannel,
    Channel,
    Zone,
    coveredcontrol
  },
  computed:{
    ...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    filtered_zones(){
      if( this.zone_filter_value ){
        const fs = this.zone_filter_value.split(" ");
        console.log(fs);
        let filter_test = (zone, index)=>{
          for( let f of fs ){
            const name = zone["Zone Name"];
            let flow = f.toLowerCase();
            let test = (
              name.toLowerCase().includes(flow)
              ||
              (flow == "empty" && name.length == 0)
            );
            if( ! test ){
              return false;
            }
          }
          return true;
        }
        let zones = this.zones.filter(filter_test);
        return zones;
      } else {
        console.log("#nofilter");
        return this.zones;
      }
    },
    filtered_channels(){
      if( this.channel_filter_value ){
        const fs = this.channel_filter_value.split(" ");
        console.log(fs);
        let filter_test = (channel, index)=>{
          /*
          let chanref = `chan${index}`;
          let slc = "";
          if( this.$refs[chanref] ){
            slc = this.$refs[`chan${channel.ridx}`].singlelinechannel; //oh god i'm sorry
          } else {
            //console.log( "REFS", this.$refs );
          }
           */
            const name = channel["Channel Name"];
            const cc = channel["Color Code"];
            const ts = channel["Repeater Slot"];
            const rx = channel["Rx Frequency (MHz)"];
            const tx = channel["Tx Offset (MHz)"];
            const m = channel['Channel Mode'];
            const en = channel["CTCSS/DCS Encode"];
            const de = channel["CTCSS/DCS Decode"];
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
                //|| slc.toLowerCase().includes(flow)
                || (mode == "DMR" && (
                  `cc${cc}` == flow
                  || `ts${ts}` == flow
                  //|| `tg${tg}` == flow
                ))
                || (mode == "FM" && (
                  (`en` == flow && en != 0 )
                  || (`de` == flow && de != 0 )
                  || `en${en}` == flow
                  || `de${de}` == flow
                ))
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
    debug(){
      window.cp = this.current_codeplug;
      window.el = this;
      console.log("cp,el");
    },
    forceupdate(){
      this.$forceUpdate();
    },
    setselectedchannel(newchanidx){
      this.chanidx = newchanidx;
    },
    delallchans(){
      for( let chan of this.filtered_channels ){
        this.chandel(chan);
      }
    },
    addallchanstozone(){
      for( let chan of this.filtered_channels ){
        if( ! this.addchantozone(chan) ){
          break;
        }
      }
    },
    addchantozone(chan){
      if( this.edit_zone ){
        let z = this.zones[this.zoneidx];
        for( let i = 0; i < z.Channels.max; i++ ){
          if( z.Channels[i] == 0 ){
            z.Channels[i] = chan.ridx+1; //channel indexes in zones are offset by 1 so zero can mean "no entry"
            this.$refs.zone.$forceUpdate();
            return true;
          }
        }
        return false;
        //semi-silently fails when no space left in zone
      } else {
        console.log("not adding to a zone because the zone editor isn't open");
      }
    },
    /*
    zonedel(zidx){
      console.log("delete zone",zidx);
      this.zones[zidx].delete();
      this.consolidate();
      this.$forceUpdate(); //TODO why do I need to do this?
    },
     */
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
      this.forceupdate();
    },
    chanedit(chan){
      this.chanidx = chan.ridx;
      this.edit_zone = false;
    },
    zoneedit(zone){
      this.zoneidx = zone.ridx;
      this.edit_zone = true;
    },
    chandel(chan){
      console.log("DEL",chan);
      //does not remove it from any zones its in!
      //does not set data to zero!
      chan.deleted = true;
      this.forceupdate();
    },
    chanundel(chan){
      console.log("UNDEL",chan);
      chan.deleted = false;
      this.forceupdate();
    },
    hover_chan(chan){
      //console.log("hover chan",chan.ridx);
      //console.log(this.channels);
      if( this.channels.max > 1000 ){
        //console.log("disabling because of too many channels");
        return;
      }
      this.highlightzones = [];
      this.highlightchans = [];
      for( let z of this.zones ){
        if( z.Channels.includes( chan.ridx + 1)){
          this.highlightzones.push( z.ridx );
        }
      }
      /*
       */
    },
    hover_zone(zone){
      //console.log("hover zone",zone.ridx);
      if( this.channels.max > 1000 ){
        //console.log("disabling because of too many channels");
        return;
      }
      this.highlightzones = [];
      this.highlightchans = [];
      for( let cidx of zone.Channels ){
        if( cidx > 0 ){
          this.highlightchans.push(cidx - 1);
        }
      }
      /*
       */
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
      highlightchans: [],
      highlightzones: [],
      edit_zone: true,
      editor_open: true,
      channel_filter_value: "",
      zone_filter_value: "",
    }
  }
}
</script>
