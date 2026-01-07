let attack_mode = true
let hunting_list = ["bigbird", "grinch"];
let boss_list = ["grinch", "snowman"];
let mtype_list = hunting_list;
let merchant = "merchire";
let party_owner = "ryaaahs"
let party_seconds = 30;
let moving = false;
const charge_timer = 40;
let party_target = ["altfire", "ryaaahs", "merchire"]
let farm_party = ["ryaaahs", "altfire"];
const farming_location = {x: 1312.20, y: -99.96, map: "main"};
const elixir = "elixirluck";

add_top_button("real_x", "real_x: " + character.real_x.toFixed(2));
add_top_button("real_y", "real_y: " + character.real_y.toFixed(2));

smart_move(farming_location);

let bots = [
    "ryaaahs",
    "pbuffme",
    "learningad",
    "merchire"
]

let whitelist_items = [
	"tracker",
    "hpot0",
    "hpot1",
    "mpot0",
    "mpot1",
    "elixirluck",
    "luckbooster",
    "jacko",
    "rabbitsfoot",
    // "wattire",
    // "wgloves",
    // "wbreeches",
    // "wcap",
    // "wshoes"
]

let mp_pot_quantity = 0
let hp_pot_quantity = 0

let is_boss_location = false;
let is_preping_boss_move = false;
let event_boss = null;
let boss_timeout = null;
let boss_map = ""
let boss_coords = {x: 0, y: 0};

const RESPAWN_INTERVAL = 15 * 100; 
setInterval(function () { 
    if (character.rip) { respawn(); smart_move(farming_location); } 
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
//             smart_move(mtype_list[0]);
//             gather_mobs()
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

        if (!mob || mob.type !== "monster" || mob.dead) continue;
        
        // Farm arctic bees while waiting for snowman
        if (parent.S?.snowman?.live && mob.s?.fullguardx) {
            if (!mtype_list.includes("arcticbee")) mtype_list.push("arcticbee");
        } else {
            if (mob.mtype === "snowman" && !mob.s?.fullguardx) {
                if (mtype_list.includes("arcticbee")) mtype_list.pop();
            }
        }

        if (mtype_list.includes(mob.mtype) || mob.target === character.name) {
            targets.push(mob);
        }
    }
    
    targets = targets.sort((a, b) => {
        a_distance = distance(character, a);
        b_distance = distance(character, b);

        return a_distance - b_distance;
    }).slice(0, 10).reverse()

    return targets;
}


async function attack_loop(targets) { 

    if (targets.length === 0) return;

    change_target(targets[0]);

    for (const target of targets) {
        draw_circle(target.x, target.y, 20, 3, 0xE8FF00);
    }

    if (targets.length >= 1 && is_in_range(targets[0], "attack")) {
        

        let max_hp_targets = targets.filter((target) => target.hp === target.max_hp && distance(character, target) < character.range);

        if (max_hp_targets.length > 0) {
            draw_circle(max_hp_targets[0].x, max_hp_targets[0].y, 40, 3, 0xFFAAAA);

            if (can_attack(max_hp_targets[0])) {
                attack(max_hp_targets[0])
            }
        } else if (can_attack(targets[0])) {
            draw_circle(targets[0].x, targets[0].y, 40, 3, 0xFFAAAA);

            attack(targets[0])
        }
        
    } 
	// if (!is_in_range(targets[0])) {
	// 	// Walk half the distance
    //     move(character.x+(targets[0].x-character.x) / 2, character.y + (targets[0].y-character.y) / 2);
	// }
	// else if (can_attack(targets[0]) && get_target() != null) {
    //     let attack_result = "";
    //     let attack_error_result = "";

	// 	set_message("Attacking " + targets[0].mtype);
    //     await attack(targets[0]).then(result => {
    //         attack_result = result
    //     }).catch (err => {
    //         switch(err.reason) {
    //             case "not_there": // Its been killed / removed since our last poll.
    //                 game_log("Target not found", "yellow");
    //                 break;
    //             case "cooldown"://Attack is on cool down.
    //                 game_log("Attack is on cooldown.", "yellow");
    //                 break;
    //             case "too_far":
    //                 game_log("Target is out of range.", "yellow");
    //                 break;
    //             case "no_mp":
    //                 game_log("We're OOM!", "blue");
    //                 check_for_mp();
    //                 break;
    //             default:
    //                 game_log("UNKNOWN ERROR, reason: "+err.reason, "red");
    //                 let errorLog = get("error_log") || [];
    //                 errorLog.push({
    //                     context: "attack",
    //                     time: Date.now(),
    //                     error: err,
    //                 });
    //                 set("error_log", errorLog);
                
    //         }
    //     })
		
    //     if (attack_error_result.reason === "too_far") move(character.x+(targets[0].x-character.x) / 2, character.y + (targets[0].y-character.y) / 2);
	// }
}

async function touch_christmas_tree() {
    await smart_move(({ x: 48, y: -62, map: "main" }));
	parent.socket.emit("interaction", {type:"newyear_tree"});
    await smart_move(farming_location);
    moving = false
    if (character.slots?.orb.name === "jacko") {
        await unequip("orb");
        await equip(locate_item("rabbitsfoot"), "offhand")
    }
    gather_mobs();
}

async function handleAbsorb() {
    try {
        // Absorb only works if you're in a party and the skill isn't on cooldown
        if (!character.party || is_on_cooldown("absorb")) return;

        // Get names of all party members except yourself
        const allies = Object.keys(get_party()).filter(name => name !== character.name);
        //if (parent.S?.grinch?.live) allies.push("earthPri");
        if (!allies.length) return; // No one to protect

        // Find a monster targeting one of your allies
        const badMob = Object.values(parent.entities).find(mob =>
            mob.type === "monster" &&
            mob.target &&
            allies.includes(mob.target)
        );

        // If no valid badMob found, stop
        if (!badMob) return;

        // Use absorb on the ally being targeted
        const ally = get_player(badMob.target);
        if (!ally || !is_in_range(ally, "absorb")) return;

        await use_skill("absorb", ally);
        game_log(`Absorbing ${badMob.target}`, "#FFA600");
    } catch (e) {
        console.log("Absorb error: ", e);
    }
}
setInterval(handleAbsorb, 100);

async function handle_curse() {
    try {
        if (is_on_cooldown("curse")) return;

        // Get all mobs
        let mobs = Object.values(parent.entities).filter(mob =>
            mob.type === "monster" &&
            mob.target
        );

        // Sort the mobs by hp
        mobs = mobs.sort((a, b) => {
            return a.hp > b.hp;
        }).reverse();

        await use_skill("curse", mobs[0]);
        game_log(`Cursing ${mobs[0].name}`, "#FFA600");
    }  catch (e) {
        console.log("Absorb error: ", e);
    }
}
setInterval(handle_curse, 100);

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

async function handle_scare() {
    try {
        if (is_on_cooldown("scare")) return;

        // Get all mobs
        let mobs = Object.values(parent.entities).filter(mob =>
            mob.type === "monster" &&
            mob.target === character.name
        );

        if (mobs.length < 3) return;

        await use_skill("scare");
        game_log(`Casting Scare`, "#FFA600");
    }  catch (e) {
        console.log("Scare error: ", e);
    }
}
//setInterval(handle_scare, 100);

setInterval(function () {
    loot();
}, 100);

async function gather_mobs() {
    await move(character.real_x - 50, character.real_y);
    await move(character.real_x, character.real_y - 50);
    await move(character.real_x + 50, character.real_y);
    await move(character.real_x, character.real_y + 50);
    if (!event_boss && !moving) gather_mobs()
}
// gather_mobs()

// Combat loop
setInterval(function(){
    let targets = null

    if (event_boss === "grinch") {
        targets = get_mob_targets();
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
            if (!is_on_cooldown("curse")) {
                use_skill("curse");
            }

            if (!is_on_cooldown("darkblessing")) {
                use_skill("darkblessing");
            }
        }
    } 

    check_for_party_hp();

    if (character.hp <= character.max_hp - character.heal + 750) {
        if (!is_on_cooldown("heal")) {
            heal(character);
        }
    }

    check_for_mp()
    check_for_hp()

    if (!smart.moving) {
        clear_drawings();
        draw_circle(character.x, character.y, character.range, 2, 0xFF0000);
        
        if (!is_on_cooldown("darkblessing")) {
            use_skill("darkblessing");
        }

        targets = get_mob_targets();
		
        attack_loop(targets);
    }
}, 1000 * 0.25); // Loops every 1/4 seconds.

setInterval(() => parent.socket.emit("send_updates", {}), 1000 * 30); // Update entity list to remove ghost mobs

async function check_for_party_hp() {
    // check for allies hp
    // if hp < 60, spam heal till > 90% then stop
    if (character.hp < (character.max_hp * 0.2)) {
        
        while (true) {
            if (!is_on_cooldown("partyheal")) {
                await use_skill("partyheal");
            }

            if (character.hp > (character.max_hp * 0.9)) break;
        }
    }

    for (const member of party_target) {
        let party_member = get_player(member);
        if (party_member === null) return;
		
        if (party_member.hp < (party_member.max_hp * 0.8)) {
            if (!is_on_cooldown("heal")) {
                heal(party_member);
            }
        }

        if (party_member.hp < (party_member.max_hp * 0.4)) {
            while (true) {
                if (!is_on_cooldown("partyheal")) {
                    await use_skill("partyheal");
                }

                party_member = get_player(member);

                if (party_member.hp > (party_member.max_hp * 0.9)) break;
            }
        }
    } 
}

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

async function on_cm(name, data) {   
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
        if (!is_on_cooldown("scare")) {
            if (character.slots?.orb.name === "rabbitsfoot") {
                await unequip("orb");
                await equip(locate_item("jacko"), "offhand")
            }
            await use_skill("scare");    
        }

        touch_christmas_tree();
    }
}