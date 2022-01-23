<style scoped>
.about {
  max-width: 40em;
  margin: 0 auto;
}
</style>
<template>
  <div class="about">
    <h1>About</h1>
    <p>DMR.Tools is a new way to program certain TYT and Retevis radios such as the MD-380, MD-UV380, MD-2017 and clones of those radios.</p>
    <p>Right now it's limited to Chrome or Chromium on Mac OS, Android, or Linux</p>
    <p>It is the only codeplug editor that can read, write, upgrade, and clone multiple radios simultaneously. </p>
    <p>I intend to make it an <em>advanced codeplug editing platform</em>, capable of more than merely modifying channels.</p>
    <p>(You can use it on other browsers and systems, but won't be able to use any features that communicate with the radio directly, so you may still need the OEM software to actually flash the codeplug or firmware)</p>
    <h3>What Radios are supported?</h3>
    <p>
    Right now, only TYT (previously known as Tytera) MD-380, MD-2017,
    and MD-UV380 series radios. 
    </p>
    <p>
    This includes the following known rebranded or derivative radios:</p>
    <ul v-for="(list,m) in radios" :key="m">
      <h5>{{m}}</h5>
      <li v-for="r in list" :key="r">{{r}}</li>
    </ul>
    <p>There are enough rebrands it's hard to keep track of them all,
    so please email me if you know of compatible radios</p>
    <h3>What features are supported on what platforms?</h3>
    <SupportedFeaturesMatrix />
  </div>
</template>
<script>
import SupportedFeaturesMatrix from '@/components/supportedfeatures.vue'
export default {
  components: {
    SupportedFeaturesMatrix
  },
  data(){
    return {
      radios:{
        "TYT":[
          "MD-380", "MD-390",
          "MD-2017", "MD-UV380", "MD-UV390"
          ],
        "Retevis":[
          "RT-3 (equivalent to MD-380)", 
          "RT3S (equivalent to MD-UV380)", 
          ],
        }
    }
  }
}
</script>
<style>
</style>
