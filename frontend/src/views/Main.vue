
<style scoped>
.mainmenu {
  max-width: 26em;
  margin-left: auto;
  margin-right: auto;
}
.submenu {
}
.submenu h2 {
  max-width: 10em;
  margin-left: auto;
  margin-right: auto;
}
.submenu ul {
  overflow: visible;
  max-width: 20em;
  margin-left: auto;
  margin-right: auto;
  text-decoration: none;
  list-style-type: none;
}
.submenu ul li {
  margin-left: 1em;
}

@media only screen and (min-width: 450px){ 
  #starthere::after {
    animation: 1.5s infinite alternate slidein;
    content: " <- Start here!";
    position: relative;
  }
  @keyframes slidein {
    from {
      left: 25px;
    }
    to {
      left: 10px;
    }
  }
}
.subscription::after {
  -content: " $";
}
</style>
<template>
    <div class="mainmenu">
      <div class="submenu" >
        <h2>Codeplugs</h2>
        <ul>
          <!--<li hidden>Start Fresh</li>-->
          <!--<li hidden>My Computer</li>-->
          <!--<li hidden>The Cloud<sup>™️</sup></li>-->
          <!--<li>My Computer</li>-->
          <li id="nostarthere"><router-link to="/edit/cp/select">Select A Codeplug</router-link></li>
          <!--<li class="subscription"><router-link to="/manualcps">Edit Codeplug</router-link>  </li>-->
          <!--<li class="subscription"><router-link to="/singlechannel">Edit A Single Channel</router-link>  </li>-->
          <!--<li class="subscription"><router-link to="/singlechannel">Single CHannel detail view (to be accessed from edit codeplug only)</router-link>  </li>-->
          <!--<li class="subscription"><router-link to="/keyloader">Set Encryption Keys</router-link>  </li>-->
          <!--<li><router-link to="/usb">To/From Radio</router-link>  </li>-->
          <!--<li><router-link to="/usb">Transfer To/From Radio</router-link> <img class="small" src="/images/usb3.svg"/> </li>-->
          <!--<li><router-link to="/usb">Clone Tool</router-link> <img class="small" src="/images/usb3.svg"/> </li>-->
          <!--<li><router-link to="/usb">Fleet Management</router-link> <img class="small" src="/images/usb3.svg"/> </li>-->
        </ul>
      </div>
      <div class="submenu">
        <h2 class="">Firmware
        <!-- TODO: make this a help/explanation link/hover -->
        </h2>
        <ul>
          <li class=""><router-link to="/flashfirmware">Upgrade</router-link> <img class="small" src="/images/usb3.svg"/> </li>
          <!--<li class=""><router-link to="/recoverradios">Recover</router-link><img class="small" src="/images/usb3.svg"/> </li>-->
        </ul>
      </div>
      <!--<div class="submenu" hidden>-->
        <!--<h2 class="">Share-->
        <!--</h2>-->
        <!--<ul>-->
          <!--<li class=""><router-link to="/db/codeplugs">Codeplugs</router-link> </li>-->
          <!--<li class=""><router-link to="/db/repeaters">Repeaters</router-link> </li>-->
          <!--<li class=""><router-link to="/db/talkgroups">Talkgroups</router-link> </li>-->
          <!--<li class=""><router-link to="/db/firmware">Firmware</router-link> </li>-->
        <!--</ul>-->
      <!--</div>-->
      <div class="submenu">
        <h2>DMR.Tools</h2>
        <ul>
          <li><Login /> </li>
          <li> <router-link to="/about">About</router-link> </li>
          <li>Version <router-link to="/changelog"><span class="version"> v0.9.3 </span></router-link></li>
          <li>Made by <a href="https://tarxvf.tech" target="_blank">TARXVF</a></li>
          <li><ThemeSelect /></li>
          <!--<li id="starthere"><router-link to="/componentdev">component dev</router-link></li>-->
        </ul>
      </div>
    </div> <!-- /mainmenu-->
</template>
<script>
import { mapState, mapMutations } from 'vuex';
import ThemeSelect from '@/components/themeselect.vue'
import Login from '@/components/login.vue'
export default {
  name: "MainMenu",
  props: [],
  components:{
    ThemeSelect,
    Login
  },
  computed:{
    ...mapState('devtools',['devmode']),
  },
  methods:{
    //TODO: Ping method to API (which will actually be an API check)
    //TODO: cookie check, login, and logout to API
  },
  data(){
    return {
    }
  }
}
</script>
