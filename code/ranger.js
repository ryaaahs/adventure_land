const attack_mode = true
let hunting_list = ["bigbird", "grinch"];
let boss_list = ["grinch", "snowman"];
let mtype_list = hunting_list;
let moving = false;
const merchant = "merchire";
const party_owner = "ryaaahs"
const party_seconds = 30;
const charge_timer = 40;
const party_target = ["pbuffme", "merchire", "ryaaahs"]
const farming_location = {x: 1289.95, y: -66.00, map: "main"};
const bot_tank = "pbuffme"
let waiting_for_tank = false;
const elixir = "pumpkinspice";

add_top_button("real_x", "real_x: " + character.real_x.toFixed(2));
add_top_button("real_y", "real_y: " + character.real_y.toFixed(2));

smart_move(farming_location);

const pvp_whitelist = []

const bots = [
    "ryaaahs",
    "pbuffme",
    "altfire",
    "merchire"
]

const whitelist_items = [
	"tracker",
    "hpot0",
    "hpot1",
    "mpot0",
    "mpot1",
    "pouchbow",
    "firebow",
    "pumpkinspice",
    "elixirluck",
    "luckbooster",
    "rabbitsfoot",
    // "wattire",
    // "wgloves",
    // "wbreeches",
    // "wcap",
    // "wshoes",
    "supermittens",
    "fury",
    "elixirluck"
]

let mp_pot_quantity = 0
let hp_pot_quantity = 0

let is_boss_location = false;
let is_preping_boss_move = false;
let event_boss = null;
let boss_timeout = null;
let boss_map = "";
let boss_coords = {x: 0, y: 0};

const RESPAWN_INTERVAL = 15 * 100; 
setInterval(function () { 
    if (character.rip) { 
        respawn(); 
        smart_move(farming_location);
        waiting_for_tank = true; 
    } 
}, RESPAWN_INTERVAL);

load_code("code_cost");
load_code("dps_meter");
load_code("kill_tracker");
load_code("gold_meter");
load_code("xp_meter");

// setInterval(() => {
//     if (parent.S?.snowman?.live && !is_preping_boss_move) {
//         setTimeout(() => {
//             smart_move(parent.S?.snowman)
//         }, 1000 * 10)
//         event_boss = "snowman";
//         is_boss_location = true;
//         is_preping_boss_move = true;
//         mtype_list = boss_list;
//     } else if (parent.S?.grinch?.live && !is_preping_boss_move) {
//         event_boss = "grinch";
//         is_boss_location = true;
//         mtype_list = boss_list;
//     } else {
//         if (is_boss_location && !parent.S[event_boss]?.live) {
//             is_boss_location = false;
//             is_preping_boss_move = false;
//             event_boss = null;
//             boss_map = "";
//             boss_coords.x = 0;
//             boss_coords.y = 0;
//             mtype_list = hunting_list;
//             smart_move(farming_location);
//         }
//     }
// }, 1000 * 5)

// Merchant
function send_loot_to_merch() {
    
    set_message("Send Loot");

    for (let i = 0; i < character.items.length; i++) {
        if (character.items[i] != null) {
            if (whitelist_items.includes(character.items[i].name)) continue;
            if (character.items[i].q) {
                send_item(merchant, i, character.items[i].q);
            } else {
                send_item(merchant, i, 1);
            }
            
        }
    }
    send_gold(merchant, character.gold);
}

function get_mob_targets() {
    let targets = []

    for (const id in parent.entities) {
        const mob = parent.entities[id];

        //if (mob?.player && pvp_whitelist.includes(mob?.owner)) continue;
        //if (mob?.player && !mob?.rip && (!party_target.includes(mob?.name)) && !mob?.npc) return [mob];

        if (!mob || mob.type !== "monster" || mob.dead) continue;
        
        // Farm arctic bees while waiting for snowman
        if (parent.S?.snowman?.live && mob.s?.fullguardx) {
            if (!mtype_list.includes("arcticbee")) mtype_list.push("arcticbee");
        } else {
            if (mob.mtype === "snowman" && !mob.s?.fullguardx) {
                if (mtype_list.includes("arcticbee")) mtype_list.pop();
            }
        }
        
        if (mtype_list.includes(mob.mtype) || party_target.includes(mob.target) || mob.target === character.name) {
            targets.push(mob);
        }
    }

    targets = targets.sort((a, b) => {
        a_distance = distance(character, a);
        b_distance = distance(character, b);

        return a_distance - b_distance;
    }).slice(0, 5)

    return targets;
}

async function handle_huntersmark() {
    try {
        if (is_on_cooldown("huntersmark")) return;

        // Get all mobs
        let mobs = Object.values(parent.entities).filter(mob =>
            mob.type === "monster" &&
            mob.target &&
            mob.hp >= mob.max_hp * 0.70 &&
            mob.s?.cursed
        );

        if (mobs.length === 0) return;

        // Sort the mobs by hp
        mobs = mobs.sort((a, b) => {
            return a.hp > b.hp;
        })

        console.log(mobs, mobs[0], mobs[0].hp)

        await use_skill("huntersmark", mobs[0]);
        game_log(`Hunters Mark ${mobs[0]?.name}`, "#FFA600");
    }  catch (e) {
        console.log("Hunters Mark error: ", e);
    }
}
setInterval(handle_huntersmark, 100);

async function handle_consume() {
    try {

        if (character.slots?.elixir) return;
        let elixir_index = locate_item(elixir);

        // Drink the consume x times
        for (let i = 0; i < 4; i++) {
            game_log(`Consuming ${elixir}`, "#FFA600");
            consume(elixir_index)
        }
        
    }  catch (e) {
        console.log("Consume error: ", e);
    }
}
setInterval(handle_consume, (1000 * 60) * 5);

async function attack_loop(targets) { 

    if (targets.length === 0) return;

    change_target(targets[0]);
    // if (!is_in_range(targets[0]) || distance(character, targets[0]) > character.range - 20) {
	// 	// Walk half the distance
    //     move(character.x+(targets[0].x-character.x) / 2, character.y + (targets[0].y-character.y) / 2);
	// }

    // if ((targets.length >= 5 && targets.every((m) => is_in_range(m, "attack"))) && character.mp >= G.skills["5shot"].mp) {
    //     for (const mob of targets) {
    //         draw_circle(mob.x, mob.y, 20, 3, 0xE8FF00); // ranger path  
            
    //     }

    //     // for (let i = 0; i < targets.length; i++) {
    //     //     if (i === 0) continue;

    //     //     if (distance(targets[i], targets[i - 1]) < 20) {
    //     //         if (i === targets.length - 1) {
    //     //             if (character.slots?.mainhand.name === "firebow") {
    //     //                 await unequip("mainhand");
    //     //                 await equip(locate_item("pouchbow"), "mainhand")
    //     //             }
    //     //             break;
    //     //         } else {
    //     //             continue;
    //     //         }
    //     //     } 
            
    //     //     if (character.slots?.mainhand.name === "pouchbow") {
    //     //         await unequip("mainhand");
    //     //         await equip(locate_item("firebow"), "mainhand")
    //     //     }
    //     //     break;
    //     // }

    //     //console.log(targets.every((target) => distance(get_player(bot_tank), target) < 15));

    //     if (!is_on_cooldown("5shot")) {
    //         game_log(`Five Shot`, "#FFA600");
    //         await use_skill("5shot", targets)
    //     }

    // } else 
    if ((targets.length >= 2 && targets.every((m) => is_in_range(m, "attack"))) && character.mp >= G.skills["3shot"].mp) {
        for (const mob of targets) {
            draw_circle(mob.x, mob.y, 20, 3, 0xE8FF00); // ranger path  
            
        }

        // for (let i = 0; i < targets.length; i++) {
        //     if (i === 0) continue;

        //     if (distance(targets[i], targets[i - 1]) < 20) {
        //         if (i === targets.length - 1) {
        //             if (character.slots?.mainhand.name === "firebow") {
        //                 await unequip("mainhand");
        //                 await equip(locate_item("pouchbow"), "mainhand")
        //             }
        //             break;
        //         } else {
        //             continue;
        //         }
        //     } 
            
        //     if (character.slots?.mainhand.name === "pouchbow") {
        //         await unequip("mainhand");
        //         await equip(locate_item("firebow"), "mainhand")
        //     }
        //     break;
        // }

        //console.log(targets.every((target) => distance(get_player(bot_tank), target) < 15));

        if (!is_on_cooldown("3shot")) {
            game_log(`Three Shot`, "#FFA600");
            await use_skill("3shot", targets)
        }

    } else if (targets.length >= 1 && is_in_range(targets[0], "attack")) {
        draw_circle(targets[0].x, targets[0].y, 20, 3, 0xE8FF00); // ranger path

        if (can_attack(targets[0])) {
            game_log(`Single Shot`, "#FFA600");
            await attack(targets[0])
        }
    } 

    // if (!is_in_range(get_player(bot_tank)) || distance(character, get_player(bot_tank)) > character.range - 5) {
	// 	// Walk half the distance
    //     move(character.x+(get_player(bot_tank).x-character.x) / 3, character.y + (get_player(bot_tank).y-character.y) / 3);
	// }

}

async function touch_christmas_tree() {
    await smart_move(({ x: 48, y: -62, map: "main" }));
	parent.socket.emit("interaction", {type:"newyear_tree"});
    await smart_move(farming_location);
    waiting_for_tank = true
    moving = false
}

// setInterval(function () {
//     loot();
// }, 100);

// Combat loop
setInterval(function(){
    let targets = get_mob_targets();;

    if (event_boss === "grinch") {
        if (!targets.some((mob) => mob.mtype === "grinch")) {
            if (parent.S?.grinch?.map !== "woffice") {
                if (parent.S?.grinch?.map !== boss_map || 
                    (abs(boss_coords.x - parent.S?.grinch?.x) > 200 || abs(boss_coords.y - parent.S?.grinch?.y) > 200)) {
                    
                    boss_map = parent.S?.grinch?.map;
                    boss_coords.x = parent.S?.grinch?.x;
                    boss_coords.y = parent.S?.grinch?.y;
                    smart_move(parent.S?.grinch);

                }
            }
        } else {
            is_preping_boss_move = false;
            clear_drawings();
            attack_loop(targets); 
        }

        if (get_target()?.mtype === "grinch") {
            if (!is_on_cooldown("huntersmark")) {
                use_skill("huntersmark");
            }
        }
    }

    if (waiting_for_tank) {
        if (get_player(bot_tank)) {
            waiting_for_tank = false
        }
    }

    check_for_mp()
    check_for_hp()

    if (!smart.moving && !waiting_for_tank) {
        clear_drawings();
        draw_circle(character.x, character.y, character.range, 2, 0xFF0000);
        attack_loop(targets);
    }
}, 1000 * 0.25); // Loops every 1/4 seconds.
setInterval(() => parent.socket.emit("send_updates", {}), 1000 * 30); // Update entity list to remove ghost mobs

function check_for_hp() {
    let hp_pot_zero_index = locate_item("hpot0")
    let hp_pot_one_index = locate_item("hpot1")
    
    if (is_on_cooldown("use_hp")) return;

    if (hp_pot_one_index != -1) {
        hp_pot_quantity = character.items[hp_pot_one_index].q;

        if (hp_pot_quantity < 250) {
            send_cm(merchant, {
                message: "pot_request",
            })
        }

        if (character.hp < character.max_hp - 400) {
            use_skill("use_hp");
        }

    } else if (hp_pot_zero_index != -1) {
        if (character.hp < character.max_hp - 200) {
            use_skill("use_hp");
        }

    } else {
        if (character.hp < character.max_hp - 100) {
            use_skill("use_hp");
        }

        hp_pot_quantity = 0;

        send_cm(merchant, {
            message: "pot_request",
        })
    }
}

function check_for_mp() {
    let mp_pot_zero_index = locate_item("mpot0")
    let mp_pot_one_index = locate_item("mpot1")

    if (is_on_cooldown("use_mp")) {

        if (mp_pot_one_index == -1) {
            send_cm(merchant, {
                message: "pot_request",
            })
        } else {
            mp_pot_quantity = character.items[mp_pot_one_index].q;

            if (mp_pot_quantity < 250) {
                send_cm(merchant, {
                    message: "pot_request",
                })
            }
        }

        return
    } 
        
    if (mp_pot_one_index != -1) {

        if (character.mp < character.max_mp - 500) {
            use_skill("use_mp");
        }

    } else if (mp_pot_zero_index != -1) {
        if (character.mp < character.max_mp - 300) {
            use_skill("use_mp");
        }

    } else {
        if (character.mp < character.max_mp - 150) {
            use_skill("use_mp");
        }

        mp_pot_quantity = 0;

        send_cm(merchant, {
            message: "pot_request",
        })
    }
}

function total_inventory_quantity_item(item_name) {

    let quantity = 0;

    const items = character.items.filter((item) => item?.name === item_name);
    items.forEach((obj) => {
        quantity += obj.q;
    })

    return quantity;
}

function on_cm(name, data) {   
	if (!bots.includes(name)) {
		game_log("Unauthorized CM " + name);

	} else if (data.message === "location") {
        send_cm(merchant, {
            message: "location",
            x: character.x,
            y: character.y,
            map: character.map
        })
        
    } else if (data.message === "trade") {
        send_loot_to_merch()

    } else if (data.message === "party") {
        accept_party_invite(party_owner)
        
    } else if (data.message === "pot_awknowledgement") {
        send_cm(merchant, {
            message: "pot_info",
            hp_pot_quantity: total_inventory_quantity_item("hpot1"),
            mp_pot_quantity: total_inventory_quantity_item("mpot1"),
        })
    } else if (data.message === "touch_christmas_tree") {
        moving = true;
        touch_christmas_tree();
    }
}