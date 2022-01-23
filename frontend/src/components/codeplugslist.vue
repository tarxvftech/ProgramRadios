<style scoped>
* {
  -border: 1px dashed black;
}
.add:before {
  content: "+";
  padding: 0em .3em;
}
.interactive {
  padding: .2em;
}
ul li {
  -border: 1px dashed black;
}
li.selected {
}
li.selected:before {
  //content: ">";
}
.codeplugs {
}
.codepluglist {
}
.codeplugs ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}
.codeplugs ul li {
}
.codeplugs h4 {
  padding-left: 2em;
}
.addcp .options {
  display: grid;
  grid: max-content / auto ;
}
.addcp .options > div {
  -border: 1px green dashed;
  padding: .5em;
}
.codeplugactions {
}
.inlineheader {
  display: inline;
}
</style>
<template>
  <div class="codeplugs">
    <h5>Codeplugs</h5>
    <div class="addcp">
      <div class="options">
        <div class="USB">
          <label data-augmented-ui class="aug add interactive" @click="select_usb">To/From Radio</label>
        </div><!--USB-->
        <div class="computer">
          <label data-augmented-ui class="aug add interactive" for="uploadcodeplugs">Add From File</label>
          <input id="uploadcodeplugs" hidden @change="upload_codeplug()" type="file" multiple />

          <div class="uploaderrors">
            <button v-if="errors.length" @click="clear_errors">Clear Errors</button>
            <ul>
              <li v-for="e in errors" :key="e">
                <div v-html="e"></div>
              </li>
            </ul>
          </div><!--uploaderrors-->
        </div><!--computer-->
      </div> <!--options-->
    </div><!--add-->
    <h5>Codeplug List</h5>
    <div class="codeplugactions">
      <!--<button v-if="loaded_codeplugs.length" @click="download_all">Download All {{loaded_codeplugs.length}} As Zip</button>-->
      <coveredcontrol v-if="loaded_codeplugs.length" covertype="plain" label="CLEAR LIST">
      <button style="width: 100%;" @click="clear_codeplugs">Clear List</button>
      </coveredcontrol>
    </div> <!-- .codeplugactions -->
    <div class="codepluglist">
      <ul v-if="loaded_codeplugs.length">
        <li :class="{selected: cp==current_codeplug}" v-for="(cp,idx) in loaded_codeplugs" :key="idx">
    <input type="checkbox" />
          <CodeplugCom @click="select_edit(idx)" :cp="cp" :cpidx="idx" />
        </li>
      </ul>
      <div v-else>
        <h3>[]</h3>
        <!--<NoCodeplugsView/>-->
      </div>
    </div><!-- .codepluglist -->
  </div> <!-- .codeplugs -->
</template>
<script>
//TODO: add support for drag and drop codeplugs: https://web.dev/drag-and-drop/
import { saveAs } from 'file-saver';
import { mapState, mapMutations } from 'vuex';
import jszip from 'jszip';

//import { save_data, fetchblob } from '@/libs/misc.js';
import codeplugs from '@/libs/codeplug.js';

import CodeplugCom from '@/components/codeplug.vue'
import WebDFURadio from '@/components/webdfuradio.vue'
import coveredcontrol from '@/components/coveredcontrol.vue'

export default {
  name: "CodeplugsList",
  components: {
    CodeplugCom,
    //WebDFURadio,
    coveredcontrol
  },
  props: [],
  computed: {
    ...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['loaded_codeplugs','current_codeplug']),
  },
  created(){
    this.loadDataFiles();
  },
  methods: {
    ...mapMutations('codeplugs',['add_codeplug','select_codeplug','clear_codeplugs','set_definitions']),
    ...mapMutations('firmwares',['add_firmwares','clear_firmwares']),
    async loadDataFiles(){
      const cpj = await fetch( "/data/codeplugs.json").then(r=>r.json());
      this.codeplug_definitions = cpj;
      this.set_definitions(cpj);
    },
    clear_errors(){
      this.errors.length = 0;
    },
    show_error(e, msg, action, errorarg, caller){
      let s = `Error in ${caller}: Could not ${action} '${errorarg}'. Details: ${msg}`;
      this.errors.push(s);
      throw(e);
    },
    select_usb(){
      this.$router.push('/usb/');
    },
    select_edit(idx){
      this.$router.push(`/edit/cp/${idx}/`);
      //TODO should be part of the router handling somehow
      this.select_codeplug(idx);
    },
    async upload_codeplug(){
      const files = event.target.files
      for( let file of files ){
        try {
          if( ! file.name.endsWith(".rdt") ){
            console.log("File does not have .rdt extension");
            //continue; 
          }
          const rdt = await codeplugs.readFileBytes(file);
          const cpm = await codeplugs.rdt_w_metadata(null, rdt, file.name);
          this.add_codeplug(cpm);
          if( this.loaded_codeplugs.length == 1 ){
            this.select_edit(0);
          }
        } catch ( e ){
          this.show_error(e, e, "upload", file.name, "upload_codeplug"); //todo - move this to where the original exception is
          //throw(e);  //TODO: log with sentry!
        }
      }
    },
    download_all(){
      //https://git.mmcginty.me/mike/NERVEUML_mission_planner_redux/src/branch/master/www/js/mission.js

      const zippy = new jszip();
      for( const cp of this.loaded_codeplugs ){
        zippy.file(cp.filename, cp.rdt);
      }
      zippy.generateAsync({type:"blob"}).then(contents=>{
        console.log(contents);
        saveAs(contents, "AllCodeplugs.zip");
      }).catch(console.log);

    },
  },
  data(){
    return {
      codeplug_definitions: null,
      errors: [],
    }
  },
}
//TODO: allow reading zips like we generate https://stuk.github.io/jszip/documentation/examples.html
//TODO: provide codeplugs of our own for gen1 and gen2 radios
</script>
