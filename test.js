const {setTimeout} = require("timers/promises");

function test1() {
    console.log(1);
    setTimeout(()=>{console.log(2)}, 500);
    console.log(3);
}

async function test2() {
    console.log(1);
    await setTimeout(500);
    console.log(2);
    console.log(3);
}

function test3() {
    console.log(1);
    setTimeout(500).then(()=> {
        console.log(2);
        console.log(3);
    });
}

// test1();
// test2();
// test3();

let war = {"message":"The data were fetched successfully.","data":{"date":"2022-10-03","day":222,"resource":"https:\/\/www.facebook.com\/MinistryofDefence.UA\/posts\/pfbid03yU8EqqibmdNkZjpNSU1W9B36p5tTLzSa4HtZepwf8WofBXR7WUeevMgMosU3NuBl","stats":{"personnel_units":60430,"tanks":2380,"armoured_fighting_vehicles":4991,"artillery_systems":1405,"mlrs":338,"aa_warfare_systems":176,"planes":265,"helicopters":228,"vehicles_fuel_tanks":3811,"warships_cutters":15,"cruise_missiles":246,"uav_systems":1026,"special_military_equip":131,"atgm_srbm_systems":4},"increase":{"personnel_units":320,"tanks":3,"armoured_fighting_vehicles":16,"artillery_systems":0,"mlrs":1,"aa_warfare_systems":0,"planes":1,"helicopters":1,"vehicles_fuel_tanks":15,"warships_cutters":0,"cruise_missiles":0,"uav_systems":11,"special_military_equip":0,"atgm_srbm_systems":0}}};
let {date, data: {stats}, data:{increase}} = war;
console.log(stats);
console.log(increase);