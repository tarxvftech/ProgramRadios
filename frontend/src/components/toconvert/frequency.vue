Vue.component('frequency', {
    props:["channel"],
    computed: {
        band: function(){
            return freq_to_band(this.channel.freq);
        }
    },
    template:`
    <span>
        <span v-if="channel.type == 'repeater'">{{channel.freq}}{{channel.offset}}</span>
        <span v-else-if="channel.type == 'standard'">{{channel.name}}</span>
        <span v-else>{{channel.freq}}</span>
    </span>
    `
});
