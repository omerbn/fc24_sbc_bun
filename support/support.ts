import path from "node:path";
import { Player, SupportPlayerInformation } from "../data/i";
import { load_data } from "../data/load_data";

const HINTED_PLAYERS_FILE = path.join(process.cwd(), "support/hinted_players.json");
const SKIPPED_PLAYERS_FILE = path.join(process.cwd(), "support/skipped_players.json");

export function load_skipped_players_file() {
    return load_file(SKIPPED_PLAYERS_FILE);
}

export function load_hinted_players_file() {
    return load_file(HINTED_PLAYERS_FILE);
}

export function deaccent(str: string): string {
    return str.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export async function refresh_support_files(db: Player[]) {
    await refresh_list(SKIPPED_PLAYERS_FILE, db);
    await refresh_list(HINTED_PLAYERS_FILE, db);
}

async function refresh_list(fn: string, db: Player[]) {
    let list: SupportPlayerInformation[] = await load_file(fn);
    let len = list.length;
    list = list.filter((x) => {
        return db.find((y) =>
            y.id === x.id
        );
    });
    let len2 = list.length;
    if (len2 !== len) {
        save_file(fn, list);
        console.log("Removed", (len - len2), "from", fn);
    } else {
        console.log(fn, "without a change");
    }
}

export function skipped_players() {
    return main_loop(SKIPPED_PLAYERS_FILE);
}

export function hinted_players() {
    return main_loop(HINTED_PLAYERS_FILE);
}

async function main_loop(fn: string) {
    const json = await load_file(fn);
    const data = await load_data();

    while (true) {
        let input = prompt("Write player's name or id(s) ('q' to quit): ");
        if (!input) continue;
        input = deaccent(input.trim().toLowerCase());
        if (input == 'q') break;
        if (input.startsWith("#")) {
            const ids = input.slice(1).split(" ").map((x) => parseInt(x));
            for (const id of ids) {
                for (const pl of data.club) {
                    if (pl.id !== id) continue;
                    add_player_to_file(fn, json, pl);
                    break;
                }
            }
            continue;
        }

        const results: Player[] = [];
        for (const pl of data.club) {
            const should_add = deaccent(pl.__name.toLowerCase()).includes(input)
                || deaccent(pl.__nickname.toLowerCase()).includes(input)
                || deaccent(pl.__fullname.toLowerCase()).includes(input);
            if (should_add) {
                results.push(pl);
            }
        }

        if (!results.length) {
            console.log("No results found");
            console.log();
            continue;
        }

        // finding relevant players
        console.log(`${results.length} Results:`);
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            console.log(`#${r.id} ${i + 1}. ${r.__name} (${r.rating})`);
        }
        const pick: string | null = prompt("Write player's index: ");
        if (!pick) continue;
        const int_pick: number = parseInt(pick);
        if (isNaN(int_pick) || int_pick < 1 || int_pick > results.length) {
            console.log("Invalid index");
            console.log();
            continue;
        }
        add_player_to_file(fn, json, results[int_pick - 1]);
        console.log();
    }
}


function add_player_to_file(fn: string, players_json: SupportPlayerInformation[], player: Player) {
    players_json.push({
        assetId: player.assetId,
        name: player.__name,
        rating: player.rating,
        id: player.id
    });
    save_file(fn, players_json);
    console.log("Player added to list");
}

export function save_file(fn: string, data: SupportPlayerInformation[]) {
    Bun.write(fn, JSON.stringify(data, null, 2));
}


function load_file(fn: string) {
    return Bun.file(fn).json();
}


