import {loadData, filterData, counter, miniMax} from "./tools.js";
const API_URL = "https://raw.githubusercontent.com/germanter/apiEngine/refs/heads/main/api.json";

const dat = await loadData(API_URL);
if (!dat.status){
    console.log("FAIL");
}else{
    let data = dat.content;
    let ref = filterData(data,{"status":"ALIVE"});
    if(!ref.status){
        console.log("FAIL");
    }else{
        ref = ref.content
        console.log(ref);
        let grp = counter(ref,"category");
        console.log(grp)
        let max = miniMax(grp,"max");
        console.log(max);
    }
}
