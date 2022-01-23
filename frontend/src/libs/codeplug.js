//TODO: list of radioids to generate codeplugs for
//      so take in a codeplug, modify the encryption keys uniformly
//      generate a modified codeplug for each radio id
//TODO findings:
//encryption keys are read and wrote backwards to editcp
//compare to OEM software and fix if necessary
//my code appears to go left to right, so that may be an issue on their end
//
//loading two codeplugs fails - possible there's a conflict for the original div, rather than re-assigning vue data.editor or something
//
//https://github.com/DaleFarnsworth-DMR/codeplug/blob/master/field.go
//fetch( "/data/zones.json").then(r=>r.json()).then(j=>z=j);
//
//TODO: redo record arrays and field arrays, and support full length, add, and del capabilities
//TODO: defrag/consolidate deleted entries to always be at the end of any array

import { xxd, readFile, assert, grouppairs, sortbykey } from './misc.js';
import rf from '../libs/rf.js';
import { reactive } from 'vue';
// bit/byte converters
function bytes2string(data){
    return data.map(c=> String.fromCharCode(c)).join("");
}
function dec2bin(dec){
    return (dec >>> 0).toString(2);
}
function bitmask2value( maskedbits, values ){
    return values[Math.log2( maskedbits )];
}
export function uint8s_to_int( lst ){ //why do i have this _and_ assemble_le?
    const lr = lst.reverse();
    let n = 0;
    for( let i = 0; i < lst.length; i++){
        n <<= 8;
        n |= lr[i];
    }
    return n;
}


function cstr2js(data){
    //expects an array of ints, not a uint8 array
    const end_of_ascii_string = data.indexOf(0);
    let name;
    if( end_of_ascii_string != -1 ){
        name = bytes2string(data.slice(0,end_of_ascii_string));
    } else {
        name = bytes2string(data);
    }
    return name;
}
function js2cstr(s){
    //expects a js string
    const sint = Array.from(s).map(x=>x.charCodeAt());
    sint.push(0); //terminating null byte
    return new Uint8Array(sint);
}
function test_js_2_4_cstr(){
    assert(cstr2js(Array.from(js2cstr("test"))) == "test")
    assert(cstr2js(Array.from(js2cstr(""))) == "")
}


function utf16str2js(data){
    //expects an array of ints, not a typed array
    //var end_of_ascii_string = data.indexOf(0);
    //console.log(data);
    const x = grouppairs(data).map(x=>x[0]); //only support ascii
    return cstr2js(x);
}
function jsstr2utf16(s){
    return new Uint8Array(
        Array.from(s).map(x=>[x.charCodeAt(),0]).flat()
    )
}
function test_js_2_4_utf16str(){
    assert(utf16str2js(Array.from(jsstr2utf16("test"))) == "test")
    assert(utf16str2js(Array.from(jsstr2utf16(""))) == "")
}



function assemble_le(bytes){
    let n = 0;
    for(let i = 0; i < bytes.byteLength; i++){
        n |= bytes[i] << (i*8);
    }
    return n;
}
function dissemble_le(somenum,sz){
    if( sz == undefined ){
        sz = 4; //assume 32 bit
    }
    assert(somenum >= 0);
    const bs = [];
    let acc = somenum;
    while( bs.length < sz ){
        bs.push(acc & 0xff);
        acc >>= 8;
    }
    //console.log("somenum:",somenum, bs);
    return new Uint8Array(bs);
}
function dissemble_le_sz(sz){
    return (val)=>dissemble_le(val,sz);
}


function fromBCD(data){
    let out = [];
    for( let i = data.length-1; i >=0; i--){ //handles little endian
        //so it works right-to-left
        out.push((data[i] & 0xf0)>>4); //within each byte, it's still ordered sanely of course, since it's only bytes that are re-ordered
        out.push(data[i] & 0x0f);
    }
    return parseFloat(out.join(""));
}
function toBCD(val){
    let nibbles = Array.from(String(val)).map(x=>parseInt(x));
    //console.log("nibbles:",nibbles);
    if( nibbles.length %2 == 1 ){ //if we have an odd number (such that grouppairs wouldn't work as expected)
        nibbles.splice(0, 0, 0); //insert a 0 at the front
    }
    //console.log("modnibbles:",nibbles);
    let nibbles2 = grouppairs(nibbles);
    //console.log("nibbles2:",nibbles2);
    let bs = nibbles2.reverse().map(x=>x[0]<<4 | x[1]);
    //console.log("bs",bs);
    return new Uint8Array(bs); 
}
function test_bcd(){
    assert(fromBCD(toBCD(45112500)) == 45112500)
    assert(fromBCD(hex2bytes("7006")),670.0,"fromBCD");
    assert(bytes2hex(toBCD(670)),"7006","toBCD");
}
test_bcd();


function hex2bytes(s){
    let pairs = grouppairs(s)
    let bytes = pairs.map(x=>parseInt(x,16));
    return new Uint8Array(bytes);
}
function bytes2hex(data){
    return Array.from(data).map(x=>x.toString(16).padStart(2,"0")).join("");
}
function test_hex_2_4_bytes(){
    assert(bytes2hex(hex2bytes("ff")) == "ff")
    assert(bytes2hex(hex2bytes("00")) == "00")
}

//function get_ft_byte(data,ft){
    //let bo = ft.bitOffset;
    //let bs = ft.bitSize;
    //const mask = (2**bs)-1; //so size of 2 gives 0b11, 3 gives 0b111, etc
    //assert(bs < 8); //only call us after handling the byte-aligned byte-sized stuff already

    //let byteidx = Math.floor(bo/8); //so bit 2 is in byte 0, bit 9 is in byte 1, etc
    //let Bo = bo - (byteidx*8); //get the bit offset in this byte, so 
    //assert(bs+Bo <= 8); //error out if we actually do cross a byte boundary!
    //let b = data.subarray(byteidx,byteidx+1)[0];
    //return b;
//}
function bits_to_int(data,ft){
    //candidate for cleanup TODO
    let bo = ft.bitOffset;
    let bs = ft.bitSize;
    const mask = (2**bs)-1; //so size of 2 gives 0b11, 3 gives 0b111, etc
    //we have an array of bits as 8bit bytes
    //[ 0x3f, 0x81]
    //== [0011_1111, 1000_0001]
    //let's say bo is 2
    //and bs is 7
    //so it spans byte boundaries and such - does that every happen?
    //
    //cat codeplugs.json | grep bitSize|sort  |uniq -c |sort -k 3n
    //suggests that in practice, anything >= 8 bits is always integer multiples of 8 bits
    //so those  are already taken care of with slice!
    //and that also means we probably don't have any bits crossing byte boundaries.
    //  (probably)
    //just need to find the right byte that has what we need, and mask and dice until we get only what we need
    //
    assert(bs < 8); //only call us after handling the byte-aligned byte-sized stuff already

    let byteidx = Math.floor(bo/8); //so bit 2 is in byte 0, bit 9 is in byte 1, etc
    let Bo = bo - (byteidx*8); //get the bit offset in this byte, so 
    assert(bs+Bo <= 8); //error out if we actually do cross a byte boundary!
    //if bo == 9, Bo == 1
    //if bo == 2, Bo == 2, etc
    let b = data.subarray(byteidx,byteidx+1);
    let bO = 8 - Bo - bs; //get the amount to shift right by
    const ret = (b >> bO) & mask; //shift it, and mask it so we on;y get what we asked for
    //console.log("bits_to_int: ",data, ft, "bo",bo, "bs",bs, "byteidx",byteidx, "Bo", Bo, "b", b, "bO", bO, "mask",mask,"(b>>bO)&mask",ret);
    return ret;
}
function set_bits_of_int(existing_value, ft, newvalue){
    //console.log(`set_bits_of_int(existing_value=${existing_value}, ft=..., newvalue=${newvalue})`);
    //assumes you're only working on a single byte...
    let bo = ft.bitOffset;
    let bs = ft.bitSize;
    assert(bs <= 8, "set_bits_of_int expected one byte or less but got a bs larger than 8" );
    assert(existing_value <= 255 && newvalue <= 255, "values out of range set_bits_of_int" );
    assert(newvalue < 2**bs && newvalue >= 0, "new value is too big (or too small)");

    const byteidx = Math.floor(bo/8); //so bit 2 is in byte 0, bit 9 is in byte 1, etc
    const Bo = bo - (byteidx*8); //get the bit offset in this byte, so 
    const bO = 8 - Bo - bs; //get the amount to shift by
    //console.log(bo,byteidx,Bo,bO);

    const mask = (2**bs)-1; //so size of 2 gives 0b11, 3 gives 0b111, etc
    const imask = 0xff - (mask << bO);  //i forgot to shift the cleaning mask for soooo long
    const shifted_newvalue = newvalue << bO;

    const clean_existing = existing_value & imask;
    //console.log("existing value, newvalue: ",existing_value, newvalue);
    //console.log("mask, imask: ",mask,imask);
    //console.log("clean existing: ",clean_existing);
    //console.log("shifted new: ",shifted_newvalue);
    return clean_existing | shifted_newvalue;
}
function test_bits2int_and_back(){
    assert(set_bits_of_int(0,{bitOffset:7,bitSize:1},1), 1, "bitOffset failure" );
    assert(set_bits_of_int(0,{bitOffset:0,bitSize:1},1), 0x80, "bitOffset failure 0,1,1 failure");
    assert(set_bits_of_int(0xff,{bitOffset:12,bitSize:2},2), 251, "bitOffset Failure 3");
}

function test_bits_to_int(){
    let x = [
        // 0b 0011 1111  1000 0001
        new Uint8Array([0x3f,0x81]),
        new Uint8Array([0x3f,0x81]),
    ]
    let y = [
        {
            bitOffset: 0,
            bitSize: 2,
        },
        {
            bitOffset: 0,
            bitSize: 4,
        },
        {
            bitOffset: 2,
            bitSize: 2,
        },
        {
            bitOffset: 7,
            bitSize: 1,
        }
    ]
    let z = [
        0,
        3,
        3,
        1
    ]
    for( let i = 0; i < x.length; i++){
        //console.log(xxd(x[i]));
        assert(bits_to_int(x[i], y[i]), z[i], `bits_to_int failed test ${i}`);
    }
}

export const tests = {
    test_bits_to_int,
    test_bcd,
    test_js_2_4_cstr,
    test_js_2_4_utf16str,
    test_hex_2_4_bytes,
};
for( let t in tests ){
    tests[t]();
}










export function ident_codeplug_radio_rdt(data){
    let intended_radio = data.slice(0x125,0x125+32)
    let radioname = cstr2js(Array.from(intended_radio));
    return radioname;
}
function make_editor(codeplug_format, radioname, data){
    //this is slow to build - 10k+ contacts and 3k+ channels and 250+ zones
    //will do that.

    let getValueTypes = {
        name: data => utf16str2js(Array.from(data)),
        introLine: data => utf16str2js(Array.from(data)),
        contactName: data => utf16str2js(Array.from(data)),
        textMessage: data => utf16str2js(Array.from(data)),
        ascii: data => cstr2js(Array.from(data)),

        biFrequency: data=> fromBCD(data)/10,
        frequency: data=> fromBCD(data)/1e5,
        frequencyOffset: data=> fromBCD(data)/1e5,

        callID: assemble_le,
        ctcssDcs: function(data){
            if( assemble_le(data) == 65535 ){
                return 0;
            }
            return fromBCD(data)/10
        },
        contactListIndex: assemble_le,
        memberListIndex: assemble_le,
        gpsListIndex: assemble_le,
        spanList: x=>x,
        bandwidth: x=>x,
        listIndex: assemble_le,

        hexadecimal32: bytes2hex,
        hexadecimal4: bytes2hex,
        indexedStrings: x=>x,
        iStrings: (data,ft)=>{ 
            //problem - there are iStrings that are byte based and iStrings that aren't.
            //
            let idx = assemble_le(data);
            return ft.strings[ idx ];
        },
        offOn: (data,ft)=>{
            return data;
            //if(data){
                //return "On";
            //} else {
                //return "Off";
            //}
        },
        onOff: (data,ft)=>{
            return data;
            //if(data){
                //return "Off";
            //} else {
                //return "On";
            //}
        },
        span: x=>x,

    }
    let setValueTypes = {
        name: jsstr2utf16,
        introLine: jsstr2utf16,
        contactName: jsstr2utf16,
        textMessage: jsstr2utf16,
        ascii: js2cstr,
        indexedStrings: x=>x,
        spanList: x=>x,
        bandwidth: x=>x,

        ctcssDcs: (val)=>{
            let scaled;
            if( val == 0 || val == null || val == undefined ){
                return dissemble_le(65535,2);
            } else {
                scaled = Math.floor(val * 10);
            }
            return toBCD(scaled);
        },
        frequency: (val)=>{
            //TODO: Math.floor leads to float errors, Math.round might or might not lead to other errors!
            let scaled = Math.round(val * 1e5);
            //console.log(val,val*1e5,scaled);
            return toBCD(scaled);
        },
        frequencyOffset: (val)=>{
            //TODO: Math.floor leads to float errors, Math.round might or might not lead to other errors!
            let scaled = Math.round(val * 1e5);
            return toBCD(scaled);
        },
        biFrequency: (val)=>{
            //TODO: this might lead to floating point errors?
            let scaled = Math.floor(val * 10);
            return toBCD(scaled);
        },

        hexadecimal32: hex2bytes,
        hexadecimal4: hex2bytes,
        callID: dissemble_le_sz(3),
        listIndex: dissemble_le_sz(2),
        contactListIndex: dissemble_le_sz(2),

        offOn: (data,ft)=>{
            if(data == "On"){
                return 0;
            } else if( data == "Off"){
                return 1;
            } else {
                return data;
            }
        },
        onOff: (data,ft)=>{
            if(data == "On"){
                return 1;
            } else if( data == "Off"){
                return 0;
            } else {
                return data;
            }
        },
        //iStrings: (data,ft)=>{ 
            //console.log("setting ft:",data,ft);
        //},
        //span: (data,ft)=>{ 
            //console.log("setting ft:",data,ft);
        //},
    }
    let e = {};
    function make_field_array(rt, ridx, ft, data){ 
        const __v = {
            __v_skip: false,
            __v_raw: false,
            __v_isReadonly: false,
            __v_isRef: false,
        };
        const handler = {
            set: function(target, prop, value, receiver ){
                const propnum = parseInt(prop);
                if (propnum >= 0 && propnum < ft.max ){
                    console.log(rt.typeName, ridx, ft.typeName, propnum, "=", value);
                    let fidx = propnum;
                    let field_data = cut_field( rt, ridx, ft, fidx, data);
                    set_value(rt, ridx, ft, fidx, field_data, value);
                    let x = get_value(rt, ridx, ft, fidx, field_data);
                    target[propnum] = x;
                    return x == value;

                }  
                console.log(target,prop,value, "INVALID");
                return false;
            },
            get: function(target, prop, receiver ){
                if( prop == Symbol.iterator ){
                    return function*(){
                        for( let i = 0; i < ft.max; i++){
                            let fidx = i;
                            let field_data = cut_field( rt, ridx, ft, fidx, data);
                            let x= get_value(rt, ridx, ft, fidx, field_data);
                            target[i] = x;
                            yield x;

                        }
                    }
                }
                if( typeof(prop) != typeof("") ){
                    console.log(rt.typeName, ridx, ft.typeName, prop);
                    return;
                } 
                if( prop in __v ){
                    return ;
                }
                if( prop == "includes" ){
                    return function(value){
                        let filtered = [];
                        for(let t of receiver){
                            if( t == value ){
                                return true;
                            }
                        }
                        return false;
                    }
                }
                //if( prop == "deleted" ){
                    //once this works, i can make zone editing a little nicer
                //}
                if( prop == "length" ){
                    //TODO: meant to encode used entries
                    return ft.max;
                } 
                if( prop == "max" ){
                    return ft.max;
                }
                const propnum = parseInt(prop);
                if (propnum >= 0 && propnum < ft.max ){
                    //console.log(rt.typeName, ridx, ft.typeName, propnum);
                    let fidx = propnum;
                    let field_data = cut_field( rt, ridx, ft, fidx, data);
                    let x= get_value(rt, ridx, ft, fidx, field_data);
                    target[propnum] = x;
                    return x;
                } 
                //filter
            }
        };
        const prox = new Proxy({rt:rt,ridx:ridx, ft:ft, data:data}, handler);
        return prox;

    }
    function writeBytes(dst,src,offset,size){
        for( let i = 0; i < size; i++ ){
            dst[offset+i] = src[i];
        }
    }
    function findOffset(rt, ridx, ft, fidx){
        //doesnt account for extOffset yet
        let offset = 0;
        offset += rt.offset;
        if( rt.max ){
            if( ridx == undefined ){
                throw(new Error("have a record array, but wasn't given a record index to dig down with!"));
            }
            offset += ridx * rt.size;
        }
        if( ft.max ){
            offset += (fidx * ft.bitSize)/8
        }
        offset += ft.bitOffset/8; //users of this function expect only the one relevant byte!
        offset = Math.floor(offset); //get this byte here
        return offset;
    }
    function get_value( rt,ridx, ft, fidx, field_data){
        //console.log( rt.typeName, ridx, rt.max, ft.typeName, fidx, ft.max );
        if( ft.bitOffset % 8 == 0 && ft.bitSize %8 == 0){ //byte boundaries yay!  if( getValueTypes[ft.valueType] ){

            if( getValueTypes[ft.valueType] ){
                return getValueTypes[ft.valueType](field_data,ft);
            } else {
                console.log("unknown bytesy type to get()");
                console.log(ft.valueType, field_data, ft);
                throw `unimplemented bytesy valueType to get: ${ft.valueType}`;
                //return field_data;
            }
        } else {
            let offset = findOffset(rt, ridx, ft, fidx);
            //TODO: fix this. needs to be consistent about bitOffset/bitSize handling with regard to bo/bs 
            //e.g. if bs is < 8, do i offset all the way up to that byte, or what?
            //(this is what I do now, in cut_field )
                        //Note: For A Channels, the 16 old Channels slots are used for the first 16.
                        //Then there are 48 more slots (96 bytes) in the extOffset area
                        //Then the B Channels list comes after that in the extOffset area
            //let singleGet = get_ft_byte(field_data,ft);
            let singleOff = e._cp[offset];
            //assert(singleGet,singleOff, "findOffset isn't matching get()");
            let bits = bits_to_int(field_data, ft);
            if( getValueTypes[ft.valueType] ){
                return getValueTypes[ft.valueType](bits,ft);
            } else {
                console.log("unknown bitsy type to get()");
                console.log(ft.valueType, field_data, bits, ft);
                //return bits;
                throw `unimplemented bitsy valueType to get: ${ft.valueType}`;
            }
        }
    }
    function set_value( rt, ridx, ft, fidx, field_data, val){
        //TODO: can i used a subarray to just write to the field data directly? 
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/subarray
        //
        //need a handle to the codeplug
        //need a byteoffset into the full thing, plus the size of course
        //if not byte-aligned and byte-sized
        //  need to pull current value to handle bits properly 
        //  then modify that value
        //then overwrite the existing content by splicing into the main codeplug file
        //which may require padding the value or truncating it
        console.log( "SET", rt.typeName, ridx, ft.typeName, fidx, "=", val);
        if( ft.bitOffset % 8 == 0 && ft.bitSize %8 == 0){ //byte boundaries yay!
            if( setValueTypes[ft.valueType] ){
                let x = setValueTypes[ft.valueType](val,ft);
                //console.log("val and f(val):",val,x);
                let offset = rt.offset;
                if( ridx != undefined ){
                    offset += ridx * rt.size;
                }
                offset = offset + ft.bitOffset/8;
                let sz = ft.bitSize/8;
                if( ft.max ){
                    let idx = fidx;
                    offset += idx*sz;
                }
                //bug with zones - not finding the _idx and so it's failing sometimes
                //above - what?
                let offset2 = findOffset(rt,ridx,ft,fidx);
                if( offset != offset2 ){
                    console.log("findOffset not matching!");
                    debugger;
                }
                //console.log("offset:",offset)
                //console.log("before write",bytes2hex(e._cp.slice(offset,offset+sz)));
                writeBytes(e._cp, x, offset, sz);
                //console.log("after write",bytes2hex(e._cp.slice(offset,offset+sz)));
                return true;
            } else {
                throw `unimplemented valueType to set: ${ft.valueType}`;
            }
        } else {//not byte aligned, or smaller than bytes, or whatever
            //we don't actually handle values that cross byte boundaries, just smaller-than-a-byte values
            if( setValueTypes[ft.valueType] ){
                //should only have to handle single bytes at a time
                //core of this: get current value. Make sure bits at selected position equal what we say.
                //then assert we haven't changed the other bits
                //console.log("set val to ft", ft.bitOffset, ft.bitSize, ft);
                let offset = findOffset(rt,ridx,ft,fidx);
                const old = e._cp[offset]; //single byte
                const newval = setValueTypes[ft.valueType](val,ft);
                const modified = set_bits_of_int(old, ft, newval);
                e._cp[offset] = modified;
                console.log(offset,old,newval,modified, field_data.length, get_value(rt,ridx,ft,fidx,field_data));
                console.log(xxd(field_data));
                if( ! ["offOn","onOff"].includes(ft.valueType ) ){ 
                    //no fail the assertion when setting offOn and onOff to default values because we don't follow Farnsworth's setup exactly
                    assert(get_value(rt,ridx,ft,fidx,field_data), val, "failure to verify set");
                }
                return true;

            } else {
                throw `unimplemented bitsy valueType to set: ${ft.valueType}`;
            }
        }
    }
    function cut_field( rt, ridx, ft, fidx, data ){

        //return bytes such that bitOffset is still accurate, 
        //so that bits_to_int, which masks out and returns subfields,
        //can use bitOffset as expected
        //
        //problem is this fucks up _setting_ values because set_bits_of_int works on individual bytes
        //and set_value wants to .cp[offset] as a result
        let record_offset = rt.offset;
        if( ridx){
            record_offset += ridx*rt.size;
        }
        //let thesebytes = data.subarray(offset, offset+rt.size); //had a +10 here to account for errors in the descriptor file, but now need that to be gone to avoid overlaps
                
        let field_data;
        let bo,bs;
        if( ft.max ){ 
            //need fidx
            bs = Math.floor(ft.bitSize/8);
            //console.log( "cut_field in array", rt.typeName, ridx, ft.typeName, fidx, data.length, bo, bs);
            //if( findOffset(rt,ridx,ft,fidx) != bo ){
                //throw(new Error("wtf"));
            //}
            if( ft.extIndex && fidx >= ft.extIndex ){
                let oldbo = bo;
                let extFidx = fidx - ft.extIndex;
                bo = ft.extOffset + ridx*ft.extSize + Math.floor(ft.extBitOffset/8) + extFidx*Math.floor(ft.bitSize/8)
                //debugger;
            } else {
                bo = record_offset + Math.floor(ft.bitOffset/8) + fidx*Math.floor(ft.bitSize/8);
            }
        } else {
            //ignore fidx, not an array 
            assert( fidx, undefined, "cut_field provided a fidx when ft is not an array?");
            bo = record_offset + Math.floor(ft.bitOffset/8);
            if( findOffset(rt,ridx,ft,fidx) != bo ){
                throw(new Error("wtf"));
            }
            bs = Math.floor(ft.bitSize/8);
        }
        if( bs == 0 ){ 
            //bitSize is too small
            //
            //what about when bitOffset=12, bitSize=2, like for Repeater Slot?
            //we need to figure out the size based on bitoffset + bitsize?
            bs = Math.ceil( (ft.bitOffset + ft.bitSize)/8 );
            //but now our offset is wrong! so we need to un-offset it 
            if( ft.bitOffset >= 8 ){
                bo -= Math.floor(ft.bitOffset/8);
            }
        }
        field_data = data.subarray(bo, bo+bs);
        if( field_data.length == 0 ){
            console.log(rt, ft, bo,bs, data);
            throw(new Error("Could not subarray bytes"));
        }
        return field_data;
    }
    function record_deletion_management(rt, ridx, data){
        let record_offset = rt.offset;
        if( ridx ){
            record_offset += ridx*rt.size;
        }
        let o = {};
        if( ! rt.delDesc ){
            return undefined;
        }
        let offset = record_offset + rt.delDesc.offset;
        let size = rt.delDesc.size;
        let value = rt.delDesc.value;
        assert( size, 1, "make_record, delDesc size is not 1 byte as expected for " + rt.type);
        let deleted_indicator = data.subarray(offset, offset+size);

        o.deleted = ()=>deleted_indicator[0] == value;
        o.delete = ()=>{
            deleted_indicator[0] = value;
        }
        o.undelete = ()=>{
            deleted_indicator[0] = value+1; //just has to not be value
            //TODO set with default values
            //move "sanify" to here from channel.vue
        }
        return o;
    }
    function make_record(rt,ridx, data){ 
        //data is only the data for this record
        //or rather, it's pointed at the start, end  may be too short (because of an error in the binary description)
        //or too long (because of a hack around the binary description errors)
        //we're only passed idx for our own situational awareness 
        let delfunctions = record_deletion_management(rt,ridx, data);

        //fetch full field descriptions for this record
        let fields = {};
        for( let f of rt.fieldTypes ){  
            let ft = codeplug_format.fields.filter(x=>x.type==f)[0];
            fields[ft.typeName] = ft;
        }
        const __v = {
            __v_skip: false,
            __v_raw: false,
            __v_isReadonly: false,
            __v_isRef: false,
        };

        const handler = {
            set: function(target, prop, value, receiver ){
                if( typeof(prop) != typeof("") ){
                    console.log("nonstring", target.rt.typeName, prop, typeof(prop))
                    return;
                }
                if( prop == "deleted" ){
                    if( value ){
                        delfunctions.delete();
                    } else {
                        delfunctions.undelete();
                    }
                    return true;
                }
                if( prop in fields ){
                    let ft = fields[prop];
                    if( ft.max ){
                        console.log("make a field_array", prop);
                        //return make_field_array(rt, ridx, ft, data);
                        console.log("assigning to field array entries not yet supported");
                        return false;
                    } else {
                        let field_data = cut_field( rt, ridx, ft, undefined, data);
                        set_value( rt, ridx, ft, undefined, field_data, value );
                        let x = get_value( rt, ridx, ft, undefined, field_data );
                        target[prop] = x;
                        return x == value;
                    }
                }
            },
            get: function(target, prop, receiver ){
                if( typeof(prop) != typeof("") ){
                    console.log("nonstring", target.rt.typeName, prop, typeof(prop))
                    return;
                }
                if( prop in __v ){
                    return ;
                }
                if( prop in target ){
                    return target[prop];
                }
                if( prop == "deleted" ){
                    return delfunctions[prop]();
                }
                if( prop in fields ){
                    //console.log("i can get that",prop);
                    //console.log(fields);
                    let ft = fields[prop];
                    if( ft.max ){
                        //console.log("make a field array", rt.typeName, ridx, prop);
                        let x = make_field_array(rt, ridx, ft, data);
                        target[prop] = x;
                        return x;
                    } else {
                        //console.log("return a single field", prop);
                        let field_data = cut_field( rt, ridx, ft, undefined, data);
                        let x = get_value( rt, ridx, ft, undefined, field_data );
                        target[prop] = x;
                        return x;
                    //now we have rt, idx, ft, and data 
                    // don't need to pass prop because ft implies the prop
                    }
                } else {
                    if( rt.typeName == "Zones" && prop == "Channels" ){
                        console.log("Special handling - ABChannels but want to support Channels too");
                        let ft = fields["A Channels"];
                        let x = make_field_array(rt, ridx, ft, data);

                        //TODO: Make a proxy so all A Channels settings get pushed to B Channels too?
                        //let ft2 = fields["B Channels"];
                        //let x2= make_field_array(rt, ridx, ft2, data);
                        
                        target[prop] = x;
                        console.log(ridx, ft, x);
                        return x;
                    }
                    if( ! prop.includes("__v") ){
                        console.log("unhandled field from", target.rt.typeName, ridx, typeof(prop),prop);
                        debugger;
                    } else {
                        //may need to handle these to fix reactivity
                        console.log("unhandled __v", prop);
                    }
                }
            }
        }
        const prox = new Proxy({rt:rt,data:data,ridx:ridx,fields:fields}, handler);
        return prox;
    }
    function make_record_array(rt, data){
        //TODO: this and make_field_array have duplicated work, which is silly
        const handler1 = {
            get: function(target, prop, receiver ){
                //console.log("record_array",target.rt.typeName, typeof(prop),prop);
                if( prop == Symbol.iterator ){
                    return function*(){
                        for( let i = 0; i < target.rt.max; i++){
                            if( target[i] == undefined ){
                                target[i] = make_record(target.rt, i, target.data);
                            }
                            yield target[i];
                        }
                    }
                }
                if( typeof(prop) != typeof("") ){
                    return;
                }
                if( prop == "full" ){
                    return target.max - target.length > 0;
                }
                if( prop == "length" ){
                    //meant to be a list of currently used entries
                    let acc = 0;
                    for( let i = 0; i < target.rt.max; i++){
                        if( target[i] == undefined ){
                            target[i] = make_record(target.rt, i, target.data);
                        }
                        if( ! target[i].deleted ){
                            acc++;
                        }
                    }
                    return acc;
                } else if( prop == "max" ){
                    return target.rt.max;
                } else if( prop == "filter" ){
                    return function(predicate){
                        let filtered = [];
                        for( let i = 0; i < target.rt.max; i++){
                            if( target[i].deleted ){
                                continue; //skip deleted items
                            } 
                            if( predicate(target[i],i) ){
                                filtered.push(target[i]);
                            }
                        }
                        return filtered;
                    }
                }

                //handle array indexes
                const propnum = parseInt(prop);
                if (propnum >= 0 && propnum < target.rt.max ){
                    if( target[propnum] == undefined ){
                        target[propnum] = make_record(target.rt, propnum, target.data);
                    }
                    return target[propnum];
                }
            },
        };
        const proxy1 = new Proxy({rt:rt,data:data}, handler1);
        if( rt.typeName == "Zones"){
            console.log(proxy1);
        }
        return proxy1;
    }
    console.log(codeplug_format);
    e._cp = data;
    let cp_def = codeplug_format.codeplugs.filter(x=>x.models.includes(radioname))[0];
    if( cp_def == undefined ){
        throw "not a recognized or supported codeplug format";
    }
    for( let r of cp_def.recordTypes ){ 
        //for every record in our relevant codeplug
        //get the record format data
        let rt = codeplug_format.records.filter(x=>x.type==r)[0];

        if( rt.max != undefined ){  
            //records can have arrays
            e[rt.typeName] = make_record_array(rt, data);
        } else {
            //or just be a single entry
            e[rt.typeName] = make_record(rt, undefined, data);
        }
    }
    return e;
}
let tytera_map = {
    //deviation:"Bandwidth (KHz)",
    name: "Channel Name",
    //talkgroup:"Contact Name", //needs an fn
    //timeslot:"Repeater Slot", //off by one i think
    //color_code:"Color Code",
    //offset:"Tx Offset (MHz)", //needs an fn
    freq:"Rx Frequency (MHz)",
    //need a mode indicator
    //need a type (simplex, repeater) indicator
}

async function apply_json_to_codeplug(zones,editor,codeplug){
    print("start apply " + new Date());
    let newchannels = [];
    for( let c of zones[0].channels ){
        let newc = {};
        for( let k in tytera_map ){
            let t = tytera_map[k];
            if( c[k] ){
                newc[t] = c[k];
            }
        }
        newchannels.push(newc);
    }
    function get_first_empty_channel(editor){
        let cidx = 0;
        while( editor.Channels[cidx]["Channel Name"] != "" ){
            cidx++;
        }
        return cidx;
    }
    console.log(newchannels);
    let cidx = get_first_empty_channel(editor);
    for( const c of newchannels ){
        Object.assign( editor.Channels[cidx], c );
        //console.log(editor.Channels[cidx]);
        cidx++;
    }
}
function check_codeplug_layout(cpfmt){
    for( let cp of cpfmt.codeplugs ){
        let messages = [];
        const calert = (condition,msg)=>{
            if(condition){
                messages.push(msg);
            }
        }
        let fmt = cp.ext;
        let sz = cp[`${fmt}Size`];
        let sections = [];
        for( let r of cp.recordTypes ){
            let rt = cpfmt.records.filter(x=>x.type==r)[0];
            let start = rt.offset;
            let end = start+rt.size;
            if( rt.max ){
                end = start+rt.size*rt.max;
            } 
            sections.push({name:rt.typeName,start:start, end:end});
        }
        sections = sections.sort(sortbykey("start"));
        console.log(cp.type, sections);

        calert( sections[0].start != 0, "Unused beginning of file");
        for( let i = 1; i < sections.length; i++){
            let a = sections[i-1].end;
            let b = sections[i].start;
            calert(a>b, `Overlap between ${sections[i-1].name} and ${sections[i].name}: ${a-b} bytes overlap`);
            calert(a<b, `Missing space after ${sections[i-1].name}: ${b-a} bytes missing`);
        }
        calert( sections[sections.length-1].end != sz, `Unused end of file, ${ sz -sections[sections.length-1].end} missing after ${sections[sections.length-1].name}`);
        console.log(messages);
    }

}

//var cp, z, cpfmt,cpd,e,cpe;
async function codeplug_editor(codeplug, codeplug_format){
    const radioname = ident_codeplug_radio_rdt(codeplug);
    const start = new Date();
    const editor = make_editor(codeplug_format, radioname, codeplug);
    window.e = editor;

    const end = new Date();
    console.log("make_editor elapsed ", (end-start)/1000);
    return editor;
}
export async function readFileBytes(file){
    const data = await readFile(file);
    const bytes = new Uint8Array(data);
    console.log(file,bytes);
    return bytes;
}

async function bin2rdt(dfu, bin){
    const radioidbytes = await dfu.raw_identify_radio();
    //await dfu.enter_dfu_mode();
    const radioname = await dfu.get_radio_name();
    const gen = await dfu.get_radio_gen(radioname);
    const rdt_sizes = [262709, 262709, 852533];
    const rdt_size = rdt_sizes[gen];

    const gen1_size = rdt_sizes[1]; //these have the header (549) and trailer (16) included;
    const gen2_size = rdt_sizes[2];
    const binsizeoffset = 549+16;

    let rdt = new Uint8Array(rdt_size);
    const gen12_split = gen1_size-binsizeoffset;
    const gen1_bin = bin.slice(0,gen12_split);
    const gen2_bin = bin.slice(gen12_split); //to end of bin

    rdt.set( new Uint8Array(549), 0 );
    rdt.set( gen1_bin, 549 );
    rdt.set( new Uint8Array(16), gen12_split+549); //trailer
    rdt.set( gen2_bin, gen1_size); //trailer

    rdt.set( radioidbytes, 0x125 );
    console.log("made an rdt out of it", rdt.length);
    return rdt;
}
async function rdt2bin(rdt){
    const gen1_size = 262709; //these have the header (549) and trailer (16) included;
    const gen2_size = 852533;
    const binsizeoffset = 549+16;
    const gen = [gen1_size,gen2_size].indexOf(rdt.length )+1;
    const gen1_bin = rdt.slice(549, gen1_size-16); 
    const bin_size = rdt.length - binsizeoffset;

    let bin = new Uint8Array(bin_size);
    bin.set(gen1_bin,0);
    if( gen == 2 ){
        const gen2_bin = rdt.slice(gen1_size);
        bin.set(gen2_bin,gen1_bin.length);
    }

    return bin;
}
function bands(ranges){
    let bands = [];
    for( const range of ranges){
        for( const edge of range ){
            const band = rf.freq_to_band(edge/1e6);
            if( ! bands.includes(band) ){
                bands.push(band);
            }
        }
    }
    return bands;
}
let cpj = null;
async function rdt_w_metadata(d, rdt, filename ){
    console.log("metadata add",rdt);
    if( d == null ){
        d = {bands:[], ranges:[]};
    }
    const model = ident_codeplug_radio_rdt(rdt);
    let cpm = {
        readdate: new Date(),
        rdt: rdt,
        model: model,
        bands: d.bands, //TODO need to pull this from rdt and remove the first argument in function
        ranges: d.ranges,
        dmrid: tyt_get_dmrid(rdt),
    };
    console.log("codeplug.js rdt_w_metadata cpm:",cpm);
    if( ! filename ){
        cpm.filename = cp_filename(cpm);
    } else {
        cpm.filename = filename;
    }
    if( cpj == null ){
        cpj = await fetch( "/data/codeplugs.json").then(r=>r.json());
    }
    //TODO cache this somehow
    const e = await codeplug_editor(cpm.rdt, cpj);
    cpm.editor = e;
    console.log("codeplug.js rdt_w_metadata have editor");


    const def = {};
    def.overall = cpj.codeplugs.filter(x=>x.models.includes(model))[0];
    def.records = {};
    def.fields = {};
    for( let r of def.overall.recordTypes ){ //for every record in our relevant codeplug
        let rt = cpj.records.filter(x=>x.type == r )[0]
        def.records[rt.typeName] = rt;
        def.records[rt.type] = rt;
        for( let f of rt.fieldTypes ){
            let ft = cpj.fields.filter(x=>x.type == f )[0]
            def.fields[ft.typeName] = ft;
            def.fields[ft.type] = ft;
        }
    }
    console.log(def);
    cpm.def = def;
    console.log(cpj, e);
    return cpm;
}
function tyt_get_dmrid(cp){
    console.log("get_dmrid",cp);
    const id = uint8s_to_int(cp.slice(549+0x2084, 549+0x2084+4));
    console.log("get_dmrid",cp,id);
    return id;
}
function cp_filename(cp){
    if( cp.filename ){
        return cp.filename;
    }
    const t = cp.readdate;
    let ts = [
        t.getFullYear(),
        t.getMonth()+1, //wtf javascript
        t.getDate(),    //not getDay, mind you
        t.getHours(),
        t.getMinutes()
    ].map(x=>String(x).padStart(2,"0")).join("");
    return `${ts}_${cp.model}_${cp.bands.join("")}_${cp.dmrid}.rdt`;
}

//rewrite make_editor to use es6 proxies
//https://medium.com/@xoor/an-introduction-to-es6-proxies-acc6b59c713b
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
//https://github.com/vuejs/vue/issues/4384

//web workers:
//https://developers.google.com/web/fundamentals/primers/service-workers/
//https://www.html5rocks.com/en/tutorials/workers/basics/
function make_codeplug_proxy(cp){
    console.log(cp);
    const handler1 = {
        get: function(target, prop, receiver ){
            console.log(receiver, prop);
            return receiver;
        },
        set: function(target, prop, receiver ){
            console.log(receiver, prop);
            return receiver;
        }
    };
    //have proxys all the way down to the records/record arrays?
    //the goal being to not have 100000 proxies, just like, idk, 50?
    const proxy1 = new Proxy(cp, handler1);
    console.log("PROXY",proxy1);
}
export default {
    make_editor,
    make_codeplug_proxy,
    ident_codeplug_radio_rdt,
    codeplug_editor,
    bin2rdt,
    rdt2bin,
    readFileBytes,
    uint8s_to_int,
    rdt_w_metadata,
    cp_filename,
    bands,
    hex2bytes,
    bytes2hex,
    bytes2string,
    js2cstr,
    cstr2js,
    assemble_le,
};
