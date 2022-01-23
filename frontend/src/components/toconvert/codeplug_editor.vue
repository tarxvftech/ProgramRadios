Vue.component('basic_information', {
    props:["record"],
    template:`
    <div class="v_bi" >
        <label>Radio: </label> {{record["Model Name"]}}
    </div>
    `
});
Vue.component('general_settings', {
    props:["record"],
    template:`
    <div class="v_gs" >
        <label>Radio ID </label>
            <input type=number v-model="record['Radio ID']" />
        <label>Secondary Radio ID 1 </label>
            <input type=number v-model="record['Radio ID 1']" />
        <label>Secondary Radio ID 2 </label>
            <input type=number v-model="record['Radio ID 2']" />
        <label>Secondary Radio ID 3 </label>
            <input type=number v-model="record['Radio ID 3']" />
    </div>
    `
});

//TODO in other file: commgroups aren't done right, see https://michaelnthiessen.com/force-re-render/
//for more details
Vue.component('codeplug_editor', {
    props:["editor"],
    methods:{
        save: function(){
            let t = new Date();
            let ts = [
                t.getFullYear(),
                t.getMonth()+1, //wtf javascript
                t.getDate(),    //not getDay, mind you
                t.getHours(),
                t.getMinutes()
            ].map(x=>String(x).padStart(2,"0")).join("");
            save_codeplug(this.editor._cp,`tarxvf_tech_${ts}.rdt`);
        }
    },
    template:`
    <div class="v_ce">
        <button @click="save">Save codeplug</button>
        <basic_information :record="editor['Basic Information']" />
        <general_settings :record="editor['General Settings']" />
        <encryption_keys :record="editor['Privacy Settings']" />

    </div>
    `
});
