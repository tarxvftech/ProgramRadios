Vue.component('colorcode', {
    props:["cc"],
    computed: {
        color: function(){
            colors=[ //chosen to be at readable against bgcolor
                "white",
                "white",
                "white",
                "white",
                "white",
                "white",
                "white",
                "black",
                "black",
                "black",
                "black",
                "black",
                "white",
                "white",
                "black",
                "black"
            ];
            return colors[this.cc];
        },
        bgcolor: function(){
            colors=[ //standard windows 16 color list
                "black",
                "maroon",
                "green",
                "olive",
                "navy",
                "purple",
                "teal",
                "silver",
                "gray",
                "red",
                "lime",
                "yellow",
                "blue",
                "fuchsia",
                "aqua",
                "white"
            ];
            return colors[this.cc];
        }
    },
    template:`
    <span 
        class="colorcode"
        v-if="cc >= 0" 
        v-bind:style="{'background-color': bgcolor, color: color}"
        >
        cc{{cc}}
        </span>
    `
});
