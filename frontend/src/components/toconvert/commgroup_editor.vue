Vue.component('commgroups_editor', {
    props: [
        "cglist","name","can_modify","custom_commgroups"
    ],
    methods:{
        add_cg: function(){
            this.cglist.push(
                {id:uuidv4(),start_in_editor:true}
            );
        },
        add_to_custom: function(cg){
            this.feedback = "Added " + cg.name;
            for( var ts of this.timeouts ){
                clearTimeout(ts);
            }
            this.timeouts.push(setTimeout(()=>this.feedback = "-",2500));
            this.custom_commgroups.push(cg);
        },
        expandtoggle: function(){
            this.expanded = !this.expanded;
        }
    },
    data: function(){
        return {
            expanded: this.can_modify,
            feedback:"-",
            timeouts:[]
        }
    },
    template: `
    <div class="commgroups_editor">
        <label>
            <button v-if="!can_modify" @click="expandtoggle">{{this.expanded? "collapse":"expand"}}</button>
        {{name}} ({{cglist.length}})
        </label> 
        <div :hidden="!expanded">
            <label v-if="!can_modify">{{this.feedback}}</label>
            
            <button v-if="can_modify" @click="add_cg">Add New Commgroup</button>
            <span v-if="!cglist.length">(None defined yet)</span>
            <ul>
                <li v-for="(cg,cgidx) in cglist">
                    <button v-if="can_modify" @click="$delete(cglist,cgidx)">Delete</button>
                    <button v-else @click="add_to_custom(cg)">Add</button>
                    <commgroup :cglistname="name" :title="cg|json" :can_modify="can_modify" :cg="cg" :start_in_editor="cg.start_in_editor"/>
                </li>
            </ul>
        </div>
    </div>
    `

});
