Vue.component('display_messages', {
    props:["dm"],
    template:`
    <div class="v_dm" >
        <div v-for="(msg,idx) in dm">
            <p><label>{{msg[0]}}: </label> {{msg[1]}}</p>
        </div>
    </div>
    `
});
