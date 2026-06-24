// console.log(`where is the money skyler?`)
// console.log(`i said wheres the money skyler???`)
const apiUrl = "https://raw.githubusercontent.com/germanter/apiEngine/refs/heads/main/api.json";
const h1 = document.getElementById("h1_id1");
const h2 = document.getElementById("h2_id2");
const pg = document.getElementById("p_id1");

let name = `API-Engine`;
let based = `GitHub`;
let tech = `Python`;
let pwr = 4400;
h2.textContent = `${name} is based on ${based} and it works with ${tech}, power is ${pwr}`;

const rawRes = await fetch(apiUrl);
let connFlag = 'conn-X:'
console.log(`${connFlag} ${rawRes.ok}`, typeof rawRes.ok);
if(rawRes.ok){
    const apiData = await rawRes.json();
    console.log(apiData);
    h1.textContent = `status code = ${rawRes.status}`;
    pg.textContent = JSON.stringify(apiData);
}







// window.alert(`skyler removed the money!`)

// recon mission
/*
this is a big comment
*/

