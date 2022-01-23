<style scoped>
.channel {
  -border: 1px solid black;
  -margin: 1px;
  font-family: monospace;
}
.rochannel {
}
.rochannel label {
  display: inline;
}
#cname {
  max-width: 11em;
}
#cdetails {
  width: 16em;
}
</style>
<template>
  <span class="channel">
    <span class="rwchannel" v-if="rw && editable" >
      <input id="cname" type="text" placeholder="channel name" v-model="thischan['Channel Name']" />
      <input id="cdetails" type="text" placeholder="details (146.955- FM EN67)" @input="check_details($event)" @change="set_details($event)"  :value="freqtails_str"/>
      <span @click="toggle_editable">✔</span>
    </span>
    <span class="rwchannel" v-else-if="rw && !editable" @dblclick.stop="toggle_editable">
      {{ singlelinechannel }}
    </span>
    <span class="rochannel" v-else-if="onlyname">
      {{ thischan["Channel Name"] }}
    </span>
    <span class="rochannel" v-else>
      {{ singlelinechannel }}
    </span>
  </span>
</template>
<script>
//TODO: components for each data type (e.g. indexedStrings, etc)
//TODO: use the enables/disables info in the JSON
//TODO: load this at something like /edit/{{cpid}}/channel/{{number}}
import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

import Contact from '@/components/contact'
import RXGroupList from '@/components/rxgrouplist'

//TODO: should keep track of country and license per frequency /channel
//TODO: this would let us display standard vs non-standard options (like BW25 for business, or BW12.5 for amateur frequencies)
export default {
  name: "channel",
  props: ['chanidx','rw','onlyname'],
  components:{
    //Contact,
    //RXGroupList,
  },
  computed:{
    //...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    name_str(){
      const c = this.thischan;
      const name = c['Channel Name'];
      return name;
    },
    frequency_str(){
      const c = this.thischan;
      const rx = c['Rx Frequency (MHz)'];
      const tx = c['Tx Offset (MHz)'];
      const offsetstr = this.offsetstr(rx,tx);
      const combined =`${rx}${offsetstr}`;
      return combined;
    },
    freqtails_str(){
      return this.frequency_str + " " + this.details_str;
    },
    details_str(){
      const c = this.thischan;
      const mode = c['Channel Mode'];
      const bw = this.bws[c['Bandwidth (KHz)']];
      const tgidx = c['Contact Name'];
      let modedetails;
      if( this.modes[mode] == "DMR" ){
        const contact = this.contacts[tgidx-1]; //TODO: having to do this -1 for contact indexes is killing me, i always forget it. off by one on contacts
        if( ! contact ){
          console.log("Invalid contact ", tgidx, tgidx-1);
          return "invalid contact";
        }
        const tgname = contact["Contact Name"];
        const tg = contact["Call ID"];
        modedetails = [
          "DMR",
          "CC" +c['Color Code'],
          "TS" +c['Repeater Slot'],
          "TG" + tg,
          "TO" + "(" + tgname + ")",
          //"RX:" +c['RX Group List']
        ].join(" ");
      } else if ( this.modes[mode] == "FM" ){
        modedetails = [
          bw == "12.5"? "NFM": "FM",
          c['CTCSS/DCS Encode']? "EN" +c['CTCSS/DCS Encode']:'',
          c['CTCSS/DCS Decode']? "DE" +c['CTCSS/DCS Decode']:'',
        ].join(" ");
      } else {
        modedetails  = "";
      }
      return modedetails;
    },
    singlelinechannel(){
      const name = this.name_str;
      const freq = this.frequency_str;
      const details = this.details_str;

      const singleline =`${name} ${freq} ${details}`;
      return singleline;
    },
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
      if( ! (this.chanidx >= 0 || this.chanidx > this.channels.max) ){
        throw("invalid channel index" + this.chanidx);
      }
      //console.log(this.chanidx);
      let x = this.channels[this.chanidx];
      if( x == undefined ){
        console.log(`invalid thischan for ${this.chanidx}`);
        return {};
      }
      return x;
    },
    thisdef(){
      return this.current_codeplug.def;
    },
    contacts(){
      if( this.has_codeplug ){
        return this.current_codeplug.editor.Contacts;
      } else {
        return [];
      }
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
    rev_offsetstr(s){
      console.log(s);
      let sign = 0;
      let rx, tx, offset, parts = undefined;
      if( s.indexOf(":") != -1 ){
        [rx,tx]= s.split(":");
        sign = 0;
      } else if( s.indexOf("-") != -1 ){
        [rx,offset]= s.split("-");
        sign = -1;
      } else if( s.indexOf("+") != -1 ){
        [rx,offset] = s.split("+");
        sign = 1;
      } else {
        rx=s;
        offset = ""; //note that this gets coerced to 0, which means the std offset is fetch and the sign being zero by default is what saves this
        sign = 0;
      }
      console.log("rx,offset,sign,tx",rx,offset,sign, tx);
      rx = Number(rx);
      if( offset != undefined ){
        if( offset.length ){
          offset = Number(offset);
        } else if( offset.length == 0 ){
          const stdoffset = rf.standard_offset_from_freq(rx);
          offset = stdoffset;
        }
        tx = rx + offset*sign;
      } else {
        if( tx != undefined ){
          tx = Number(tx);
        }
      }
      rx = Number(rx.toFixed(9) )
      tx = Number(tx.toFixed(9) )
      return [rx,tx];
    },
    offsetstr(rx,tx){
      //TODO: detect different rx and tx bands and don't show an offset, but rather show the actual frequency in that case
      let offset = tx-rx;
      offset = Number(offset.toFixed(9)); //round off the float rounding errors (which coerces to string?) and put it back to a number (which avoids leaving extraneous zeros in the tail)
      //ECMA-262 only requires a precision of up to 21 significant digits,
      //but we only need a few after the decimal for VHF/UHF ops, so 9 seems safe

      //TODO: this actually isn't sufficient, we have more float errors elsewhere...
      //actually those were way deep in codeplug.js and were fixed months ago
      //delete this warning on next commit
      const stdoffset = rf.standard_offset_from_freq(rx);
      const is_standard = Math.abs(offset) == stdoffset 
      if( offset > 0 ){
        if( is_standard ){
          return '+';
        }
        return "+" + offset;
      } else {
        if( is_standard ){
          return '-';
        }
        if(offset == 0){
          return ''
        } else {
          return offset;
        }
      }
    },
    select_contact(idx){
      this.thischan['Contact Name'] = idx;
    },
    select_rxgrouplist(idx){
      this.thischan['RX Group List'] = idx;
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
    toggle_editable(){
      this.editable = !this.editable;
    },
    set_details(evt){
      const c = this.thischan;
      console.log(evt);
      const s = evt.target.value.toUpperCase();
      const parts = s.split(" ");
      console.log(parts);
      //TODO rejoin (or don't split originally) parentheses and quotes and such
      for( let p of parts ){
        console.log(p);
        if( p == "NFM" ){
          c['Bandwidth (KHz)'] = this.bws.indexOf("12.5");
          c['Channel Mode'] = this.modes.indexOf("FM");
        } else if (p == "FM"){
          c['Bandwidth (KHz)'] = this.bws.indexOf("25");
          c['Channel Mode'] = this.modes.indexOf("FM");
        } else if (p == "DMR"){
          c['Channel Mode'] = this.modes.indexOf("DMR");
        } else if (p.match(/^\d+\.*/g) ){
          //leading digits must be a frequency, by design there are no unprefixed numbers elsewhere
          let [rx,tx] = this.rev_offsetstr(p);
          console.log(rx,tx);
          c['Rx Frequency (MHz)'] = rx;
          c['Tx Offset (MHz)'] = tx;
        } else if (p.match(/^EN\d+/g) ){
          c['CTCSS/DCS Encode']= Number(p.slice(2));
        } else if (p.match(/^DE\d+/g) ){
          c['CTCSS/DCS Decode']= Number(p.slice(2));
        } else if (p.match(/^PL\d+/g) ){
          c['CTCSS/DCS Decode']= Number(p.slice(2));
          c['CTCSS/DCS Encode']= Number(p.slice(2));
        } else if (p.match(/^CC\d+/g) ){
          c['Color Code'] = Number(p.slice(2));
        } else if (p.match(/^TS\d+/g) ){
          c['Repeater Slot'] = Number(p.slice(2));
        } else if (p.match(/^TO\(.+\)/g) ){
          console.error("Setting Contact through shorthand not properly implemented yet");
          //BUG
          //TODO: TO(Local SCARS) gets tokenized into two tokens, which breaks this!
          //contact name
          let contacts = this.current_codeplug.editor.Contacts;
          for( let i = 0; i < contacts.length; i++ ){
            const contact = contacts[i];
            console.log(contact, contact["Contact Name"], contact["Call ID"]);
            if( contact["Contact Name"].includes(p.slice(2).replace(/\(|\)/g,"") ) ){
              c['Contact Name'] = i+1; //off by one because -1 for a contact id means "not set"
              console.log("found!");
              break;
            }
          }
        } else if (p.match(/^PC\d+/g) ){
          //private call
          console.error("Setting private call through shorthand not properly implemented yet");
        } else if (p.match(/^TG\d+/g) ){
          //TODO - need a higher level API for this
          //find first matching talkgroups/contacts for now
          console.error("Setting talkgroup through shorthand not properly implemented yet");
          let contacts = this.current_codeplug.editor.Contacts;
          //TODO: assumes contacts is defragged
          for( let i = 0; i < contacts.length; i++ ){
            const contact = contacts[i];
            if( contact["Call ID"] == Number(p.slice(2)) ){
              console.log("found!");
              c['Contact Name'] = i+1; //off by one because -1 for a contact id means "not set"
              break;
            }
          }
        }
      }
      this.toggle_editable();
      //details like: 147.375+ FM EN67
      //details like: 451.8 NFM
      //details like: 146.955- DMR CC9 TG99
    },
    check_details(evt){
      console.log(evt.target.value);
    }
  },
  data(){
    return {
      editable: false,
      modes: ["UNK","FM","DMR"],
      bws:  ["12.5","20","25"],
    }
  }
}
</script>

