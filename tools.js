// constants
//default type
// {
//   "name": "OpenAI API",
//   "desc": "Text, image, speech, embeddings models via REST API",
//   "url": "https://platform.openai.com/docs/api-reference",
//   "cost": "freemium",
//   "auth": true,
//   "category": "AI",
//   "status": "ALIVE"
// }


//load data
export async function loadData(url){
    try{
        const res = await fetch(url);
        if(!res.ok){
            console.error("loadData function failed, roger");
            return {status:false};
        }
        const data = await res.json();
        return {status:true, content:data};

    }catch(error){
        console.error("loadData function failed, roger");
        return {status:false};
    }
}



// filter data
export function filterData(data, filter = {}){
    try{
        if (!Array.isArray(data) || data.length === 0) {
            return {status: false};
        }
        const filtered = data.filter(row=>
            Object.entries(filter).every(([k,v])=>{
               if(!row) return false;
               if(Array.isArray(v)) {
                return v.includes(row[k]);
               }
               return row[k] === v;
            })
        )
        return {status:true,content:filtered};
    }catch(error){
        console.error("filterData function failed, roger");
        return {status:false}
    }
}



//count data
export function counter(data, field){
    try{
        if (!Array.isArray(data) || data.length === 0) {
            return { status: false};
        }

        if(!field){
            return {status:true, content:{ total:data.length }};
        }

        const grouped = data.reduce((acc,row)=>{
            if (!row) return acc;

            let key = row[field];
            if(key===undefined){
                key = "UNKNOWN";
            }
            if(!(key in acc)){
                acc[key] = 0;
            }

            acc[key] +=1;
            return acc;
        },{}) // {} -> acc-in ilkin baslangic halidir, bos dictionary

        return {status:true, content:grouped};
    }catch(error){
        console.error("counter function failed, roger"); 
        return {status:false};
    }
}

//finds min-max
export function miniMax(counterObj, mode = "max") {
    try {
        const mapper = {
            "max": (current, next) => next > current,
            "min": (current, next) => next < current
        };
        if(!(mode in mapper)){
            return {status:false};
        }

        if (!counterObj || typeof counterObj !== 'object' || Object.keys(counterObj).length === 0) {
            return { status: false };
        }

        const values = Object.values(counterObj);
        const corrupted = values.some(val => typeof val !== "number");
        if (corrupted) {
            return { status: false }; 
        }

        const compare = mapper[mode]

        const entries = Object.entries(counterObj);

        const result = entries.reduce((currentBest, nextItem) => {
            return compare(currentBest[1], nextItem[1]) ? nextItem : currentBest;
        });

        return { 
            status: true, 
            content: { 
                field: result[0], 
                value: result[1] 
            } 
        };
    } catch (error) {
        console.error("miniMax function failed, roger"); 
        return { status: false };
    }
}


//map data
export function dataMapper(entry, lang="aze"){
    try{
    if (entry === undefined || entry === null || entry === "") {
            return { status: false }}

    const mapper = {
        "aze" : 
        {
        "category":"kateqoriya",
        "auth":"yoxlanış",
        "status":"status",
        "cost":"qiymət",
        "name":"ad",
        "desc":"məlumat",
        "url":"url",
        "ALIVE":"aktiv",
        "DEAD":"deaktiv",
        "UNKNOWN":"bilinmir",
        "freemium":"freemium",
        "premium":"ödənişli",
        "free":"pulsuz"
        },
        "colors":
        {
        "ALIVE":"#1971C2",
        "DEAD":"#E03131",
        "UNKNOWN":"#F08C00",
        "freemium":"#1971C2",
        "premium":"#E03131",
        "free":"#2F9E44"
        }
    }
    if(lang in mapper && entry in mapper[lang]){
        const res = mapper[lang][entry]
        return {status:true,content:res}
    }else{
        return {status:true,content:entry}
    }
    }catch(error){
        console.error("dataMapper function failed, roger");
        return {status:false,content:entry};
    }
}

