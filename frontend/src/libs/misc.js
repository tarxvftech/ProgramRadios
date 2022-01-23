import { saveAs } from 'file-saver';

export function assert(c, expected, msg){
    //call like assert(1==1)
    //or assert(1,1)
    //or assert(1==1, "failure in mathematics")
    //or assert(1,1, "failure in mathematics")
    //TODO: not working like i want, needs a revisit
    if( typeof(c) == typeof(1==1)){
        if(!c){
            const msg = expected;  //reordered arguments
            throw new Error("Assertion failed " + msg?msg:"");
        }
    } else { 
        if( c != expected ){
            console.log(c,expected);
            throw new Error("Assertion failed: "+ c + " != "+ expected+", "+ msg?msg:"");
        }
    }
}
export function invert(o){
    const io = {};
    for( const k in o){
        const v = o[k];
        io[v] = k;
    }
    return io;
}
export function wait_for(ms){
    return new Promise( r => setTimeout(r,ms));
}

export function _x(a){
    return "0x" + a.toString(16);
}

export function grouppairs(arr){
    return Array.from({ length: arr.length / 2 }, (_, i) => arr.slice(i * 2, i * 2 + 2))
}

export function sorted_counts(c){
    return Object.entries(c).sort((a,b) => b[1] >= a[1] ).map(x=>x[1] + " " + x[0]);
}

export function uuidv4() {
    //https://stackoverflow.com/a/2117523
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
export function sortbykey(key){
    return function(a,b){
        if( a[key] < b[key] ){
            return -1;
        } else if( a[key] > b[key] ){
            return 1;
        } 
        return 0
    }
}
export function save_data(data, filename){
    const da = new Uint8Array(data);
    //console.log(da);
    const ba = new Blob([da], {type:"application/octet-stream"} );
    console.log(ba);
    saveAs(ba, filename)
}



function browser_save(name,data){
    localStorage[name] = JSON.stringify(data);
}
function browser_load(name){
    return localStorage[name];
}
function bytes2string(data){
    return data.map(c=> String.fromCharCode(c)).join("");
}
export function xxd(lst){
    //lst is a list of 8 bit bytes (i.e. 0-255 are only allowed values)
    const maxaddr = Math.floor(Math.log(lst.length) / Math.log(16))+1;
    let s = "";
    for( let i = 0; i < lst.length/16; i++){
        const thisrow = lst.slice(i*16, (i+1)*16);
        s += "0x" + (i*16).toString(16).padStart(maxaddr,'0') + ": ";
        for( let j = 0; j < 16 && i*16+j < lst.length; j++){
            s += lst[i*16+j].toString(16).padStart(2,'0');
            if( (j +1 )% 2 == 0 ){
                s+= " ";
            }
            if( (j +1 )% 8 == 0 ){
                s+= " ";
            }
        }
        s += "  ";
        const v = bytes2string(Array.from(thisrow));
        s += v;
        s += "\n";
    }
    return s;
}
export async function fetchblob(uri){
    const p = await fetch(uri);
    console.log(p);
    //const b = p.blob()
    //console.log(b);
    const ab = await p.arrayBuffer();
    console.log(ab);
    return new Uint8Array(ab);
}
export function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = res => {
            resolve(res.target.result);
        };
        reader.onerror = err => reject(err);
        reader.readAsArrayBuffer(file);
    });
}
