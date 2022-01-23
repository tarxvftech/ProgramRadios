Vue.component('cg_type', {
    props:["cg","edit"],
    template:`
    <span class="cg_type" v-bind:class="{editable:edit}" :title="cg|json">
        <span v-if="edit">
            <!--Type:-->
            <span v-if="cg.type == 'FM'">
                <!--FM-->
                <label>Deviation
                    <select v-model="cg.deviation" >
                        <option value="2.5k">2.5k NFM (commercial)</option>
                        <option value="5k">5k WFM (amateur radio)</option>
                    </select>
                </label>
                <label>CTCSS (overridden by repeater settings if any)<input value=0 type="number" name="type" v-model="cg.ctcss" /></label>
                <label>DCS (overridden by repeater settings if any)<input value=0 type="number" name="type" v-model="cg.DCS" /></label>
            </span>
            <span v-else-if="cg.type == 'M17'">
                M17
            </span>
            <span v-else-if="cg.type == 'DMR'">
            <!--
                DMR
                -->
                <label>Color Code (ignored for repeaters)<input min=0 max=15 type="number" name="type" v-model="cg.colorcode" /></label>
                <label>Timeslot<input min=1 max=2 type="number" name="type" v-model="cg.timeslot" /></label>
                <label>Talkgroup<input type="text" name="type" v-model="cg.talkgroup" /></label>
            </span>
            <span v-else>
            <!--
            ?
            -->
            </span>
        </span> <!-- edit -->
        <span v-else :title="cg|json">
            Type: {{cg.type}}
            <span v-if="cg.type == 'FM'">
                {{cg.deviation}} kHz
                CTCSS: {{cg.ctcss}}
                DCS: {{cg.dcs}}
            </span>
            <span v-else-if="cg.type == 'M17'">
                (Awesome!)
            </span>
            <span v-else-if="cg.type == 'DMR'">
                <colorcode :cc="cg.colorcode" />
                TS:{{cg.timeslot}}
                TG:{{cg.talkgroup}}
            </span>
        </span>
    </span>
    `
});
