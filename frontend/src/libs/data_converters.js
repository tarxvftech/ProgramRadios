
async function ds_to_vue_data(vue_app, data_sources_list){
    for( var ds of data_sources_list){
        ds.promise.then(()=>{
            var flat = dsFlatten(data_sources_list);
            for( var key in flat ){
                vue_app.data[key] = flat[key];
            }
        })
    }
    var data_promises = data_sources_list.filter(x=>x.promise);
    Promise.all(data_promises).then(()=>{
        console.log("All done!");
    });
}
function dsFlatten(data_sources_list){
    var main = {
        grouped_channels:{},
        grouped_commgroups:{},
        grouped_chancomms:{},
    };
    for( var ds of data_sources_list ){
        //console.log(ds);
        var data = ds.data;
        //console.log(ds.id,data);
        for( var type in data ){
            //console.log(type);
            var list = data[type];
            var grouped = "grouped_"+type;
            main[grouped][ds.id] = [];
            for( var idx in list ){
                //console.log(ds.id,type,idx);
                main[grouped][ds.id].push( list[idx] );
            }
        }
    }
    return main;
}

function new_data_source(dsType, uri){
    var path = uri.split("/");
    //console.log(path);
    var filename = path[ path.length -1 ];
    //console.log(filename);
    var basename = filename.split(".")[0]; //assume no dots part of filename
    //console.log(basename);
    var obj = {
        id: basename,
        type: dsType,
        promise:null,
        data: null,
        rawdata: null
    }
    obj.promise = fetch(uri).then(r=>r.json()).then(d=>{
        obj.rawdata = d;
        if( data_source_normalizers[dsType] ){
            obj.data = data_source_normalizers[dsType](d);
        } else {
            obj.data = d;
        }
    }).catch(e=>{
        console.log(uri,e);
    });
    return obj;
}
var data_source_normalizers = {
    "fcc.js": dsConvert_fccjs,
    "radioid.net":dsConvert_radioidnet,
    "commgroups":null,
    "channels":null,
    "chancomms":null
}
function dsConvert_fccjs( data ){
    var normalized = [];
    var frequencies = data.data;
    //todo: find standard offsets between [MO, MOI, FX1] and FB2 and make a REPEATER channel
    //rather than a SIMPLEX channel
    repeater_outputs = frequencies.filter(x=>x["Station Class"] == "FB2");
    //console.log(data.licenseid, repeater_outputs);
    for( var f of frequencies.filter(x=>! repeater_outputs.includes(x)) ){
        if( ["FB","MO","MOI"].includes( f["Station Class"]) ){
            //assumption that it's simplex, which is likely wrong
            //when it's wrong, it's the _input_ to a repeater
            band = freq_to_band(f.Frequency);
            expected_offset = standard_offset[band];
            repeater_output_match = repeater_outputs.filter(x=>
                x.Frequency == f.Frequency + expected_offset
                || x.Frequency == f.Frequency - expected_offset
            );
            if( repeater_output_match.length ){
                //console.log("MATCH", repeater_output_match);
                //console.log(repeater_output_match[0].Frequency, f.Frequency);
                var offset = f.Frequency - repeater_output_match[0].Frequency;
                offset = offset > 0 ? "+" : "-";
                offsetid = offset == "+"? "p":"m";
                var id = "R"+data.searchquery + f.Frequency+offsetid;
                id = id.replace(/[ \.]/g, "");
                var channel = {
                    name: data.searchquery +" "+ f.Frequency,
                    "freq":f.Frequency,
                    "callsign": data.searchquery,
                    "offset":offset,
                    color_code: undefined, //can't know it from data here
                    id: id,
                    type: "repeater",
                    group_by:"callsign"

                }
                //console.log(channel);
                normalized.push(channel);
            } else {
                var id = "S"+data.searchquery + f.Frequency;
                id = id.replace(/[ \.]/g, "");
                var channel = {
                    name: data.searchquery +" "+ f.Frequency,
                    "freq":f.Frequency,
                    "callsign": data.searchquery,
                    id: id,
                    type: "simplex",
                    group_by:"callsign",
                }
                if( ! normalized.some(c=>c.freq == channel.freq  ) ){
                    //only add if there's nothing equivalent, where equivalent means the same freq
                    normalized.push(channel);
                } else {
                    console.log("skipping adding ", channel);
                }
            }
        } else {
            console.log(`${JSON.stringify(f)} is not supported (unknown station  class)`);
        }
    }
    return {
        channels:normalized,
    }
}
function dsConvert_radioidnet( data ){
    var normalized = [];
    var repeater = data.results;
    for( var r of repeater ){
        //console.log(r);
        var f = parseFloat(r.frequency);
        var offset = parseFloat(r.offset);
        var band  = freq_to_band(f);
        var std_offset = standard_offset[band];
        if( band && std_offset ){
            offset = offset > 0 ? "+" : "-";
        }
        var id = r.id.replace(/[ \.]/g, "");
        //console.log(id);
        normalized.push({
            name: r.callsign,
            callsign: r.callsign,
            id: id,
            network: r.ipsc_network,
            color_code: r.color_code,
            freq: f,
            offset: offset,
            //location: null,
            type: "repeater",
            group_by:"network",
            state: r.state,
            city: r.city,
            country: r.country,


        });
    }
    return {
        channels:normalized.sort(sortbykey("city")),
    }
}








