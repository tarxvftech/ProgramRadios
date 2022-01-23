

.cg_type {
}
.cg_type.editable {
}

.commgroup {
}
.commgroup.editable {
}
.colorcode {
  border-radius: .2em;
  border: 1px solid black;
  padding: .25em .5em;
  margin: 0px 1em;
}
table {
  border-collapse: unset;
}
table th[scope="col"] {
  position: sticky;
  top: 0;
  background-color: #f9f9f9;
  min-width: 8em;
  border-bottom: 4px solid black;
  z-index: 5;
}
table th[scope="row"] {
  background-color: #f9f9f9;
  border-right: 4px solid black;
  position: sticky;
  left: 0;
  z-index: 6;
}



/* DMR tools stuff */
/* checkbox styling */
span.✔::after {
  font-size: 150%;
  content: "✔";
}
INPUT[type=checkbox]:focus {
  outline: 1px dashed green;
}

input[type=checkbox] {
  outline:none;
  clear: both;
  width: 30px;
  height: 30px;
  background-color: #eee;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  margin: 1px 1px;
  /*position: relative;*/
  /*top: 25px;*/
}

input[type=checkbox]:checked::after {
  content: "✔";
  font-size: 200%;
  position: relative;
  top: -4px;
  color: black;
  width: 100%;
  border: none;
}
input[type=checkbox].some:not(:checked)::after {
  content: "/";
  font-weight: bold;
  font-size: 205%;
  position: relative;
  top: -5px;
  left: 8px;
  color: blue;
  width: 100%;
  border: none;
}
input[type=checkbox]:checked
{
  background-color: #409fd6;
  /*background: #409fd6 url("data:image/gif;base64,R0lGODlhCwAKAIABAP////3cnSH5BAEKAAEALAAAAAALAAoAAAIUjH+AC73WHIsw0UCjglraO20PNhYAOw==") 10px 10px no-repeat;*/
}

/* end checkbox styling */
Vue.component('channel_commgroup_table', {
    props: [
        "grouped_channels","grouped_commgroups","grouped_chancomms",
        "custom_commgroups"
    ],
    computed: {
    },
    data:function(){
        return {
            enabled:[],
            name:"enabled"
        }
    },
    methods:{
        add_cg: function(){
            this.custom_commgroups.push({id:uuidv4()});
        },
        clear: function(){
            this.enabled = [];
            console.log(this.enabled);
            this.propagate(this.enabled);
        },
        remove: function(name){
            window.sessionStorage.setItem(name,JSON.stringify([]))
        },
        save: function(name){
            window.sessionStorage.setItem(name,JSON.stringify(this.enabled))
        },
        propagate: function(selected){
            function id(straw){
                return straw.map(x=>x.id).join("_");
            }
            document.querySelectorAll("input[type=checkbox]").forEach(x=>x.checked = false);
            for( var pair of selected ){
                var pairid = id(pair);
                console.log(pairid);
                document.querySelector("#"+pairid).checked = true
            }
        },
        load: function(name){
            var existing = JSON.parse(window.sessionStorage.getItem(name));
            //console.log(existing);
            this.enabled = existing;
            this.propagate(this.enabled);
            //this.generate();
        },
        toggle: function(channel_or_groupname,commgroup){
            if( typeof(channel_or_groupname) == typeof("just a string") ){
                //console.log("how to toggle a group?");
                //yeah, this sucks.
                var channel = {
                    id:channel_or_groupname,
                    type: "group",
                    num_channels: 0
                }
            } else {
                var channel = channel_or_groupname;
            }
            function removed(haystack,needle){
                function id(straw){
                    return straw.map(x=>x.id).join("_");
                }
                //can't compare by value, so this'll work
                var needleid = id(needle);
                return haystack.filter(straw=>id(straw)!=needleid);
            }
            var pair = [channel, commgroup];
            var enabled = this.enabled;
            var enabled2 = removed(enabled,pair);
            if( enabled.length == enabled2.length ){
                //no changes, so we just enabled it
                enabled.push(pair);
            } else {
                //removed an item to disable it, so make sure that gets saved
                this.enabled = enabled2;
            }
            this.save("default");
            //console.log(this.enabled);
        },
        expand: function(target){
            //console.log(this,target);
            document.querySelectorAll("tr[group="+target+"]").forEach(x=>x.hidden=!x.hidden);
        },
        generate: function(evt){
            //TODO: generate a CSV and send to backend to render to a codeplug format with Chirp
            //console.log(evt, this.enabled);
            var radio_channels = [];
            for(var pair of this.enabled){
                var [c,cg] = pair;
                //console.log(c.id,c);
                if( c.type == "group"){
                    var channels = this.grouped_channels[c.id];
                }
                else {
                    var channels = [c];
                }
                for( var c of channels ){
                    //console.log(c.id,cg.id);
                    var rc = {...cg, ...c};
                    rc.name = cg.name + "_"+c.name;
                    rc.tags = [cg.type, c.type, freq_to_band(c.freq)];
                    if( c.callsign ){
                        rc.tags.push(c.callsign);
                    }
                    rc.type = c.type;
                    radio_channels.push(rc);
                }
            }
            console.log(radio_channels);
            console.log(radio_channels[0]);
            function make_zones(radio_channels){
                var zones = [{
                    "name": "default zone",
                    "channels":radio_channels,
                    "num_channels": radio_channels.length
                }];
                var group_bys = radio_channels.map(x=>x.group_by).filter((v,i,s)=>s.indexOf(v) === i);
                //there are many different ways to group things
                for( var key of group_bys ){
                    var instances = radio_channels.map(x=>x[key]).filter((v,i,s)=>s.indexOf(v) === i);
                    //For each different way to group things, there are multiple instances
                    for( var i of instances ){
                        var channels = radio_channels.filter(x=>x.group_by == key && x[key] == i);
                        //for each instance, there are a set of associated channels that should be zoned together
                        if( channels.length ){
                            zones.push({
                                "name":i,
                                "group_by":key,
                                "channels":channels,
                                "num_channels":channels.length
                            });
                        }
                    }

                }
                return zones;
            }
            var rz = make_zones(radio_channels);
            console.log(rz);
            function make_m17_codeplug(radio_zones){
                var cp = "";
                indent = 0;
                add = function(indent,x){return cp + "  ".repeat(indent) + x + "\n"};
                cp = add(indent++, "codeplug");
                cp = add(indent, 'author="dev.dmr.tools"');
                cp = add(indent, 'version="testing"');
                cp = add(indent, 'num_banks=' + radio_zones.length);
                for( var z of radio_zones ){
                    cp = add(indent++, 'bank');
                    cp = add(indent, `name="${z.name}"`);
                    cp = add(indent, `num_channels="${z.num_channels}"`);
                    for( var c of z.channels ){
                        cp = add(indent++, 'channel');
                        for( var p in c ){
                            var v = c[p];
                            if( v != null && v != undefined ){
                                cp = add(indent, `${p}="${v}"`);
                            }
                        }
                        cp = add(--indent, 'end');
                    }
                    cp = add(--indent, 'end');
                }
                cp = add(--indent, 'end');
                return cp
                
            }
            var m17cp = make_m17_codeplug(rz);
            console.log(m17cp);
            save_codeplug(m17cp,"CODEPLUG");
            save_codeplug(JSON.stringify(rz, null, 2),"zones.json");
            
        }
    },
    template: `
    <div>
        <div hidden>
        <label>Store in browser<input v-model="name" /></label>
        <button @click="load">load</button>
        <button @click="save">save</button>
        <button @click="remove">remove</button>
        </div>
        <br>
        <h3>Pre-made popular commgroups</h3>
        <p>Expand the lists, and then select which commgroups you want to program into your radio</p>
        <div v-for="(cglist,cglistname) in grouped_commgroups">
            <commgroups_editor :custom_commgroups="custom_commgroups" :can_modify="false" v-bind:name="cglistname" v-bind:cglist="cglist" />
        </div>
        <h3>These are the commgroups you've selected or added yourself</h3>
        <p>This list makes up the columns in the interselector</p>
        <commgroups_editor :can_modify="true" name="Commgroups to program" v-bind:cglist="custom_commgroups" />
        
        <br>


        <button @click="generate">Generate Codeplug</button>
        <button @click="clear">Reset Selections</button>
        <table class="pure-table primary">
            <tbody>
                <tr>
                <th scope="column">RFChannels</th>
                <th scope="column">Commgroups</th>
                </tr>
            </tbody>
            <tbody v-for="(channels, dsid) in grouped_channels">
                <tr>
                    <th scope="row" :title="channels|json">
                        <button class="full" @click="expand(dsid)">Expand {{dsid}} ({{channels.length}})</button>
                    </th>
                    <th scope="col" 
                        v-for="cg in custom_commgroups"
                        :title="cg|json">
                        <label>
                            <input 
                                type="checkbox" 
                                v-bind:id="dsid+'_'+cg.id"
                                v-bind:class="{ some: enabled.some(e=>channels.map(x=>x.id).includes(e[0].id) && e[1].id==cg.id)}"
                                @change="toggle(dsid,cg)"
                                />
                        <span>{{cg.name}}</span>
                        </label>
                    </th>
                </tr>
                <tr v-for="(channel,channelidx) in channels" v-bind:cid="channel.id" v-bind:group="dsid" hidden=True>
                    <th scope="row" :title="channel|json">
                        <span v-if="channel.type == 'repeater'">{{channel.callsign}}</span>
                        <frequency v-bind:channel="channel" />
                        <colorcode v-if="channel.colorcode >= 0" v-bind:cc="channel.colorcode" />
                    </th>
                    <td v-for="(cg,cgidx) in custom_commgroups" >
                        <!-- ({{channelidx}},{{cgidx}}) -->
                        <input 
                            type="checkbox" 
                            v-bind:id="channel.id+'_'+cg.id" 
                            v-if="enabled.some(e=>e[0].id == dsid && e[1].id==cg.id)"
                            checked
                            disabled
                            hidden
                            />
                        <span class="✔" v-if="enabled.some(e=>e[0].id == dsid && e[1].id==cg.id)"></span>
                        <input 
                            type="checkbox" 
                            v-bind:id="channel.id+'_'+cg.id" 
                            @change="toggle(channel,cg)"
                            v-else
                            />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    `,
    created: function () {
        console.log("testing on created");
    },
    filters:{
        first: function(s){
            return s[0];
        },
    }
});
