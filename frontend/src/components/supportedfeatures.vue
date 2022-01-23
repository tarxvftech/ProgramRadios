<style scoped>

.supportedfeatures {
  max-width: 38em;
  margin: 0 auto;
}
table {
  max-width: 40em;
}
td, th{
  text-align:center;
}
tbody tr > th {
  text-align: left;
}
.myplatform {
  background-color: rgba(51,107,59,1);
  color: white;
  border-radius: 1em;
}
</style>
<template>
  <div class="supportedfeatures">
    <!--<h2>{{isChrome}}</h2>-->
    <!--<h2>{{OS}}</h2>-->
    <h3 hidden>You're using "{{getPlatform}}"</h3>

    <table>
      <colgroup
        v-for="(values,platform,idx) in platforms.length" 
        :key="idx"
        :class="{myplatform:getPlatform == platform}"
        >
      </colgroup>
        <thead>
          <tr>
            <th>_</th>
            <th v-for="(values,platform,idx) in platforms" :key="platform" 
                :class="{myplatform:getPlatform == platform}"
                >
                {{platform}}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(feature,featureidx) of features" :key="feature">
            <th>{{feature}}</th>
            <td 
              v-for="(values,platform,platformidx) of platforms" :key="platformidx"
              :class="{myplatform:getPlatform == platform && values[featureidx] == '✔'}"
              >
              <!--<input type="checkbox" :checked="values[featureidx]" />-->
              {{values[featureidx]}}
            </td>
          </tr>
        </tbody>
    </table>
    <p>
    Linux users: You may need <a href="/99-md380.rules">these udev rules</a> to allow your user access to USB devices.
    </p>
    <h3>What are these features?</h3>
    <p>
    "Edit codeplugs" in the table above means just that - loading, creating, modifying, and saving the data files used to program your radio with channels and other settings.
    That's well supported in any modern browser, including mobile phones.
    </p>
    <p>
    Programming it to your radio straight from the browser is a different
    matter, for <a href="https://caniuse.com/webusb">technical
      reasons</a>.  
    </p>
    <p>
    Windows is not supported for USB radio features for even more <a href="https://web.dev/build-for-webusb/#windows">technical reasons</a>.
    </p>
    <p>
    In the meantime, you can still edit your codeplug with this website
    and flash it to the radio with the OEM software, Farnsworth's EditCP,
    or radio_tool.
    </p>
  </div>
</template>
<script>
/* TODO:
link to caniuse
highlight identified current platform for what features are currently working*
 */
export default {
  name: "SupportedFeaturesMatrix",
  props: [],
  methods: {
  },
  computed:{
    isChrome(){
      return navigator.userAgent.includes("Chrome");
    },
    OS(){
      return navigator.platform.split(" ")[0];
    },
    getPlatform(){
      let s = "";
      if( this.isChrome ){
        s+="Chrome / ";
      } else {
        s+="other";
        return s;
      }
      s += this.OS;
      return s;

    },
    isPlatform(target){
      const plats = {
        "Chrome / Android": ()=>this.isChrome && this.OS == "Android",
        "Chrome / Linux": ()=>this.isChrome && this.OS == "Linux",
        "Chrome / MacOS": ()=>this.isChrome && this.OS == "MacOS",
      };
      return "no";
    },
  },
  data(){
    return {
      features:["USB Support", "Edit Codeplugs"],
      platforms:{
        "Chrome / Android":["✔","✔"],
        "Chrome / Linux":["✔","✔"],
        "Chrome / MacOS":["✔","✔"],
        "Other":["╳","✔"],
        "iOS":["╳","✔"],
      },
    }
  }
}
//TODO doesn't display well on narrow screens
</script>
