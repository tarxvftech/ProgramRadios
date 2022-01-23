<style scoped>
.channel {
  -border: 1px solid black;
  margin: 1px;
}
.rochannel {
}
.rochannel label {
  display: inline;
}
</style>
<template>
  <div class="channel">
    <div class="rwchannel" v-if="rw">
      <MicroChannel :chanidx="chanidx" :rw="false" />
      <label>Channel {{chanidx}}</label>
      <label>Channel Name:</label><input type="text" v-model="thischan['Channel Name']"  />
      <label>RX (MHz) (radio listens on this frequency):</label><input type="number" v-model.lazy="thischan['Rx Frequency (MHz)']"  />
      <!--<label>Tx:</label>-->
      <!--<label>Set TX to standard offset:</label>-->
      <!--<button>+</button>-->
      <!--<button>-</button>-->
      <!--<label>Manual offset input:</label>-->
      <!--<input type="number" v-model.lazy="thischan['Tx Offset (MHz)']" />-->
      <label>TX (MHz) (your radio will transmit on this frequency):</label>
      <input type="number" v-model.lazy="thischan['Tx Offset (MHz)']"  />

      <label>Mode:</label>
      <select v-model.lazy="thischan['Channel Mode']" >
        <option :value="entry.index" v-for="(entry, idx) of thisdef.fields['Channel Mode'].indexedStrings" :key="idx">
        {{entry.string}}
        </option>
      </select>
      <div v-if="thischan['Channel Mode'] == 2">
        <label>TimeSlot: </label>
        <select v-model.lazy="thischan['Repeater Slot']" >
          <option :value="entry.index" v-for="(entry, idx) of thisdef.fields['Repeater Slot'].indexedStrings" :key="idx">
          {{entry.string}}
          </option>
        </select>
        <label>ColorCode: </label>
        <!--<help>(special code to make sure you only key up the intended repeater when multiple repeaters are on one frequency)</help>-->
        <input type="number" min=0 max=15 v-model.lazy="thischan['Color Code']" />
        <!--<label>Contact:</label><input type="text" v-model.lazy="thischan['Contact Name']" />-->
        <Contact :idx="thischan['Contact Name'] - 1" @select_contact="select_contact" />
        <RXGroupList :idx="thischan['RX Group List'] - 1" @select_rxgrouplist="select_rxgrouplist" />
      </div>
      <div v-else>
        <label>BW (25kHz for ham, 12.5 for business):</label>
        <select v-model.lazy="thischan['Bandwidth (KHz)']" >
          <option :value="idx" v-for="(entry, idx) of thisdef.fields['Bandwidth (KHz)'].strings" :key="idx">
          {{entry}}KHz
          </option>
        </select>
        <label>CTCSS/DCS squelch (Only receive if this tone is present):</label>
        <input type="number" v-model.lazy="thischan['CTCSS/DCS Decode']" />
        <label>CTCSS/DCS access (transmit with this tone, commonly used for opening repeater squelch):</label>
        <input type="number" v-model.lazy="thischan['CTCSS/DCS Encode']" />
      </div>
      <!--<button @click="sanify">Set all advanced options to safe defaults</button>-->
      <div class="advanced" hidden>
        <div v-for="(fieldname, idx) in advancedfields" :key="idx">
          <h6>{{fieldname}}</h6>
          <input type="text" v-model="thischan[ fieldname ]" />
        </div>
      </div>
    </div>
    <div class="rochannel" v-else-if="onlyname">
      <div class="name">
        <span> {{thischan['id']}}{{ thischan['Channel Name'] }}</span>
      </div>
    </div>
    <div class="rochannel" v-else>
      <div class="name">
        <label>({{chanidx}}) Name:</label>
        <span> {{ thischan['Channel Name'] }}</span>
      </div>
      <div class="freq">
        <label>Rx:</label>
        <span> {{ thischan['Rx Frequency (MHz)'] }}</span>
      </div>
      <div class="name">
        <label>Tx:</label>
        <span> {{ thischan['Tx Offset (MHz)'] }}</span>
      </div>
    </div>
  </div>
</template>
<script>
//TODO: components for each data type (e.g. indexedStrings, etc)
//TODO: use the enables/disables info in the JSON
//TODO: load this at something like /edit/{{cpid}}/channel/{{number}}
import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

import MicroChannel from '@/components/microchannel.vue'
import Contact from '@/components/contact'
import RXGroupList from '@/components/rxgrouplist'

//TODO: frequencies get rounding errors from being floats...i should work in hz and only _display_ MHz maybe?
//or wait, that 147.015 -> 147.01499 issue isn't from where i think it is, is it? parseFloat likes that string jsut fine...
//151.51499
export default {
  name: "channel",
  props: ['chanidx','rw','onlyname'],
  components:{
    Contact,
    RXGroupList,
    MicroChannel,
  },
  computed:{
    //...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    advancedfields(){
      const recordname = "Channels";
      const regularfields=[
        "Channel Name",
        "Rx Frequency (MHz)",
        "Tx Offset (MHz)",
        "Channel Mode",

        "Bandwidth (KHz)",
        "CTCSS/DCS Encode",
        "CTCSS/DCS Decode",

        "Contact Name",
        "RX Group List",
        "Repeater Slot",
        "Color Code",

        "Privacy",
        "Privacy Number",
      ];
      return this.thisdef.records[recordname].fieldTypes.map(fieldname=>this.thisdef.fields[fieldname].typeName).filter(x=>!regularfields.includes(x));
    },
    listfields(){
      const recordname = "Channels";
      return this.thisdef.records[recordname].fieldTypes.map(fieldname=>this.thisdef.fields[fieldname].typeName);
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
    select_contact(idx){
      this.thischan['Contact Name'] = parseInt(idx)+1 ;
    },
    select_rxgrouplist(idx){
      this.thischan['RX Group List'] = parseInt(idx) +1;
    },
    debug(){
      window.el = this;
    },
    sanify(){
      for( const typename of this.advancedfields ){
        const oldval = this.thischan[typename];
        const defval = this.thisdef.fields[typename].defaultValue;
        try {
          this.thischan[typename] = defval;
        } catch (e){
          console.log("failed to set", typename, e);
        }
        console.log(typename, oldval, defval, "now: ", this.thischan[typename]);
      }
    },
  },
  data(){
    return {
    }
  }
}
</script>
