<style scoped>
* {
  -border: 1px dashed red;
}
button.connect {
  width: 100%;
}
label {
  display: inline;
}
.USB {
  width: 100%;
  margin: 0 auto;
}
.USB > div {
}
.dev {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}
.instructions {
}
.codeplugs {
}
.radio-start {
  clear:both;
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}
.radio-list {
  clear:both;
  width: auto;
  margin: 0 auto;
  -border: 1px solid black;
}
.radio-list h3 {
  margin: 0 auto;
  text-align:center;
}
.radiogrid {
  -border: 1px solid black;
    display: grid;
    grid-template-columns: repeat( auto-fit, minmax(300px, 1fr) );
}
@media only screen and (min-width: 729px){ 
.radio-start {
  width: 20em;
}
.radio-list h3 {
  width: 20em;
}
  .radiogrid {
    grid-template-columns: repeat( auto-fit, minmax(30em, 1fr) );
  }
}
.radiogrid .radiocontainer {
  -border: 1px solid black;
  max-width: 45em;
  margin-left: auto;
  margin-right: auto;
}
.after {
  clear:both;
  max-width: 40em;
  margin: 0 auto;
  padding-top: 1em;
}
.groupactions button {
  width:100%;
  margin-top: .2em;
}
</style>
<template>
  <div class="USB" >
    <div class="radio-start" v-if="usb || devmode">
      <button class="connect" :disabled="!usb && !devmode" @click="load_usb">
        <span v-if="usb || devmode">Connect Radio(s)</span>
        <span v-else>USB Not available, Can't connect to radio</span>
      </button>
      <div v-if="usbconnected">
        <!--
        <div class="groupactions">
          <button hidden v-if="codeplugmode" @click="readall">Read codeplug from each radio</button>
          <button hidden v-if="codeplugmode" @click="writeall">Write selected codeplug to all radios</button>
          <div v-if="codeplugmode" hidden>
            <label>Maintain radio DMR IDs</label><input type="checkbox" />
          </div>
        </div>
        <select v-if="firmwaremode" v-model="selected_firmware_url" hidden>
          <option value="null" selected>Choose FW</option>
          <option value="uploadfromcomputer">Upload from my computer</option>
          <option v-for="fw in firmware_list" :key="fw.url" :value="fw.url">
          {{fw.name}}
          </option>
        </select>
        <button v-if="firmwaremode" @click="upgradeall" hidden>Flash All</button>
        -->
      </div>
    </div>
    <div class="radio-list" v-if="usb || devmode">
      <h3>Radio List</h3>
      <div class="radiogrid">
        <div class="radiocontainer" v-for="(d,idx) in usbdevices" :key="d">
          <div v-for="error in deviceerrors[d]" :key="error">
            <p class="errormsg">{{error}}</p>
          </div>
          <ConnectedRadio :device="d" :devmode="devmode" :mode="mode" />
        </div>
      </div>
    </div>
    <div class="after">
      <USBHelp v-if="usbdevices.length == 0"/>  <!-- needs a show-help before it can be hidden -->
      <USBDebugging />
    </div>
    
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';

import ConnectedRadio from '@/components/connectedradio.vue'
import SupportedFeaturesMatrix from '@/components/supportedfeatures.vue'
import USBHelp from '@/components/usbhelp.vue'
import USBDebugging from '@/components/usbdebugging.vue'


import { wait_for, save_data } from '@/libs/misc.js';
import rf from '@/libs/rf.js';
import tytdfu from '@/libs/dfu.js';
import codeplugs from '@/libs/codeplug.js';

window.addEventListener('beforeinstallprompt', (e) => {
  console.log("Got a beforeinstallprompt event",e);
  //e.prompt();
});

//TODO: flash-all latest OEM or latest OpenRTX from server recommendation based on each connected device
//TODO: flash-all codeplug but maintain programmed DMRIDs
export default {
  name: "WebDFURadio",
  props: ['mode'],
  components:{
    ConnectedRadio,
    USBHelp,
    USBDebugging
  },
  computed: {
    ...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['loaded_codeplugs','current_codeplug']), 
    ...mapState('firmwares',['loaded_firmwares','current_firmware']), 
    codeplugmode(){
      const m = this.currentview == "USB" || this.mode=="codeplug"; //TODO fix this name
      console.log("MODE[CODEPLUG]:",m);
      return m;
    },
    firmwaremode(){
      const m= this.currentview == "firmware" || this.mode=="firmware";
      console.log("MODE[FIRMWARE]:",m);
      return m;
    },
    recoverymode(){
      return this.currentview == "recover" || this.mode=="recover"; 
    },
    currentview(){
      console.log("HAVE",this.$route);
      return this.$route.name;
    },
    usbconnected(){
      return this.usbdevices.length;
    },
    /*
    firmware_list(){
      //TODO: select with optgroup for the different OEM/md380tools/openrtx major options
      //TODO: https://vue-select.org/
      //TODO: add openrtx support
      return this.loaded_firmwares;
    },
    */
  },
  methods:{
    ...mapMutations('codeplugs',['add_codeplug']),
    readall(){
      for(const d of this.usbdevices ){
        this.get_codeplug(d);
      }
    },
    writeall(){
      for(const d of this.usbdevices ){
        this.put_codeplug(d);
      }
    },
    async reboot(d){
      console.log("rebooting d:",d);
      d.dfu.reboot();
      //delete device after a reboot?
      //or should we have a health check and stale-out old usb devices?
      //tie dev status into dfu.progress_* and DFU state?
    },
    async get_codeplug(d){
      let bin, rdt, cpm;
      try {
        await d.dfu.programming_mode();
        bin = await d.dfu.recv_codeplug();
        rdt = await codeplugs.bin2rdt(d.dfu, bin);
        cpm = await codeplugs.rdt_w_metadata(d,rdt);
      } catch (e) {
        console.error(e);
        const devkey = d;
        if( this.deviceerrors[devkey] == undefined ){
          this.deviceerrors[devkey] = []
        }
        this.deviceerrors[devkey].push(e);
        return;
      }
      d.dmrid = cpm.dmrid;
      this.add_codeplug(cpm);
    },
    async put_codeplug(d){
      await d.dfu.programming_mode();
      const bin = await codeplugs.rdt2bin(this.current_codeplug.rdt)
      await d.dfu.send_codeplug(bin);
    },
    sortusb(){
      this.usbdevices.sort(function(a,b){ //sort needs -1, 0, 1 - not true false!
        if( a.bands.length == b.bands.length ){
          return a.model <= b.model ? 1 : -1;
        } else {
          return a.bands.length - b.bands.length;
        }
      })
    },
    async new_device(d,dfu){
      console.log("new_device");
      await dfu.init();

      if( dfu.enter_dfu_mode ){
        await dfu.enter_dfu_mode();
        const [model,ranges,_] = await dfu.identify_radio();
        //await dfu.programming_mode();
        //console.log(d,dfu);
        const bands = codeplugs.bands(ranges);
        const hastools = d.productName.includes("Patched");
        this.usbdevices.push({
          id: model+"_"+bands.join("")+"_"+d.productName,
          name: d.productName,
          usb:d, 
          dfu:dfu, 
          model:model,
          ranges:ranges,
          bands:bands,
          hastools: hastools,
          dmrid: 0,
        });
      } else {
        console.log("not actually dfu");
        //TODO: fix the variable names here and generalize it (ETA 2021 02: not going to happen until webserial, because serial ports are already claimed by the kernel)
        this.usbdevices.push({
          id: d.productName,
          name: d.productName,
          usb:d, 
          dfu:dfu, 
        });
      }
      this.sortusb();
    },
    async add_usb(d){
      let dfu;
      const hastools = d.productName.includes("Patched");
      const openrtx_serial = d.productName.includes("Virtual ComPort");
      if( this.devmode ){
        dfu = new tytdfu.MockTYTDFU(d);
      } else if(hastools){
        dfu = new tytdfu.VCZTYTDFU(d);
      } else if(openrtx_serial){
        console.log("USB Serial Device:",d);
        dfu = new tytdfu.ACM(d);
      } else {
        dfu = new tytdfu.TYTDMRDFU(d);
      }
      if( dfu ){
        await this.new_device(d, dfu);
        console.log(dfu);
      } else {
        console.log("unsupported device");
      }
    },
    async load_usb(){
      //there are three cases here:
      //1. dev mode - always mock the radios
      //2. normal, supports USB, not in dev mode
      //3. not dev mode, and no USB
      // (3a): demo mode? which is actually dev mode?
      //for demo and dev mode, add one of each radio supported

      this.usbdevices = [];
      console.log("Radio filters:", tytdfu.radio_filters);
      if( navigator.usb != undefined ){
        const devs = await navigator.usb.getDevices();
        if( devs.length ){
          for( const d of devs ){ 
            this.add_usb(d);
          } 
        } else {
          console.log("There's no USB devices found or selected, prompting for access");
          await navigator.usb.requestDevice(tytdfu.radio_filters);
          await this.load_usb();
        }
      } else {
        console.log(`USB apparently not supported on this platform. Cannot access navigator.usb. You are running ${navigator.appCodeName} on ${navigator.oscpu}`);
        if( this.devmode ){ 
          this.add_usb(new tytdfu.MockUSB());
          //this.add_usb(new tytdfu.MockUSB());
          //this.add_usb(new tytdfu.MockUSB());
        }
      }
    }
  },
  data(){
    return {
      usb: navigator.usb !== undefined,
      usbdevices: [],
      selected_firmware_url: null,
      deviceerrors: {},
      errors: [],
    }
  }
}
</script>
