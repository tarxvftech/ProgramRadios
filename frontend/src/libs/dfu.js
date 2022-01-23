//TODO
//firmware version
//radio feature tests (GPS, etc)
//memory map of the codeplug in offsets 

/*

All Codeplugs:

------ 0
549 header
------ 549
262144 body
------ 262693 (40220 + 5 - 40220 + 5 + 16)
16 bytes trailer (blank in gen1 radios? has data in gen2?)(or is that a product of the trailer actually being in the middle of the codeplug?
------ 262709
589824 Gen2 radio body
64 bytes [3000] channels immediately after the trailer
------ 852533

Notice that the "trailer" is embedded in the middle of the RDT for newer radios
They (TYT) literally just appended the new codeplug flash contents to
the end of the old system. Gross.


*/

import { xxd, assert, invert, wait_for, _x, fetchblob } from '@/libs/misc.js';
import codeplugs from '@/libs/codeplug.js';
//uses DFU
const tytera_380_series = {vendorId:0x0483, productId:0xDF11};
const openrtx_serial = {vendorId:0x0483, productId:0x5740};
const tytera_md430 = {vendorId:0x1206, productId:0x0227};

//serial port implementation needed, CDC-ACM i believe
const gd77 = {vendorId:0x15a2, productId:0x0073};
const anytone = {vendorId:0x28e9, productId:0x018a};
export const radio_filters = {filters:[
    tytera_380_series, 
    openrtx_serial,
    tytera_md430,
    gd77, anytone 
]};
function address_parts(addr){ //can replace with dissemble_le
    const a = addr & 0xff;
    const b = (addr >> 8) & 0xff;
    const c = (addr >> 16) & 0xff;
    const d = (addr >> 24) & 0xff;
    return [a,b,c,d]
}

const Request = {
    "DETACH": 0,
    "DNLOAD": 1,
    "UPLOAD": 2, 
    "GETSTATUS": 3,
    "CLRSTATUS": 4,
    "GETSTATE": 5,
    "ABORT": 6
}
const iRequest = invert(Request);

const State = {
    "appIDLE":0,
    "appDETACH":1,
    "dfuIDLE":2,
    "dfuDNLOAD_SYNC":3,
    "dfuDNBUSY":4,
    "dfuDNLOAD_IDLE":5,
    "dfuMANIFEST_SYNC":6,
    "dfuMANIFEST":6,
    "dfuMANIFEST_WAIT_RESET":8,
    "dfuUPLOAD_IDLE":9,
    "dfuERROR":10,
}
const iState = invert(State);

const Status = {
    "OK":0,
    "errTARGET":1,
    "errFILE":2,
    "errWRITE":3,
    "errERASE":4,
    "errCHECK_ERASED":5,
    "errPROG":6,
    "errVERIFY":7,
    "errADDRESS":8,
    "errNOTDONE":9,
    "errFIRMWARE":10,
    "errVENDOR":11,
    "errUSBR":12,
    "errPOR":13,
    "errUNKNOWN":14,
    "errSTALLEDPKT":15
}
const iStatus = invert(Status);

class USB {
    //needs a common set like the libusb-like compat wrapper methods
    //and then make the DFU and ACM from this one
    constructor(dev){
        this.device = dev;
        this.mock = false;
    }
    bmRequestTypeInt2obj(i){
        //console.log("bmRt: ",dec2bin(i));
        const in_or_out = (i>>7) & 0x1;
        const in_or_out_a = ["out","in"];
        //console.log("in_or_out:",in_or_out,dec2bin(in_or_out));

        const type = (i >> 5) & 0x3;
        const type_a = ["standard","class","vendor","reserved"];
        const typestr = type_a[type];
        //console.log("type:",type,dec2bin(type),typestr);


        const recipient = (i) & 0x1f;
        const recipient_a = ["device","interface","endpoint","other","reserved"];
        const recipientstr = recipient_a[recipient];
        //console.log("recipient:",recipient, dec2bin(recipient),recipientstr);

        return [in_or_out_a[in_or_out], {
            requestType: typestr,
            recipient: recipientstr,
        }]

    }
    async ctrl_transfer( requestType, request, value, index, length2read_or_data2send ){
        const [in_or_out,setup] = this.bmRequestTypeInt2obj(requestType); 

        assert("requestType" in setup);
        assert("recipient" in setup);
        setup["request"] = request;
        setup["value"] = value;
        setup["index"] = index; //webusb seems to 1 index this?
        //console.log("in or out:", in_or_out);
        //console.log("setup:", setup);
        //console.log("l2r or d2s:", length2read_or_data2send);
        if( in_or_out == "in" ){
            return await this.device.controlTransferIn(setup, length2read_or_data2send);
        } else {
            if( !length2read_or_data2send ){
                //console.log("replacing with empty array buffer");
                length2read_or_data2send = [];
            }
            const d2sb = Uint8Array.from(length2read_or_data2send);
            return await this.device.controlTransferOut(setup, d2sb);
        }
    }
}
class ACM extends USB {
    async init(){
        console.log("ACM init");
        await this.device.open();
        //await this.device.claimInterface(0);
        //await this.device.selectConfiguration(1);
        //await this.device.selectAlternateInterface(0,0);
        return;
    }
}
class DFU extends USB {
    async init(){
        this.state = null;
        this.stateString = "";
        this.status = null;
        this.statusString = "";
        await this.device.open();
        await this.device.claimInterface(0);
        //only ddifference between normal and dfu mode i can see is memory
        //location for iInterface (despite how libusb works... which is
        //weird that they're so different)
        await this.device.selectConfiguration(1);
        await this.device.selectAlternateInterface(0,0);
        //console.log("dfu init() complete");
        return;
    }
    async wait(){
        //console.log("dfu.wait 10ms");
        await wait_for(10); //time in ms
        return;
    }
    async clear_status(){
        const x = await this.ctrl_transfer( 0x21, Request.CLRSTATUS, 0, 0, null);
        //console.log("dfu.clear_status: ",x);
        return x;

    }
    async detach(){
        const x = await this.ctrl_transfer( 0x21, Request.DETACH, 0, 0, null);
        //console.log("dfu.detach: ",x);
        return x;
    }
    async enter_dfu_mode(){
        const action_map = [ //written in order of enum values, e.g. this.detach when appIDLE
            "detach",
            "wait",
            "wait",
            "abort",
            "wait",
            "abort",
            "abort",
            "abort",
            "wait",
            "abort",
            "clear_status",
        ] 
        //console.log(`[DFU]: Entering DFU mode on usb device '${this.device.productName}'`);
        while( 1 ){
            const state = await this.get_state();
            //console.log(`dfu.enter_dfu_mode: current state ${state}`);
            if( state == State.dfuIDLE ){
                //console.log("dfu.enter_dfu_mode: done!");
                break;
            } else {
                //console.log(`dfu.enter_dfu_mode: calling ${action_map[state]}`);
                //console.log("enter_dfu_mode",this);
                //(this) was getting clobbered when just doing action_map[state](), so instead of function references went to strings.
                await this[ action_map[state] ]() 
            }
        }
    }
    async ping(){
        try {
            await this.get_state();
            return true;
        } catch (e){
            return false;
        }
    }
    async get_state(){
        const x = await this.ctrl_transfer( 0xA1, Request.GETSTATE, 0, 0, 1);
        const y = x.data.getUint8();
        //console.log("dfu.get_state:",y);
        this.state = y;
        this.stateString = iState[this.state];
        return y;
    }
    async get_status(){
        const x = await this.ctrl_transfer( 0xA1, Request.GETSTATUS, 0, 0, 6);
        //console.log("dfu.get_status: raw ",x);
        const y = [];
        for( let i = 0; i < x.data.byteLength; i++){
            y.push( x.data.getUint8(i));
        }
        const z = [
            y[0],     //status int
            (((y[1] << 8) | y[2]) << 8) | y[3],  //timeout?
            y[4],   //state int
            y[5]   //discarded
        ];
        this.status = z[0];
        this.statusString = iStatus[this.status];
        this.state = y[4];
        this.stateString = iState[this.state];
        //console.log("dfu.get_status: y ",y);
        //console.log("dfu.get_status: z ",z);
        return z;
    }
    async abort(){
        const x = await this.ctrl_transfer( 0x21, Request.ABORT, 0, 0, null);
        return x;
    }
    async change_state_and_reenter_dfu(name, expected_state, ...args){
        await this.get_status(); //change state
        await this.wait();
        const s = await this.get_status(); //get status now that state has changed
        if( s[2] == expected_state ){
            //console.log(`Success in ${name}`);
            await this.enter_dfu_mode()
            return true;
        } else {
            //console.log(`Error in ${name}`);
            await this.enter_dfu_mode()
            return false;
        }
    }
    async wait_until_state(desired_state){
        let [status, timeout, state, discarded] = await this.get_status();
        while( state != desired_state ){
            await this.wait();
            [status, timeout, state, discarded] = await this.get_status();
        }
        return
    }
    async clear_status_until_state( desired_state){
        let [status, timeout, state, discarded] = await this.get_status();
        while( state != desired_state ){
            await this.clear_status();
            [status, timeout, state, discarded] = await this.get_status();
        }
        return
    }
    async set_address(addr){
        const [a,b,c,d] = address_parts(addr);
        const x = await this.ctrl_transfer( 0x21, Request.DNLOAD, 0, 0, [0x21, a, b, c, d] );
        const y = await this.change_state_and_reenter_dfu(`dfu.set_address(addr=${addr})`, State.dfuDNLOAD_IDLE );
        if( y ){ return x}
        else { 
            //console.log("x",x);
            //console.log("y",y);
            return y;
        }
    }
    async read(blk_n, block_size){
            const tres = await this.request_upload( blk_n, block_size);
            const buf = tres.data;
            const [status, timeout, state, discarded] = await this.get_status();
            if( status != Status.OK || tres.status != "ok" ){
                //console.log(`read dfu status = ${status} (${iStatus[status]}), state=${state} (${iState[state]}) `);
            }
            if( tres.status != "ok" || buf.byteLength != block_size ){

                //console.log(tres, buf);
                throw new Error(`in read, received block length (${buf.byteLength}) does not equal expected block_size (${block_size})`);
            } else {
                return this.buf_to_bytes(buf);
            }
    }


    bytes_to_list(bytes){
        return Array.from(bytes);
    }
    buf_to_bytes(buf){
        const size = buf.byteLength;
        const a = new Uint8Array(size);
        for( let i = 0; i < size; i++){
            a[i] = buf.getUint8(i);
        }
        return a;
    }
    bytes_concat(expected_bytes,bufs){
        const a = new Uint8Array(expected_bytes);
        for( let i = 0; i < bufs.length; i++ ){
            a.set(bufs[i], i*1024);
        }
        return a;
    }
    async request_upload(block_num, length, idx=0){
        //console.log(`request_upload(block_num=${block_num}, length=${length}, idx=${idx})`);
        const x = await this.ctrl_transfer(0xA1,Request.UPLOAD, block_num, idx, length);
        //console.log(`dfu.request_upload(block_num=${_x(block_num)}, length=${length}, idx=${idx}) -> ${x.data.byteLength} bytes`);
        return x;
    }
    async request_dnload(block_num, data, idx=0){
        //console.log(`request_dnload(block_num=${block_num}, data=${data}, idx=${idx})`);
        return await this.ctrl_transfer(0x21,Request.DNLOAD, block_num, idx, data);
    }
}


class TYTDMRDFU extends DFU {
    async md380_custom(a,b){
        const x = await this.ctrl_transfer( 0x21, Request.DNLOAD, 0, 0, [a, b]);
        const y = await this.change_state_and_reenter_dfu(`md380_custom( ${_x(a)}, ${_x(b)} )`, State.dfuDNLOAD_IDLE);
        if( y ){ return x}
        else { 
            //console.log("x",x);
            //console.log("y",y);
            throw new Error("md380_custom failed");
            //return y;
        }
    }
    async programming_mode(){
        const x = await this.md380_custom(0x91, 0x01);
        return x;
    }
    async reboot(){
        //console.log("THIS:",this);
        await this.enter_dfu_mode();
        const x = await this.md380_custom(0x91, 0x05);
        return x;
    }
    async raw_identify_radio(){
        await this.md380_custom(0xa2, 0x01);
        await this.clear_status_until_state( State.dfuIDLE );
        //const tres = await this.request_upload(0,32);
        const bytes = await this.read(0, 32);
        await this.enter_dfu_mode();
        return bytes;
    }
    async identify_radio(){
        //await this.ctrl_transfer(0x21, 1, 0, 0, [0xA2, 0x01])
        const bytes = await this.raw_identify_radio();
        const data = this.bytes_to_list(bytes);
        //await this.enter_dfu_mode();
        /*
         * Example: 
        UV380 with GPS, S_017.009
        CPS 1.06
        00000000: 4d44 2d55 5633 3930 00ff ffff ffff ffff  MD-UV390........
        00000010: 2302 0052 0040 0048 6013 4017 ffd9 ffff  #..R.@.H`.@.....
        
        MD2017 with GPS, S004.002
        CPS 1.20
        00000000: 3230 3137 00ff ffff ffff ffff ffff ffff  2017............
        00000010: 2102 0052 0040 0048 6013 4017 fff8 ffff  !..R.@.H`.@.....

        MD2017 no GPS, D004.002
        CP 1.16
        00000000: 3230 3137 00ff ffff ffff ffff ffff ffff  2017............
        00000010: 2102 0052 0040 0048 6013 4017 fff8 ffff  !..R.@.H`.@.....

        MD380 VHF with GPS, md380tools 9a771c9, S13ish
        CPS 1.36
        00000000: 4d44 3339 3000 ffff ffff ffff ffff ffff  MD390...........
        00000010: 2000 0252 6013 4017 0888 8888 fffe ffff   ..R`.@.........

        MD380 VHF no gps
        CPS 1.36
        00000000: 4452 3738 3000 ffff ffff ffff ffff ffff  DR780...........
        00000010: 2000 ff33 6013 4017 ffff ffff fffe ffff   ..3`.@.........

        MD380 uhf no gps, md380tools based on D13ish I think
        CPS 1.30
        00000000: 4452 3738 3000 ffff ffff ffff ffff ffff  DR780...........
        00000010: 2002 ff33 0040 0048 ffff ffff ffff ffff   ..3.@.H........



        */
        /*
         * scratch space:

        2302 0052 ___________________ __d9 ____ UV380 with GPS
        2000 0252 ___________________ __fe ____ MD380 VHF with GPS
        2102 0052 ___________________ __f8 ____ MD2017 with GPS
        2102 0052 ___________________ __f8 ____ MD2017
        2000 ff33 ___________________ __fe ____ MD380 VHF
        2002 ff33 ___________________ __ff ____ MD380 UHF
        0x0 byte counts up (CPS version?)
        ff, fe, f8, d9 counts down (?)
        all dual-banders have 0052...
        gps and non-gps md2017 have identical signatures, 
            so gps does not appear to be reported

        */

        //console.log(data);
        const ident_report = {
            //"from": myid,
            "name": "radio_identity_report",
            "function": "DFU.identify_radio",
            "data": data
        }
        //console.log(ident_report);
        //rprint(data);
        //if( !dev ){
            //jl.info(JSON.stringify(ident_report));
        //}
        //hexprint("radio id response:",data);
        //returns a 32 byte list with an ascii string describing the radio,
        //some 0xFFs, and then what I assume is either chinese or version
        //numbers or something
        //save_data( data, "identify_radio.bin");
        const freq_ranges = await this.parse_radio_freqs(data);
        const name = await this.parse_radio_name(data);

        return [name, freq_ranges, data];
    }
    async get_radio_name(){
        const [name,freq_ranges] = await this.identify_radio();
        await this.enter_dfu_mode();
        return name;
    }
    async parse_radio_freqs(data){
        data = data.slice(0x10); //first 16 bytes appear to set aside for model names
        const first_range = data.slice(4,4+4);
        const second_range = data.slice(8,8+4);
        let ranges;
        if( [0xff, 0x08].includes( second_range[0]) ){
            //what the fuck kind of test is _that_?
            ranges = [first_range];
            //single band radio
        } else {
            ranges = [first_range, second_range];
            //multi band radio
        }
        function bytes2nibbles(bs){
            const nibbles = [];
            for( let i = bs.length-1; i >= 0; i--){
                const n1 = (bs[i] >> 4)& 0xF;
                const n2 = bs[i] & 0xF;
                nibbles.push(n1);
                nibbles.push(n2);
            }
            return nibbles;
        }
        function bcdFreqRange2IntFreqRange(raw_freq_range){
            let start = raw_freq_range.slice(0,0+2);
            let end = raw_freq_range.slice(2,2+2);
            start = bytes2nibbles(start).join("");
            end = bytes2nibbles(end).join("");
            //now in strings like 4800, meaning 480MHz, or 4800 * 100KHz, or 4800*1e5
            start = parseInt(start)*1e5;
            end = parseInt(end)*1e5;
            //now an int that represents frequency in Hz
            return [start, end]
        }
        //console.log(data);
        const int_ranges = ranges.map(x=>bcdFreqRange2IntFreqRange(x))
        return int_ranges
        
        
    }
    async parse_radio_name(data){
        const end_of_ascii_string = data.indexOf(0);
        const name = data.slice(0,end_of_ascii_string)
            .map(c=> String.fromCharCode(c)).join("");
        return name;
    }
    async get_radio_gen(radioname){
        if( ! radioname ){
            const radioname = await this.get_radio_name();
        }
        let gen = -1;
        if( ["D680"].includes(radioname) ){
            gen = 0;
        } else if( ["DR780","MD390"].includes(radioname) ){
            gen = 1;
        } else if( ["2017", "MD-UV390","MD-UV380"].includes(radioname) ){
            gen = 2;
        } else {
            throw "dfu.js::get_radio_gen(): Unknown radio generation";
        }
        return gen;
    }
    pad_bytes(buf, block_size){
        const a = new Uint8Array(block_size);
        a.fill(0xff);
        a.set(buf);
        return a;
    }
    progress_clean(){
        const now = new Date();
        if( ! this.progress ){
            this.progress = {}; //it's an object for easier updates by name
        }
        let oldprogress = this.progress;
        this.progress = {}; 
        for( let old of Object.values(oldprogress) ){
            let diff = now - old.lastupdated;
            if( !(old.finished && diff > 5000 )){
                this.progress[ old.name ] = old;
            } 
        }
    }
    progress_get(){
        const now = new Date();
        this.progress_clean();
        return this.progress;
    }
    progress_init(name,max){
        const now = new Date();
        this.progress_clean();
        this.progress[name] = {
            name: name,
            max: max,
            current:0,
            finished:false,
            errored: false,
            started: new Date(),
            lastupdated:new Date(),
            elapsed: 0,
            msg:"started",
        };
    }
    progress_update(name,current){
        const now = new Date();
        this.progress[name].current = current;
        this.progress[name].lastupdated = now;
        this.progress[name].elapsed = now - this.progress[name].started;
    }
    progress_finish(name, has_error, msg){
        this.progress[name].errored = has_error;
        this.progress[name].current = this.progress[name].max;
        this.progress[name].lastupdated = new Date();
        this.progress[name].msg = msg;
        if( ! has_error ){
            this.progress[name].finished = true;
        }

    }
    async read_flash(addr, bytelen){
        const block_size = 1024;
        let block_number = addr/block_size;
        const block_count = bytelen/block_size;
        const bytebufs = [];
        this.progress_init("read_flash",bytelen);
        await this.set_address(0x00000000);
        //console.log(`Expecting to read ${bytelen} bytes from flash`);
        let total_read = 0;
        for( let i = 0; i < block_count; i++){
            let adjusted_block_number = block_number + 2;
            if( block_number >= 256 && block_number < 2048-832 ){
                adjusted_block_number += 832;
            }
            const buf = await this.read(adjusted_block_number, block_size);
            total_read += buf.byteLength;
            this.progress_update("read_flash",total_read);

            bytebufs.push(buf);
            block_number += 1;
        }
        //console.log(bytebufs);
        const a = this.bytes_concat(bytelen, bytebufs);
        this.progress_finish("read_flash",false,"ok");
        return a;
    }
    async write_flash(addr, data){
        const block_size = 1024;
        let block_number = addr/block_size;
        const bytelen = data.byteLength;
        const block_count = Math.ceil(bytelen/block_size);
        const blockedSize = block_count * block_size;
        const bytebufs = [];
        let total_written = 0;
        console.log(`Erasing ${blockedSize} bytes at ${_x(addr)}`);
        await this.eraseFlashBlocks(addr, blockedSize);
        //console.log(`Expecting to write ${block_count} blocks, ${bytelen} bytes (actually ${blockedSize} bytes for block writes) to flash`);
        this.progress_init("write_flash",bytelen);
        await this.set_address(0x00000000);
        for( let i = 0; i < block_count; i++){
            let this_block = data.slice(i*block_size, (i+1)*block_size);
            if( this_block.length != block_size ){
                this_block = this.pad_bytes(this_block, block_size);
            }
            let adjusted_block_number = block_number + 2;
            if( block_number >= 256 && block_number < 2048-832 ){
                adjusted_block_number += 832;
            }
            //console.log(`writing num ${i}, adj ${adjusted_block_number}, size: ${block_size}`);
            await this.request_dnload(adjusted_block_number, this_block);
            await this.wait_until_state( State.dfuDNLOAD_IDLE );
            total_written += this_block.byteLength;
            this.progress_update("write_flash",total_written);
            block_number += 1;
        }
        this.progress_finish("write_flash",false,"ok");
    }
    async eraseFlashBlocks(addr, size){//this needs to be simplified into erase_sector
        const block_size = 64*1024;
        const block_count = Math.ceil(size/block_size);
        this.progress_init("erase_flash",block_count);
        for( let i =0; i < block_count; i++){
            let adjusted_addr = addr;
            if( addr >= 0x40000 && addr <0x200000-0xd0000 ){
                adjusted_addr += 0xd0000;
            }
            await this.erase_sector(adjusted_addr);
            addr += block_size;
            this.progress_update("erase_flash",i);
        }
        this.progress_finish("erase_flash",false,"ok");
    }
    //async get_rdt_size(radioname){
        //const gen = await this.get_radio_gen(radioname);
        //const rdt_size = gen == 1 ? 262709 : 852533;
    //}
    async recv_codeplug(){
        const radioname = await this.get_radio_name();
        const gen = await this.get_radio_gen(radioname);
        const rdt_sizes = [262709, 262709, 852533];
        const rdt_size = rdt_sizes[gen];
        const expected_bytes = rdt_size - 549 - 16;
        await this.programming_mode();
        await this.md380_custom(0xa2, 0x02);
        await this.md380_custom(0xa2, 0x02);
        await this.md380_custom(0xa2, 0x03);
        await this.md380_custom(0xa2, 0x04);
        await this.md380_custom(0xa2, 0x07);
        await this.set_address(0x00000000);
        const a = await this.read_flash(0, expected_bytes);
        await this.enter_dfu_mode();
        console.log("dfu.js recv_codeplug: bin",a);
        console.log("dfu.js recv_codeplug: recv_codeplug finished reading ", expected_bytes);
        return a;
    }
    async send_codeplug(data){ //must be a raw bin (use codeplugs.rdt2bin)
        //console.log(data);
        const radioname = await this.get_radio_name();
        const gen = await this.get_radio_gen(radioname);
        const rdt_sizes = [262709, 262709, 852533];
        const rdt_size = rdt_sizes[gen];
        const expected_bytes = rdt_size - 549 - 16;
        if( data.length != expected_bytes ){
            console.log(data);
            throw "Codeplug to program is not expected size for headerless or RDT files: expected " + expected_bytes + " and  got " + data.length;
        }
        await this.programming_mode();
        await this.programming_mode();
        await this.md380_custom(0xa2, 0x02);
        await this.md380_custom(0xa2, 0x02);
        await this.md380_custom(0xa2, 0x03);
        await this.md380_custom(0xa2, 0x04);
        await this.md380_custom(0xa2, 0x07);

        await this.write_flash(0, data);

        await this.enter_dfu_mode();
        //console.log("Wrote codeplug!");
    }
    async erase_sector(addr){
        const [a,b,c,d] = address_parts(addr);
        const x = await this.ctrl_transfer( 0x21, Request.DNLOAD, 0, 0, [0x41, a,b,c,d]);
        const y = await this.change_state_and_reenter_dfu(`erase_sector( addr=${_x(addr)} )`, State.dfuDNLOAD_IDLE);
        if( y ){ return x}
        else { 
            //console.log("x",x);
            //console.log("y",y);
            throw new Error("erase_sector failed");
            //return y;
        }
    }
    async parseHeader(header_bytes){
        xxd(Array.from(header_bytes));
        let header = {};
        let offset = 0;
        header.magic = header_bytes.subarray(offset,offset+16);
        offset += 16

        header.radio = header_bytes.subarray(offset,offset+16);
        offset += 16

        header.unk = header_bytes.subarray(offset,offset+92);
        offset += 92

        if( offset != 0x7C ){
            throw("offset != 0x7C as expected, offset = " + offset );
        }
        header.sections = [];
        let num_sections = codeplugs.assemble_le(header_bytes.subarray(offset,offset+4));
        if( num_sections > 20 ){
            throw(new Error("Invalid header, probably. Too many sections (>20)."));

        }
        console.log(num_sections);
        if( num_sections == (1<<32) - 1 || num_sections == -1 ){
            num_sections = 1;
        }
        header.num_sections = num_sections;
        offset += 4;
        //parse into uint32_t_LE
        for( let i = 0; i < num_sections; i++){
            const memloc = codeplugs.assemble_le(header_bytes.subarray(offset, offset+4))
            offset += 4;
            const size = codeplugs.assemble_le(header_bytes.subarray(offset, offset+4))
            offset += 4;
            header.sections.push( [memloc, size] );
        }
        //anything left between offset and 0x100 is don't care (or at
        //least, we've never seen anything beyond 0xff there and it makes
        //sense to have it there for multiple sections)
        console.log(header);
        return header;
    }
    get_sector_size(addr){
        if( addr < 0x8000000 ){
            return 0x10000;
        } else if ( addr >= 0x8000000 && addr < 0x8010000 ){
            return 0x04000;
        } else if ( addr == 0x8010000 ){
            return 0x10000;
        } else {
            return 0x20000;
        }
    }
    async write_sector(addr, secsize, data){
        const block_size = 1024;
        const block_total = data.length / 1024;
        console.log(`write_sector(addr=0x${addr.toString(16)}, secsize=0x${secsize.toString(16)}, len(data)=${data.length}, numblocks=${block_total}`);
        assert(secsize == this.get_sector_size(addr));
        //assert(data.length%1024 == 0);
        await this.set_address(addr);

        let written = 0;
        let block_num = 0;
        this.progress_init("flash_sector", block_total);
        while( written < data.length ){
            if( block_num >= block_total ){
                console.log("way too many blocks ...");
            }
            let block_data = data.subarray(written, written+block_size);
            //console.log(`request_dnload(blockid=${block_num+2}, block_data.length=${block_data.length})`);
            if( block_data.length != block_size ){
                block_data = this.pad_bytes(block_data, block_size);
            }
            if( this.mock === true ){
                await wait_for(10);
            } else {
                await this.request_dnload(block_num+2, block_data);
                await this.wait_until_state( State.dfuDNLOAD_IDLE );
            }
            written+= block_size;
            block_num++;
            this.progress_update("flash_sector", block_num);
        }
        this.progress_finish("flash_sector", false, "ok");
        return written; //TODO: this includes padding, which we may not want, depending!
    }
    async firmware_upload(data_bytes){
        console.log("firmware upload");
        //TODO detect firmware upload mode
        await this.get_status()
        await this.md380_custom(0x91, 0x01);
        await this.md380_custom(0x91, 0x31);
        //0x100 at the start is the header
        //0x100 footer, too, but without interesting data
        const header = await this.parseHeader(data_bytes.subarray(0x0,0x100));
        console.log(header, data_bytes.length);
        const firmware = data_bytes.subarray(0x100);
        //need to check header radio magic, but skip that for now lol
        let offset = 0; //offset into firmware to read from
        this.progress_init("firmware_sections", header.num_sections);
        let sections_done = 0;

        for( const [memloc,size] of header.sections){
            console.log(`Location: 0x${memloc.toString(16)} [${size.toString(16)}]`);
            //erase and then write each sector (as opposed to erasing all sectors and then writing all sectors...)
            //
            //per nizzo, this is non ideal - BUT, i have an overriding concern:
            //I don't actually know the memory layout like Tytera does!
            //or what memory will be used!
            //so I don't actually know which sectors will need to be
            //erased until I look at the firmware and try to write it
            //(unless i generate the addresses for the sectors ahead of time...?)

            //  for each sequence for the location and size:
            let sz_remaining = size;
            let addr = memloc;
            this.progress_init("fw_section", sz_remaining);
            while( sz_remaining > 0 ){
                //TODO: problem is that we blow right past sz_remaining ... 
                const secsize = this.get_sector_size(addr);
                const datalength = Math.min(sz_remaining, secsize);
                const data_for_this_sector = firmware.subarray(offset,offset+datalength)
                //if( data_for_this_sector.length != secsize ){
                    //console.log("data did not match sec size",data_for_this_sector.length, secsize, addr, memloc, offset, sz_remaining);
                //}
                console.log(`offset=0x${offset.toString(16)}, Sector 0x${addr.toString(16)}, size=0x${secsize.toString(16)}, datalength=0x${data_for_this_sector.length.toString(16)}`);
                if( this.mock === true ){
                    await wait_for(5);
                } else {
                    await this.erase_sector(addr);
                }
                const written = await this.write_sector(addr, secsize, data_for_this_sector)
                addr += secsize; 
                offset += written; 
                sz_remaining -= written; 
                console.log("remaining:",sz_remaining);
                this.progress_update("fw_section", size-sz_remaining);
            }
            console.log("done with ",memloc.toString(16));
            sections_done++;
            this.progress_finish("fw_section", false, "ok");
            this.progress_update("firmware_sections", sections_done);
            
        }
        console.log("done with firmware");
        this.progress_finish("firmware_sections", false, "ok");
        console.log(this.progress_get());
        console.log(this);
    }
}
class VCZTYTDFU extends TYTDMRDFU {
    //port of md380_tool from KK4VCZ and friends
    //supposedly needs to read the manufacturer string to hook the added USB functions
    async peek(adr, size){
        await this.set_address(adr);
        const res = await this.request_upload( 1, size);
        return new Uint8Array(res.data.buffer);
    }
    async spiflashgetid(){
        const size=4;
        const cmd = 0x05;
        return await this.query([cmd], size);
    }
    async spiflashpeek( adr, size=1024){
        const cmd= 0x01;
        const cmdbytes = [cmd, ...codeplugs.dissemble_le(adr,4)];
        return await this.query(cmdbytes, size);
    }
    async query(cmdbyteslist, resultsize){
        //console.log(`query(cmdbyteslist=${cmdbyteslist}, resultsize=${resultsize})`);
        await this.request_dnload( 1, new Uint8Array(cmdbyteslist));
        await this.get_status();
        const status = await this.get_status();
        const res = await this.request_upload( 1, resultsize);
        return new Uint8Array(res.data.buffer);
    }
    async read_framebuf_line(y){
        //console.log(`read_framebuf_line(y=${y})`);
        const cmdbytes = [0x84, 0, y, 159, y];
        const size = 160*3+5;
        const res = await this.query(cmdbytes, size);
        if( res[4] == y ){ //0-4 are the cmdbytes echoed if all is well
            return res.slice(5);  //so strip those and just return the BGR pixels, 8 bits each color
        } else {
            return null;
        }
    }
    async get_screen_bmp(){
        console.log("get_screen_bmp");
        const size = 0xf036;
        this.progress_init("screenshot", size);
        const bmp = new Uint8Array(size);
        const header = codeplugs.hex2bytes(
            "424d" + "36f0" + "0000" + "00000000"+
            "36000000"+ //54
            "28000000"+ //40 sizeof(bitmapinfoheader)
            "a0000000"+ //160 width pixels
            "80000000"+ //128 height pixels
            "01001800"+ //bitplanes (1) and bits per pixel (24 / 0x18)
            "00000000"+
            "00A00000"+ //sizeof(pixel data)
            "00000000"+ //x pixel per meter
            "00000000"+ //y pixel per meter
            "00000000"+ //no colour palette
            "00000000" //number of colours used: 0=all colors
        );
        bmp.set(header,0);
        let offset = header.length;
        for( let y = 127; y >=0; y--){ //bmp files begin with the bottom line
            let line = null;
            while( ! line ){ //may need a retry
                line = await this.read_framebuf_line(y);
                await wait_for(10);
            }
            bmp.set(line, offset);
            offset += line.length;
            this.progress_update("screenshot",offset);
            await wait_for(1);
        }
        this.progress_finish("screenshot", false, "ok");
        return bmp;
    }
    async getdmesg(){
        const res = await this.query( [0], 1024);
        const text = codeplugs.bytes2string(Array.from(res));
        //need to reorder the ring buffer
        console.log(text);
        return text;
    }
}
class MockUSB {
    //console.log(`[DFU]: Entering DFU mode on usb device '${this.device.productName}'`);
    constructor(dev){
        this.manufacturerName ="tarxvf";
        this.productName= "mockUSB";
        this.opened= false;
    }
    async open(){
        //await this.device.open();
        this.opened = true;
        await wait_for(1);
    }
    async claimInterface(idx){
        //await this.device.claimInterface(0);
        await wait_for(1);
    }
    async selectConfiguration(idx){
        //await this.device.selectConfiguration(1);
        await wait_for(1);
    }
    async selectAlternateInterface(idx1,idx2){
        //await this.device.selectAlternateInterface(0,0);
        await wait_for(1);
    }

    async controlTransferOut(setup, d2sb){
        assert(this.opened);
        await wait_for(1);
        //console.log("controlTransferOut", setup, d2sb);
    }
    async controlTransferIn(setup, length2read_or_data2send){
        assert(this.opened);
        await wait_for(1);
        //console.log("controlTransferIn", setup, length2read_or_data2send);
    }
}
class MockDFU extends DFU {
    //constructor(dev){
    //async init(){
    //async wait(){
    //async clear_status(){
    //async detach(){
    //async enter_dfu_mode(){
    //async ctrl_transfer( requestType, request, value, index, length2read_or_data2send ){
    //async get_state(){
    //async get_status(){
    //async abort(){
    //async change_state_and_reenter_dfu(name, expected_state, ...args){
    //async wait_until_state(desired_state){
    //async clear_status_until_state( desired_state){
    //async set_address(addr){
    //async read(blk_n, block_size){
    //async request_upload(block_num, length, idx=0){
    //async request_dnload(block_num, data, idx=0){
}
class MockTYTDFU extends TYTDMRDFU {
    constructor(dev){
        super();
        this.device = dev;
        this.has_rebooted = false;
    }
    async wait(){
        await wait_for(1); //speed things up for testing
    }
    async enter_dfu_mode(){
        //console.log("enter_dfu_mode");
    }
    async programming_mode(){
        //console.log("programming_mode");
    }
    async reboot(){
        this.device = null;
        this.has_rebooted=true;
    }
    async identify_radio(){
        return ["MD-UV390",[[136000000,174000000]],"10C"];
    }
    async ping(){
        return ! this.has_rebooted && this.device;
    }
    async get_radio_name(){
        return "MD-UV390";
    }
    async raw_identify_radio(){
        return new Uint8Array([77,68,45,85,86,51,57,48,0,255,255,255,255,255,255,255,35,2,0,82,0,64,0,72,96,19,64,23,255,217,255,255]);
    }
    async get_radio_gen(){
        return 2;
    }
    async erase_sector(addr){
        await this.wait();
    }
    async read_flash(addr, bytelen){
        //read_flash is the only actual read operation, and we want to fake that nicely with data.
        //writing and erasing aren't mocked because we can just stub out the underlying operations and have the original implementations work
        const rdt = fetchblob( "/data/codeplug1_tarxvf.rdt");

        const block_size = 1024;
        let block_number = addr/block_size;
        const block_count = bytelen/block_size;
        this.progress_init("read_flash",bytelen);
        let total_read = 0;
        for( let i = 0; i < block_count; i++){
            total_read += block_size;
            await this.wait();
            this.progress_update("read_flash",total_read);
            block_number += 1;
        }
        this.progress_finish("read_flash",false,"ok");
        const bin = codeplugs.rdt2bin(await rdt);
        return bin;
    }
    async md380_custom(a,b){
        console.log("md380_custom");
        return;
    }
    async get_state(){
        console.log("get_state");
        return;
    }
    async get_status(){
        console.log("get_status");
        return;
    }
    async abort(){
        console.log("abort");
        await this.wait();
    }
    async change_state_and_reenter_dfu(name, expected_state, ...args){
        console.log("change_state_and_reenter");
        return;
    }
    async wait_until_state(desired_state){
        console.log("wait_until_state");
        await this.wait();
    }
    async clear_status_until_state( desired_state){
        console.log("clear_status_until_state");
        await this.wait();
    }
    async set_address(addr){
        console.log("set_address");
        return;
    }
    async read(blk_n, block_size){
        console.log("read");
        await this.wait();
    }
    async request_upload(block_num, length, idx=0){
        return;
    }
    async request_dnload(block_num, data, idx=0){
        return;
    }
}

//TODO: Firmware upload for gen1 and gen2 radios

export default {
    ACM,
    DFU,
    TYTDMRDFU,
    VCZTYTDFU,
    MockUSB,
    MockDFU,
    MockTYTDFU,
    radio_filters
}
