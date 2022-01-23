
const country_ham_bands = {
    "USA":{
// http://www.arrl.org/files/file/Regulatory/Band%20Chart/Band%20Chart%20-%2011X17%20Color.pdf
        "6m":[50,54],
        "2m":[144,148],
        "1.25m":[222,225],
        "70cm":[420,470],
        "33cm":[902,928],
        "23cm":[1240,1300]
    },
}

//TODO: now i can implement freq_to_band through the country_ham_bands structure too
//TODO: i can detect license class through being in a band but not being
//in the country_ham_bands data structure too
const standard_offset = {
    "2m": 0.6,
    "70cm": 5,
    "1.25m":1.6,
    "10m":.1
}
function freq_to_band(f){
    const bands = [
        [136, 174, "2m"],
        [219, 225, "1.25m"],
        [400, 480, "70cm"], //TODO: won't get up to 520 UHF stuff
        [902, 928, "33cm"]
    ];
    for (const band of bands){
        if( f >= band[0] && f <= band[1] ){
            return band[2];
        }
    }
    return "unknown band";

}
function standard_offset_from_freq(f){
    return standard_offset[ freq_to_band( f ) ];
}
function emission_designator_to_protocol( emd ){
    const emd2p = {
        "7K60FXW":"DMR",   
        "7K60FXD":"DMR",
        "7K60FXE":"DMR",
        "11K2F3E":"FM2.5", //"FM%d"%(FM_tx_deviation)

    }
    const proto = emd2p[emd];
    return proto ? proto: "unk";
}

export default {
    standard_offset,
    standard_offset_from_freq,
    freq_to_band,
    emission_designator_to_protocol
}
