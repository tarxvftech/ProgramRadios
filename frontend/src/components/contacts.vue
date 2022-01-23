<style scoped>
.contacts {
}
</style>
<template>
  <div class="contacts">
    <!--Contacts Editor, -->
    <!--later, will include rxgroups-->
    <!--Looks a lot like the channel editor and zones-->
    <div v-if="has_codeplug">
      <div class="contact_list">
        <label>Contacts (Warning: Not implemented Yet!)</label>
        <div class="contacts warnings">
          <div v-if="contacts.max > 1000">
            Note: Filtering can be slow with large codeplugs like this one
          </div>
          <div v-if="contacts.max > 1000">
            Note: Hover highlights disabled
          </div>
        </div>
        <div class="contacts controls">
          <input placeholder="filter" type="filter" class="contact_filter" v-model="contact_filter_value" />
          <span data-augmented-ui class="aug control interactive addall" 
                @click="addallcontactstorxgroup()" 
                v-if="contact_filter_value.length > 0">
            + add all visible to zone (until full)
          </span>
          <coveredcontrol v-if="contact_filter_value.length > 0" covertype="plain" label="DEL ALL VIS">
            <span class="control interactive " 
                  @click="delallcontacts()" 
                  v-if="contact_filter_value.length > 0">
              ⌦ delete all visible contacts
            </span>
          </coveredcontrol>
        </div>
        <div v-for="(contact,cidx) of filtered_contacts" :key="contact.ridx" 
             @mouseover="hover_contact(contact)" :id="`contact_${cidx}`"
             class="contact textinteractive"
             :class="{ highlight: (!edit_zone && contact.ridx == contactidx) || highlightcontacts.includes(cidx) }"
             >
          <!--{{String(cidx).padStart(4,"0")}}-->
          <span class="" v-if="! contact.deleted" >
            <span class="textinteractive control" @click="contactdel(contact)">⌦</span>
            <span class="textinteractive control" @click="contactedit(contact)">🖉</span>
            <span class="textinteractive control" @click="addcontacttorxgroup(contact)">+</span>
            <!--<span class="control" @click="addcontacttozone(contact)">＋+➕</span>-->

            <!--<Microcontact class="" :contactidx="contact.ridx" :rw="true" />-->
            <span class="contact single">
              <span>{{ contact["Contact Name"] }}</span>
              <span>{{ contact["Call ID"] }}</span>
            </span>
          </span>
          <span class="textinteractive" v-else @click="contactundel(contact)">
            <!--<span class="control" @click="contactundel(contact)">+ </span>-->
            (empty contact, click to add)
          </span>
        </div>
      </div>

    </div>
    <div v-else>
      No codeplug loaded.
    </div>
  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex';
import coveredcontrol from '@/components/coveredcontrol.vue'
//import Name from '@/components/source.vue'
//import { wait_for, save_data } from '@/libs/misc.js';
//import rf from '@/libs/rf.js';
//import tytdfu from '@/libs/dfu.js';
//import codeplugs from '@/libs/codeplug.js';

export default {
  name: "Contacts",
  props: [],
  components:{
    coveredcontrol,
  },
  computed:{
    //...mapState('devtools',['devmode']),
    ...mapState('codeplugs',['current_codeplug']),
    filtered_contacts(){
      return this.contacts;
    },
    contacts(){
      if( this.has_codeplug ){
        return this.current_codeplug.editor.Contacts;
      } else {
        return [];
      }
    },
    has_codeplug(){
      return this.current_codeplug != undefined;
    }
  },
  methods: {
    //...mapMutations('codeplugs',['add_codeplug']),
    hover_contact(contact){
      console.log(contact);
    },
    contactedit(contact){
      console.log(contact);
    },
    contactdel(contact){
      console.log(contact);
      contact.deleted = true;
      this.$forceUpdate();
    },
    contactundel(contact){
      console.log(contact);
      contact.deleted = false;
      this.$forceUpdate();
    },
    addcontacttorxgroup(contact){
      console.log(contact);
    },
  },
  data(){
    return {
      contact_filter_value: "",
      contactidx: 0,
      highlightcontacts: [],
      edit_zone: null,
    }
  }
}
</script>
