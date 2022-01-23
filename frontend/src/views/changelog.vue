<style scoped>
.changelog {
  max-width: 40em;
  margin: 0 auto;
}
li h4 {
  display: inline-block;
}
</style>
<template>
  <div class="changelog">
    <markdown :src="src">
    </markdown>
  </div>
</template>
<script>
//TODO use a markdown editor from now on somehow
//https://github.com/JanGuillermo/vue3-markdown-it
//markdown-it, etc
import markdown from '@/components/markdown.vue'
const future =`
* User storage requires an account, but allows you to upload codeplugs and firmware for later use.
* Can share codeplugs and firmware images with other users.
* firmware image system recommends latest compatible firmware or close to it
* one-click OpenRTX release install
* one-click OpenRTX-nightly install
* "how to use this site" (all dropdowns indicate current state, not an action to complete. buttons are actions .. but how to show that?)
* TODO: made channel filtering way faster by properly not showing deleted channels (will still be slow (a few seconds) if you have 10,000 channels ... but pretty damn fast relative to anything else you use). Can almost certainly be sped up, it's slow because it renders a vue component for every single channel.
* drag a channel from channel list onto zone in zone list or zone channel bank
* need a way to indicate empty channels and zones, and a way to add a new channel, and a way to indicate when there's no more space
* Zone/Channel editing enabled. (Channel adding/deleting not yet ready to be enabled.)
* SaasForm added.
* User registration enabled.
* Change a whole bunch of names and organization of codeplugs.json to not have spaces in them and be better named
* consolidate models in codeplugs.json if possible?

#### 2.0.0 (coming much later) ####
Anytone Codeplug support

#### 1.1.0 (coming later) ####
* Automatic codeplug generation - brandmeister hotspot
* (which requires adding repeaters manually)

#### 1.0.0 (coming soon) ####
* Automatic codeplug generation - new england NEDECN 
* Automatic codeplug generation - FCC Part 90
* Automatic codeplug generation - Encryption Keys
* Codeplug download
* Which implies RDT headers fully working!

#### 0.9.2 (coming next) ####
* Fix the zone entries greater than 16 issue (done for reading, not writing)
* set_value to support extOffset done
* Mobile support added for codeplug editing
* Demo mode
* Consolidate all vue components 

`;
const txt=`
# ChangeLog #


#### 0.9.4 bugfix (You are here!) ####
* MD-380 vs MD-390 distinction fixed on both firmware backend and frontend, codeplug reading/writing.
#### 0.9.3 bugfix ####
* ✔ CSS is inconsistent between firefox and chromium - see usb stuff. Fixed by adjusting existing and adding another css grid.
* ✔ page not found when tabs clicked when in usb mode - so make sure those tabs dont show up unless CPS is being used. Now hides tabs unless there's a codeplug selected so the links will always work.
* ✔ first fix not sufficient, make sure tabs don't show up when showing USB or make sure tabs have more explicit routing
* ✔ deleting a codeplug doesnt go back to codeplug selection page. Now redirects to codeplug selection page when deleting the selected codeplug.
* ✔ read codeplug from each radio button: "md380_custom failed". Workaround: disabled button for now, I'm not expecting many other people connecting a dozen radios at a time besides myself.
* ✔ codeplug reading/writing doesnt have statusmsg messages when done. Now describes start and finish.
  * looks like thats more a consequence of the way I let webdfuradios do codeplug stuff...
  * webdfuradio and connectedradio have far too many crossing of concerns. TODO
* ✔ show an error when click write codeplug but none selected. Now shows an error.
* ✔ MD-UV380 (no GPS) has no picture. Picture added.
* ✔ Adjust backend to correctly served tagged firmwares (rather than rewriting model strings).
* ✔ Fixed firmware lists being incorrect/shared after one radio is disconnected. (Bad Vue3 :key)
* ╳ Still has a number of other bugs but nothing show-stopping as far as I can tell.


#### 0.9.2 ####
* Revamp of a lot of backend stuff involving firmware, which allows...
* OpenRTX Nightlies and releases automatically fetched
* Lifted old encryption/keyloader and DMR ID settings pages.
* Contacts page added, but largely non-functional right now. Sorry! Almost there.
* Lots of behind-the-scenes work on fully distributed and fully open
repeater and license databases, working together with KC1AWV. Nothing usable yet,
but there's some VERY interesting ideas in there.

#### 0.9.1 ####
* First draft mobile phone UI support added for codeplug editing (not great but hopefully usable for basic editing needs)
* UI tabs for contacts, settings, keyloader, etc
* Encryption keys component re-added and updated
* Lots of UI changes overall
* Massive improvements in codeplug editing, to include double
click single-line editing of channels for DMR, FM, NFM. Needs
documentation/instructions still.
* DR680 (Connect Systems CS700) support added, including firmware and
codeplug support.
* (Not Included Yet): Ground broken on a WebSocket USB/Serial shim for
platforms without WebUSB/WebSerial or where drivers for WebUSB would
be a pain/impossible. Still in investigative phase, really. Considering
whether this shim would be handy to have on a dmr hotspot or similar.


#### 0.9.0 ####
Known bugs:
* Zone entries greater than 16 can't be written to, only read
* filtering channels can be slow on codeplugs for dual band radios (needs to be optimized)
* dual band radio zones have A and B channel lists - I only support A at the moment. 
I will sync A to B later, and eventually may add support for independent lists if there's demand.
* No contacts editor
* Well, there's lots of missing features, but that one is actually kinda important.
* downloading the codeplug is disabled because the rdt header is not filled out properly - which means there's no way to save a codeplug except by writing it to a radio!
* UI on mobile phones (and in general, honestly) is broken/unusable.
* backend: firmware doesn't get updated automatically

Changelog:
* Significant (2 Bell!) speed improvement in channel list / zone list by using javascript proxies all the way down. 
* While doing this, also (finally!) added the channel add/delete functionality.
* Cleaned up a bit of the backend codeplug editor while doing that, still plenty of work to do there of course.
* Channel edit functionality is now live.
* Can add all selected channels (i.e. displayed with the current filter)
to selected zone. This will only work for the first of however many empty
entries are in the zone. Short circuits execution when no more space,
so it won't hang from trying to add 3000 channels to a 16 channel zone.
* Added ability to filter channels by substrings of the rendered channel
summary - but that meant that typing CC1 would also return results for
CC10, which I didn't want, so I disabled it. I'll have to think about
that some more.
* When filtering channels, DMR channels still have analog settings and
vice versa - so you could enter "EN67" meaning to search for all repeaters
with a an access tone of 67 Hz and end up with DMR channels. This has
been fixed by only returning results that are of the correct mode when
searching for mode-specific values.
* Channel deletion "works" but still renders an entry for every channel, so in practical terms it's not very useful. Same for zones. I have to revisit the records/fields file proxy API to fix this.
* Zone editing will fail on dual band radios still.
* Added a highlight feature, to quickly show in the relevant panes which
channels are in a zone that you hover over a zone entry, or which zones
a channel is included in when hovering over a channel. Disabled it,
because it interferes with smooth scrolling when operating on large
(2000+ channel) codeplugs.

* Found a 'bug' where my understanding of Tytera's terrible codeplug
format was incorrect. Zones have an array of channel indexes - and when
going from the single band radio codeplug format to the dual banders with
more memory, they increased the zone sizes. They did this by adding a
huge offset and saying "anything over channel entry 16 (the old formats
max zone size) is stored hundreds of thousands of bytes away". This is
broken and dumb, and none of my code expects it, but it's not something
I have control over. I have been taking the binary file, splitting the
bytes of it into "records" (so one channel record is just the bytes used
to represent that record). Doing that for a zone would, for the first
gen codeplug format, include all the zone channel entries. That doesn't
work for second gen codeplugs, because each zones storage is split up
into multiple locations. Maybe I can glue multiple subarrays together
and have it "just work"? Just tried it, not worth it. Just going to have
to pass the whole codeplug around all the time, which means redoing a
bunch of plumbing. At least now I have a good excuse and can fix it some more.
* Added a bug for parsing and setting values smaller than one byte while doing that replumbing.
* Fixed a bug for values smaller than one byte. It's in cut_field if bs == 0.
* In doing all the above, vue reactivity is broken on the codeplug object, so I need to read up on that.
* Turns out I broke reactivity by stupidly implementing toStringTag prop
without knowing what that does. Thank God and Linus for git, which made
that difference really obvious. And may that be a lesson to me on implementing methods on proxies for props I don't understand xD
* Adjusted codeplug editor page CSS a bit
* Experimented with v-model.lazy for channel filtering - don't need it on
gen1 codeplugs, but gen2 with multiple thousands of channels instead of
just one thousand can create some input lag. Going to leave it without
for now but 100% certain it can be optimized more.
* Added zone filtering - filters on name only at the moment. Not sure it needs more than that.
* First basic codeplug editing capable version.


#### 0.8.0 ####
* Massive CSS revamp, including colors and such being done with css variables. Found a few fonts I like.
* Theme support added (Makes it easier to test colors and fonts and compare)
* Created a coveredcontrol component. Makes for an interesting way of doing "are you sure" checks and looks like a switch cover implemented in CSS. Kinda neat. No use for it at the moment, doesn't fit the theming.
* (never deployed publicly)



#### 0.7.5 ####
* Released at the same time as OpenRTX 0.3, since I've added first-class support for flashing OpenRTX releases using the firmware upgrade feature here.
* ~~(Maybe) First release with basic codeplug editing enabled! Otherwise it'll be the last release without it. :)~~ That didn't work out, did it?
* Deleted like 500 lines of old code!
* First "release" with a full docker image and backend deployed to production
###### Backend #######
* firmware support, 
* firmware tags, 
* API improvements and testing
* firmware for-radio implementation (present a list of available firmwares for a radio model)
* (Which includes adding OpenRTX firmware releases through a simple updater script (on my end) for easily keeping the OpenRTX firmware list up to date)
* (includes frontend work to support new firmware list api)
* UWSGI for production usage setup and testing
###### Frontend #######
* Fixed a bug in MD2017 codeplug support due to using an incorrect length (too short) on the General Settings subarray
* (Not enabled yet:) Much work on getting the codeplug features ready.
  * Including channel filtering
  * Zone channel reordering through drag-and-drop
* Started a library in javascript for consuming the dmr.tools backend API
* Annoyed by hand-writing HTML for many subpages (and this changelog), I tried to get a Vue component to render markdown.
* I discovered Vue issues around whitespace and slots that prevent markdown rendering components, and discovered [Vue #1600](https://github.com/vuejs/vue-next/pull/1600) related to this, which is scheduled to be fixed in Vue 3.1.
* ~~So I've wrapped this changelog in a pre tag for now, and will remove it later.~~
* So I'm passing the text as a prop for now, which is fine


#### 0.6.2 ####
* Fixed Color Code, Bandwidth, Timeslot, and other bitfield based parts of the codeplug. Write bitmask was not being shifted over.
* Fixed BCD encodings. Now properly handles little endian.
* Now properly hides codeplug records that aren't currently in use, including contacts and rxgrouplists (TODO: Allow for 'opening' them).

* Added backend server. Supports OpenRTX firmware downloads based on github releases (need a backend server to cache Github API responses and avoid CORS issues with the actual firmware download).
* Added support for boolean data types in the codeplug.
* Added mostly-working "set all advanced options to defaults" action for channels. 


#### 0.6.1 ####
* Adjusting USB radio display for low resolution or portrait oriented screens (omits the radio image, makes things a little more responsive).
* Added this changelog page
* Fixed main menu for mobile displays (removed unnecessary scrolling)


#### 0.6.0 ####
* Firmware upgrade capability added
* Complete revamp of interface


#### &lt;= 0.5.1 ####
* Prototypes! Basically, getting all the javascript stuff nice but not paying attention to design
* Zone channel reordering
* Basic codeplug editing working in JS, sped up with JS Proxy usage
* Early interfaces for codeplug editing that weren't very good
* Codeplug upload and download, multi-radio capability
`
export default {
  components: {
    markdown
  },
  data(){
    return {
      src:txt
    }
  }
}
</script>
<style>
</style>
