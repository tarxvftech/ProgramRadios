<style scoped>
* {
  -border: 1px dashed red;
}
.main {
  clear: both;
}
@media only screen and (max-width: 400px){
  .main {
    margin-left: 2em;
    margin-right: 1em;
  }
}
@media only screen and (min-width: 401px){
  .main {
    display: grid;
    grid: 100% / 12em auto;
    grid-template-areas: 
    "a b"
    "a b"
    ;
  }
  .right {
    display: grid;
    grid: auto / auto;
    grid-template-areas: 
    "c c"
    "d d"
    ;
  }
}
.left {
  grid-area: a;
}
.right {
  grid-area: b;
}
.tabs {
  grid-area: c;
  height: 2em;
}
.view {
  grid-area: d;
  height: 100%;
}

.main > * {
    border: 1px outset grey;
}
</style>

<template>
    <div class="main">
      <CodeplugsList class="left" />
      <div class="right">
        <CodeplugTabs  class="tabs" v-if="showtabs" />
        <router-view   class="view" />
      </div>
    </div> <!-- /main-->
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import CodeplugsList from '@/components/codeplugslist.vue';
import CodeplugTabs from '@/components/codeplugtabs.vue';
export default {
  name: "columns",
  props: [],
  components:{
    CodeplugsList,
    CodeplugTabs,
  },
  computed:{
    ...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['loaded_codeplugs','current_codeplug']),
    //TODO force to /edit/cp/ when ! loaded_codeplugs.length 
    showtabs(){
      console.log(this.$route.name);
      return this.current_codeplug != undefined && this.$route.name != "USB";
    }
  },
  methods:{
  },
  //TODO prevent scroll when loading components by clicking tabs https://www.vuescript.com/prevent-body-scroll/
  data(){
    return {
    }
  }
}
</script>
