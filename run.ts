import { PlayerData, Player, SupportPlayerInformation } from "./data/i";
import { load_data, refresh_data } from "./data/load_data";
import STATS from "./stats";
import { SearchFilter } from "./filters";
import { challenges } from "./challenges";
import { parseArgs } from "util";
import { hinted_players, skipped_players } from "./support/support";

// process.on("SIGINT", () => {
//     console.log("Received SIGINT");
//     process.exit();
// });
// process.on("SIGTERM", () => {
//     console.log("Received SIGTERM");
//     process.exit();
// });
// process.on("SIGABRT", () => {
//     console.log("Received SIGABRT");
//     process.exit();
// });

// nation url: https://www.ea.com/ea-sports-fc/ultimate-team/web-app/content/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fut/items/images/mobile/flags/card/45.png
// leagure url: https://www.ea.com/ea-sports-fc/ultimate-team/web-app/content/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fut/items/images/mobile/leagueLogos/dark/53.png
// team url: https://www.ea.com/ea-sports-fc/ultimate-team/web-app/content/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fut/items/images/mobile/clubs/dark/450.png
// (assert id) player picture url: https://www.ea.com/ea-sports-fc/ultimate-team/web-app/content/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fut/items/images/mobile/portraits/264095.png
// Request URL: https://utas.mob.v2.prd.futc-ext.gcp.ea.com/ut/game/fc24/club
/* {
    "count": 91,
    "searchAltPositions": true,
    "sort": "desc",
    "sortBy": "value",
    "start": 0,
    "type": "player"
} */

interface SortedResult {
    result: Player[],
    rating: number,
    rarity: number
}

function sort_matches_by_rating(results: Player[][], positions: string[]): SortedResult[] {
    const sorting_array: { rating: number, rarity: number, index: number }[] = new Array(results.length);
    for (let i = 0; i < results.length; i++) {
        const result: Player[] = results[i];
        sorting_array[i] = { rating: 0, rarity: 0, index: i };

        for (let j = 0; j < positions.length; j++) {
            const player = result[j];
            sorting_array[i].rating += player.rating;
            if (player.rareflag > 1) {
                sorting_array[i].rarity += (100 + player.rareflag);
            }
            if (player.untradeable) {
                sorting_array[i].rarity += 1000;
            }
        }
    }
    sorting_array.sort((a, b) => {
        if (a.rating === b.rating) {
            return a.rarity - b.rarity;
        } else {
            return b.rating - a.rating;
        }
    });

    const sorted_matches: SortedResult[] = [];
    for (const obj of sorting_array) {
        sorted_matches.push({ result: results[obj.index], rating: obj.rating, rarity: obj.rarity });
    }
    return sorted_matches;
}

function match_to_names(positions: string[], result: SortedResult) {
    const names: string[] = [];
    console.log("Result: Rating: ", result.rating, "Rarity: ", result.rarity);
    for (let i = 0; i < positions.length; i++) {
        const player = result.result[i];
        names.push(`#${player.id} ${positions[i]} ${player.__name} (${player.rating}) rarity=${player.rareflag} `);
    }
    console.log(names.join('\n'));
    console.log();
    console.log(result.result.map((p) => { return p.id }).join(', '));
}

function print_result(positions: string[], results: SortedResult[], index: number) {
    console.log(`Match ${STATS.pp(index + 1)} of ${STATS.pp(results.length)}`);
    match_to_names(positions, results[index]);
}

function get_args() {
    return parseArgs({
        args: Bun.argv,
        options: {
            skip: {
                type: 'string',
                default: '0'
            },
            name: {
                type: 'string'
            },
            time_s: {
                type: 'string',
                default: '10'
            },
            all: {
                type: 'boolean',
                default: false
            },
            token: {
                type: 'string',
                default: ''
            }
        },
        strict: true,
        allowPositionals: true,
    });
}


async function challenge(arg_values) {
    const db: PlayerData = await load_data();
    let to_skip: number = (function () {
        const x = parseInt(arg_values.skip || '0');
        if (isNaN(x)) {
            return 0;
        }
        return x;
    })();
    const max_running_time_ms: number = (function () {
        const x = parseInt(arg_values.time_s || '0');
        if (isNaN(x)) {
            return 0;
        }
        return x * 1000;
    })();

    for (const [_, challenge_query] of challenges) {
        if (arg_values.name &&
            !challenge_query.name.toLowerCase().includes(arg_values.name.toLowerCase()) &&
            !(challenge_query.group || "").toLowerCase().includes(arg_values.name.toLowerCase())
        ) {
            continue;
        }

        challenge_query.hinted_players = db.hinted;
        challenge_query.max_running_time_ms = max_running_time_ms;
        challenge_query.hinted_players_are_must = true;

        console.log();
        console.log("=====================================");
        console.log(`${challenge_query.name} (${challenge_query.group || ""})`);
        if (to_skip !== 0) {
            --to_skip;
            console.log(`Skipping`);
            continue;
        }
        // console.log(`query: ${JSON.stringify(challenge_query)}`);
        console.log("....");
        console.log(`Total players: ${STATS.pp(db.club.length)}`);


        const t0 = Date.now();
        const results = await new SearchFilter(challenge_query).find(db.club);
        const t1 = Date.now();
        STATS.print();
        console.log(`Found ${STATS.pp(results.length)} matches in ${t1 - t0}ms`);
        if (results.length !== 0) {
            console.log("Sorting matches...");
            const sorted_results: SortedResult[] = sort_matches_by_rating(results, challenge_query.positions);
            let index: number = 0;
            print_result(challenge_query.positions, sorted_results, index);
            console.log();

            // while input is not q:
            while (true) {
                const input = prompt("Enter 'q' to quit, 'n' for next challenge or any key for next match: >");
                if (input === 'q') {
                    process.exit();
                }
                if (input === 'n') {
                    console.log("removing selected players from next challenges")
                    for (let i = 0; i < results[index].length; i++) {
                        const player = results[index][i];
                        db.club = db.club.filter((p) => p.id !== player.id);
                    }
                    db.hinted.clear();
                    break;
                }
                index = (index + 1) % results.length;
                print_result(challenge_query.positions, sorted_results, index);
                console.log();
            }
        }
    }
}






// bun run.ts refresh --token "c1cb9f5a-5d21-4537-a363-fc5cb0b7vd7a"
// bun run.ts add_skip
// bun run.ts add_hint
// bun run.ts --time_s 120 --name "83+ totw" --all

await (async function main() {
    const { values: arg_values, positionals } = get_args();
    let command = positionals.length == 2 ? "challenge" : positionals[2];
    switch (command) {
        case "challenge":
            await challenge(arg_values);
            break;
        case "add_skip":
            await skipped_players();
            break;
        case "add_hint":
            await hinted_players();
            break;
        case "refresh":
            if (!arg_values.token) {
                throw new Error("Token is required");
            }
            await refresh_data(arg_values.token);
            break;
        default:
            console.log("Unknown command");
            process.exit();
    }
})();
