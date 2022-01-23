<style scoped>
.warning {
  background: repeating-linear-gradient(45deg, yellow 0%, yellow 15%, black 15%, black 30%);
  text-shadow: 
    0 0 .25em black, 
    0 0 .05em black, 
    0 0 .5em black, 
    0 0 .1em black, 
    0 0 .1em black;
  font-weight: bold;
  color: black; /* makes it look like the back side */
}
.covering .warning {
  color: white; /* make sure we still have the right color while covering though */
}
.litredglass {
  background-color: rgba(255,0,0, .7);
  text-shadow: 
    0 0 .25em red, 
    0 0 .05em red, 
    0 0 .5em yellow, 
    0 0 .1em white;
  font-weight: bold;
  color: white;
}
.red {
  background-color: red;
  text-shadow: 
    0 0 .3em black, 
    0 0 .1em black;
  font-weight: bold;
  color: white;
}
.plain {
  background: repeating-linear-gradient(45deg, var(--interaction-background) 0%, var(--interaction-background) 15%, var(--interaction-hover-background) 15%, var(--interaction-hover-background) 30%);
}

.plain.label {
  font-weight: bold;
  text-shadow: 
    0px 0px 1px var(--interaction-background),
    0px 1px 1px var(--interaction-background),
    1px 0px 1px var(--interaction-background),
    1px 1px 1px var(--interaction-background),
    0px 0px .1em var(--interaction)
    ;
}
.covering .plain.label {
}


* {
  transition: all .1s ease-in;
}

.coveredcontrol {
  width: fit-content; 
  //width: 100%; 
}
* {
  text-align: center;
  //margin: auto !important;
}
.cover {
  width: 100%; 
  height: 0; /* get rid of */
  /* the nasty block above it */
  /* and also means we can get rid of the translates below */
  /* but keep the width so we can center the control we're covering */

  /* give the right indicator for the cover and children so people know to click */
  cursor: pointer; 

  /* make it look like a cover flipped up */
  transform: scaleY(-.85);
  filter: saturate(.5) contrast(0.5);
}
.cover .label {/* .label has the background, not .cover! */
  padding: .25em .25em; /* so it can be read */
  padding: inherit;
  width: 100%;
  text-alignment: center;

  border: 2px inset var(--interaction-separation);
}
.cover.covering {
  transform: scaleY(1);
  filter: saturate(1) contrast(1);
}
.cover.covering .label {
  border: 2px outset var(--interaction-separation);
}
.control {
  width: 100%;
  margin:auto;
}
</style>
<template>
  <div class="coveredcontrol">
    <div class="cover" :class="{covering: coverstate}" @click.capture.stop="movecover" >
      <label class="label" :class="covertype">
      {{label}}
      </label>
    </div>
    <div class="control">
      <slot></slot>
    </div>
  </div>
</template>
<script>
//import { mapState, mapMutations } from 'vuex';
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

//This is meant to just add a "switch cover" to existing controls.
//but not impede the expected usage at all!

  /*
  I want the warning cover to flip off and on!
  like a missile switch!
  https://stackoverflow.com/questions/13630229/can-i-have-an-onclick-effect-in-css
  i guess I'll make a component to do this with a slot or something
  */

export default {
  name: "coveredcontrol",
  props: ['covertype','label'],
  components:{
  },
  computed:{
    //...mapState('devtools',['devmode']),
    //...mapState('codeplugs',['current_codeplug']),
  },
  methods: {
    //...mapMutations('codeplugs',['add_codeplug']),
    movecover(){
      this.coverstate = ! this.coverstate;
    }
  },
  data(){
    return {
      coverstate: true,
    }
  }
}
/*

Use like:
        <coveredcontrol covertype="warning" label="DEV">
        <span>
          <span>Dev:</span>
          <input type="checkbox" />
        </span>
        </coveredcontrol>

        or


        <coveredcontrol v-if="loaded_codeplugs.length" covertype="warning" label="CLEAR">
        <button style="width: 100%;" @click="clear_codeplugs">Clear</button>
        </coveredcontrol>
*/
</script>
