<template>
  <div>
      <!-- should be a brief, excellent tutorial on how to connect the radio -->
      <!-- and a short thing showing how to select the device from the popup is necessary too -->
      <!-- TODO: needs videos/gifs -->
    <div class="instructions" > 
      <h5>USB Instructions</h5>
      <p v-if="!usb && !devmode">
      Sorry! You'll have to read and write the radio using other tools, but you can still edit codeplugs using this website.
      <br>

      Direct USB communication with a radio requires Chrome, Chromium, or Opera
      browsers, running on Mac OS or Linux. 
      <br>
      As far as my code can tell, your system is not supported.
      <br>

      It may be too old, not a supported configuration,
      or have WebUSB disabled. 
      <br>
      If you believe it should work but doesn't, contact 
      <strong>support <em>[at]</em> tarxvf.tech</strong>. 
      </p>
      <div v-else>
        <div v-if="codeplugmode">
          <p>While the radio is off, connect your USB cable to your computer and MD-380, MD-2017, or MD-UV380 series radio.</p>
          <p>Turn the radio on like normal.</p>
          <p>Tune the radio to a channel with <em>no activity</em>. </p>
        </div>
        <div v-if="firmwaremode">
        <p>While the radio is off, connect your USB cable to your computer and MD-380, MD-2017, or MD-UV380 series radio.</p>
        <p>To boot the radio into the special bootloader mode, you'll need to hold a button combination while turning on the radio.</p>
        <p>For the MD-380 and MD-UV380, hold the PTT and the button directly above the PTT.</p>
        <p>For the MD-2017, hold the PTT and the orange button above the display.</p>
        <p>You'll know it worked if the Tx/Rx LED is alternating between red and green, for about half a second each.</p>
        </div>
        <div v-if="recoverymode">
        </div>
        <p>Now press the "Connect Radio(s)" button at the top of this
        page. If you've already allowed the browser access to the radio,
        it will be immediately displayed on the page.</p>

        <p>Otherwise, you will be prompted to allow the connection with
        a popup window. Select the radio from the list, and press the
        "Connect" button and it should appear on the page.</p>
        <!--<p>Allowing access to one radio will allow access to all radios on some platforms, and it will be remembered. </p>-->
        <p>(On Android, you will have to allow access to each radio every time.)</p>
        <p>If the menu doesn't pop up at all, contact <strong>support <em>[at]</em> tarxvf.tech</strong>.</p>

        <p>If the menu pops up but your device isn't listed there, verify you
        are using a Tytera (not a baofeng!) cable, the radio is on,
        and both sides are firmly connected.</p>
        <p>If it <em>still</em> doesn't show up, contact support, give as much detail as possible, and we'll figure it out together.</p>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex';
export default {
  name: "USBHelp",
  props: [],
  methods: {
  },
  computed:{
    ...mapState('devtools',['devmode']),
    codeplugmode(){
      return this.currentview == "USB"; //TODO fix this name
    },
    firmwaremode(){
      return this.currentview == "firmware";
    },
    recoverymode(){
      return this.currentview == "recover"; 
    },
    currentview(){
      return this.$route.name;
    },
  },
  data(){
    return {
      usb: navigator.usb !== undefined,
    }
  }
}
</script>
<style scoped>
</style>
