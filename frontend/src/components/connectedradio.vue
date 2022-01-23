<style scoped>
* {
  -border: 1px dashed grey;
}
label {
  display: inline;
}
button {
  margin: 2px 0px;
}



.spinner {
  animation: spin 1.4s infinite linear;
  position: relative;
  display: inline-block;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(180deg); }
  100% { transform: rotate(360deg); }
}

.radio {
  border: 3px outset grey ;
  border-radius: 10px;
  padding: .5em;
  margin: .1em;
  max-width: 50em;
}
.radio.disabled {
  filter: contrast(.5);
  opacity: .5;
}
progress {
  width: 100%;
}
@media only screen and (max-width: 800px), screen and (max-height: 600px){ 
  .radio {
    display: grid;
    grid-gap: 1px;
    grid-template-columns: auto auto;
    grid-template-areas:
    "description"
    "actions"
    "status"
    ;
    border: 1px solid black;
    margin: 0em;
    padding: .1em;
    min-width: 300px;
  }
  .depiction {
    display:none;
  }
}
@media only screen and (min-width: 801px), screen and (min-height: 601px){ 
  .radio {
    display: grid;
    grid-gap: .5em;
    grid-template-columns: auto auto;
    grid-template-areas:
    "description        connection"
    "actions            depiction"
    "actions            depiction"
    "status             depiction"
    ;
  }
}
.actions {
  grid-area: actions;
}
.actions button, .actions select, .actions input {
  display: block;
  width: 100%;
  text-align: center;
}
.depiction {
  grid-area: depiction;
  filter: saturate(0) contrast(1.2);
  /* drop-shadow(.5em 1em 5px grey); */
}
.description {
  grid-area: description;
}
.description ul {
  list-style-type:none;
  margin:0 0;
  padding: 0;
}
.status {
  grid-area: status;
}
.connection {
  grid-area: connection;
  display:none;
}
</style>
<template>
  <div class="radio" :class="{disabled:disabled}">
    <div class="actions">
      <button v-if="devmode" @click="reboot">Reboot</button> 
      <button v-if="codeplugmode" @click="get_codeplug">Read Codeplug</button> 
      <button v-if="codeplugmode" @click="put_codeplug" >Write Codeplug</button> 
      <div v-if="firmwaremode">
        <label>Select firmware file:</label>
        <select v-if="firmwaremode" v-model="selected_firmware_url" @change="firmware_selected">
          <option value="null" disabled="disabled">Choose Firmware</option>
          <option value="uploadfromcomputer">Upload from my computer</option>
          <option v-for="fw in firmwares" :key="fw.url" :value="fw.url" :title="fw.filename">
          {{fw.name}}
          </option>
        </select>
        <div v-if="selected_firmware_url=='uploadfromcomputer'"><label>Upload a firmware file from your computer:</label>
          <input v-if="firmwaremode" @change="upload_firmware" type="file" />
        </div>
        <button v-if="firmwaremode" :disabled="!firmwareready" @click="firmware">Upgrade Radio</button> 
        <button v-if="recoverymode" @click="recover" disabled>Recover (coming soon)</button> 
      </div>
      <button v-if="codeplugmode && device.hastools" @click="screenshot">Screenshot</button> 
      <button v-if="devmode && device.hastools" @click="dmesg">dmesg</button> 
      <!--<button v-if="devmode" @click="debug">Debug</button> -->
      <div><label>{{statusmsg}}</label></div>
    </div>
    <img class="depiction" :src="radio_img" />
    <div class="connection">
      <h5 v-if="disabled">Disconnected</h5>
      <h5 v-if="!disabled">Connected</h5>
    </div>
    <div class="description">
      <ul>
        <!--<li class="name"><label>Radio: </label><span>{{device.name}}</span></li>-->
        <li class="model"><label>Radio Model: </label><span >{{device.model}}</span> </li>
        <li v-if="!firmwaremode" class="bands"><label>Bands: </label><span >{{device.bands.join(", ")}}</span></li>
        <!--<li class="tools"><label>Experimental Firmware: </label><span v-if="device.hastools">✔</span><span v-else>╳</span></li>-->
        <li v-if="!firmwaremode && device.dmrid != 0" class="dmrid"><label>DMR ID: </label><span v-if="device.dmrid != 0">{{device.dmrid}}</span><span v-else>(unknown)</span></li>
      </ul>
    </div>
    <div class="status">
      <div class="task" v-for="p of progress" :key="p.name">
        <label>{{p.name}}</label>
        <span class="success" v-if="p.finished">✔</span>
        <span class="danger" v-else-if="p.errored">╳</span>
        <span class="spinner" v-else>/</span>
        <progress class="progress " :class="{success:p.finished}" :value="p.current" :max="p.max" ></progress>
      </div>
      <img v-if="screenshotbloburl" :src="screenshotbloburl" />
    </div>

  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex';
import { wait_for, fetchblob } from '@/libs/misc.js';
import codeplugs from '@/libs/codeplug.js';
import rf from '../libs/rf.js';
async function load_firmwares(model){
  const req = await fetch("/api/firmware/for-radio/"+model+"/").catch(e=>{
    let s=`load_firmwares() failed to load: ${e}`
    this.statusmsg = s
    console.error(s);
    //throw(new Error("load_firmwares() network error during fetch"))
  });
  console.log(req);
  if( req.ok ){
    try{
      return await req.json();
    } catch( e ){
      let s = `load_firmwares() failed to load: ${e}`;
      this.statusmsg = s
      console.error(s);
      //throw(new Error("load_firmwares() fetch success, but bad data"));
    }

  } else {
    //throw(new Error("load_firmwares() fetch failed"));
    let s = "load_firmwares() fetch failed, see js console"
    this.statusmsg = s
    console.error(s);
    console.error("req=",req)
  }
  return [];
}
export default {
  name: "ConnectedRadio",
  props: ["device", "mode"], 
  mounted(){
    this.pingtimer = window.setInterval(this.ping, 50);
    //and make sure to clear the timer in beforeUnmount and when the ping fails
    if( this.firmwaremode ){
      this.$nextTick(this.load_firmwares);
    }
  },
  beforeUnmount(){
    clearInterval(this.pingtimer);
  },
  methods: {
    async dmesg(){
      const dmesg = await this.device.dfu.getdmesg();
    },
    async load_firmwares(){
      if( window.d == undefined ){
        window.d = [];
      }
      window.d.push(this.device);
      console.log("loading for ", this.device.model);
      let firmwares = await load_firmwares(this.device.model);
      console.log(this.device.model,firmwares);
      this.firmwares = firmwares.map(x=>Object({url:x.contents, name:`${x.distribution} ${x.version}`, filename:x.filename }));
    },
    async screenshot(){
      const bmp = await this.device.dfu.get_screen_bmp();
      console.log("BMP",bmp);
      const blob = new Blob( [bmp], { type: "image/bmp" } );
      console.log(blob);
      const url = window.URL.createObjectURL(blob);
      console.log(url);
      this.screenshotbloburl = url;
    },
    reboot(){
      //TODO move this and other functions in here?
      this.$parent.reboot(this.device);
    },
    async get_codeplug(){
      console.log("get_codeplug started");
      this.statusmsg = "Reading codeplug from radio";
      await this.$parent.get_codeplug(this.device);
      this.statusmsg = "Codeplug Ready!";
      console.log("get_codeplug finished");
    },
    async put_codeplug(){
      if( this.current_codeplug ){
        this.statusmsg = "Writing codeplug to radio";
        await this.$parent.put_codeplug(this.device);
        this.statusmsg = "Codeplug finished writing!";
      } else {
        this.statusmsg = "Select a codeplug first!";
      }
    },
    debug(){
      console.log(this.device);
      window.d = this.device;
    },

    async ping(){
      const alive = await this.device.dfu.ping();
      this.disabled = ! alive;
      if( ! alive ){
        console.log(this.disabled);
        clearInterval(this.pingtimer);
      }
    },

    async firmware_selected(){
      this.statusmsg = '';
      //can i move the downloading firmware from server bit in here?
    },
    async firmware(){
      console.log(this.selected_firmware_url);
      if( this.selected_firmware_url ){
        let url = this.selected_firmware_url;
        let fw_bytes;
        if( url == 'uploadfromcomputer' ){
          if( this.localfirmware ){
            fw_bytes = this.localfirmware; //button should be disabled to make sure the file is ready;
          } else {
            return false; //TODO: error
          }
        } else {
          this.statusmsg = "Fetching firmware from server";
          fw_bytes = await fetchblob( this.selected_firmware_url );
          //TODO: catch errors here!
          this.statusmsg = "Firmware fetched and ready!";
        }
        console.log(fw_bytes);
        this.statusmsg = "Flashing! Please wait";
        await this.device.dfu.firmware_upload(fw_bytes);
        this.statusmsg = "Done Flashing!";
      } else {
        const error=console.log;
        error("Invalid firmware URL");
      }
    },
    async upload_firmware(){
      const files = event.target.files
      this.statusmsg = "Uploading firmware to browser";
      for( let file of files ){
        try {
          if( ! file.name.endsWith(".bin") ){
            console.log("File does not have .bin extension! Are you sure this is a firmware?");
          }
          const bin = await codeplugs.readFileBytes(file);  //should move that out of the codeplugs module i guess, eh?
          this.localfirmware = bin;
        } catch ( e ){
          this.statusmsg = e
          console.log(e);
          //this.show_error(e, e, "upload", file.name, "upload_codeplug"); //todo - move this to where the original exception is
          //throw(e);  //TODO: log with sentry!
          return;
        }
      }
      this.statusmsg = "Local firmware ready!";
    },
  },
  computed: {
    ...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['loaded_codeplugs','current_codeplug']), 
    firmwareready(){
      return (![null,"null","uploadfromcomputer"].includes(this.selected_firmware_url)) 
        || (this.selected_firmware_url == 'uploadfromcomputer' && this.localfirmware != null);
    },
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
      return this.$route.name;
    },
    devstatus(){
      return [this.device.dfu.statusString, this.device.dfu.stateString];
    },
    progress(){
      return this.device.dfu.progress_get();
    },
    radio_img(){
      let basename = `${this.device.model}.png`.toLowerCase();
      return `/images/radio_assets/cropped/${basename}`;
    },
  },
  data(){
    return {
      screenshotbloburl: null,
      selected_firmware_url: null,
      disabled: false,
      pingtimer: null,
      localfirmware: null,
      statusmsg: "",
      firmwares:[],
    }
  }


}
</script>
