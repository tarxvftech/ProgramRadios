Vue.component('commgroup', {
    props:["cglistname","cg","can_modify","start_in_editor"],
    methods:{
        save: function(){
            this.edit_instead_of_display = false;
        },
        modify: function(){
            this.edit_instead_of_display = true;
        },
    },
    computed: {
    },
    data () {
        return {
            edit_instead_of_display: this.start_in_editor || cg.start_in_editor,
            //hack from commgroup_editor
            //because i can't figure out how to set a prop from js when
            //mutating the data other than by feeding the prop in from
            //the data and deleting it later because it doesn't really belong there.
            //this is just to make new, added commgroups open with the editor but non-new commgroups to display not in edit mode
            //
            //TODO: deleting a different commgroup will collapse editor for an open commgroup - and maybe open edit on a different one
            //must be something to do with re-rendering and how i indicate editability
        }
    },
    template:`
    <span class="commgroup" >
        <span v-if="edit_instead_of_display">
            <label>Name
                <input type="text" v-model="cg.name" />
            </label>
            <label>Type
                <select v-model="cg.type">
                    <option value="DMR">DMR</option>
                    <option value="FM">FM</option>
                    <option value="M17">M17</option>
                </select>
            </label>
            <cg_type :edit="true" :cg="cg" />
            <button @click="save">Save</button>
        </span> <!-- edit -->
        <span v-else>
            <button v-if="can_modify" @click="modify">Edit</button>

            <b>{{cg.name}}</b>
            <cg_type :edit="false" :cg="cg" />
            
        </span> <!-- !edit -->
    </span>
    `
});
