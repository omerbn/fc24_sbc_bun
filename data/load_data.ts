import path from "path";
import { PlayerData, Player, PlayersFileFormat, MD, SupportPlayerInformation } from "./i";
import { load_hinted_players_file, load_skipped_players_file, refresh_support_files } from "../support/support";

const PLAYERS_MD_FILE = path.join(process.cwd(), "data/meta_data.json");
const CLUB_PLAYERS_FILES = path.join(process.cwd(), "data/players.json");


export async function refresh_data(token: string): Promise<any> {
    const players = [];
    for (let i = 0; i < 700; i += 100) {
        await refresh_player_list(token, i, players);
    }

    Bun.write(CLUB_PLAYERS_FILES, JSON.stringify({ itemData: players }, null, 2));
    console.log("Players list updated:", players.length, "players");

    // refreshing support files
    await refresh_support_files(players);
}

export async function load_data(): Promise<PlayerData> {
    const player_data: PlayerData = {
        club: [],
        meta_data: new Map(),
        skipped: new Set(),
        hinted: new Set()
    };
    const ps: Promise<any>[] = [];
    read_players_file(ps, player_data.club);
    read_md_file(ps, player_data.meta_data);
    ps.push(load_skipped_players_file().then((json: SupportPlayerInformation[]) => {
        player_data.skipped = new Set(json.map((x) => x.id));
        if (json.length) {
            console.log(`${json.length} skipped players loaded`);
        }
    }));
    await Promise.all(ps);
    console.log(player_data.club.length, "players in db");

    // filtering out players with loans and skipped
    player_data.club = player_data.club.filter((p) => {
        return (!p.loans || p.loans == 0) && !player_data.skipped.has(p.id);
    });

    // custom attributes
    for (const player of player_data.club) {
        const n: MD | undefined = player_data.meta_data.get(player.assetId);
        if (!n) {
            throw new Error(`Player with assetId=${player.assetId} not found in meta_data`);
        }
        player.__name = n.c || `${n.f} ${n.l}`;
        player.__nickname = n.c || "";
        player.__fullname = `${n.f} ${n.l}`;

        player.__rating = player.rating;
        if (player.academyAttributes) {
            const academy_info = player.academyAttributes.find((x) => x.id === player.pile);
            if (academy_info) {
                player.rating = academy_info.totalBonus;
                console.log(`Player ${player.__name} has academy bonus. New rating: ${academy_info.totalBonus}`);
            }
        }
    }

    // sorting players by rating
    player_data.club.sort((a, b) => {
        return a.rating - b.rating;
    });

    // hinted players
    const json: SupportPlayerInformation[] = await load_hinted_players_file();
    if (json.length) {
        console.log(`${json.length} hinted players loaded`);
    }
    for (const p of json) {
        const player = player_data.club.find((x) => x.id === p.id);
        if (!player) {
            throw new Error(`Player with id=${p.id} not found`);
        }
        player_data.hinted.add(player);
    }

    console.log("players loaded.", player_data.club.length, "usage players");
    return player_data;
}

function refresh_player_list(token: string, start: number, arr: Player[]): Promise<any> {
    return fetch("https://utas.mob.v2.prd.futc-ext.gcp.ea.com/ut/game/fc24/club", {
        "headers": {
            "accept": "*/*",
            "accept-language": "he-IL,he;q=0.9",
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-ut-sid": token,
            "Referer": "https://www.ea.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": JSON.stringify({
            "count": 100, "searchAltPositions": true, "sort": "desc", "sortBy": "value", "start": start, "type": "player"
        }),
        "method": "POST",
        "redirect": "follow"
    }).then((response) => {
        return response.json();
    }).then((json: PlayersFileFormat) => {
        if (!json) {
            console.log("No data received for start=", start);
            return;
        }
        for (let i of json.itemData) {
            arr.push(i);
        }
    });
}


function read_players_file(ps: Promise<any>[], arr: Player[]) {
    // const glob = new Glob(CLUB_PLAYERS_FILES);
    // const folder = "./data";
    // for (const file of glob.scanSync(folder)) {
    //     ps.push(read_players_file(`${folder}/${file}`, arr));
    // }
    const pr = Bun.file(CLUB_PLAYERS_FILES).json().then((json: PlayersFileFormat) => {
        for (let i of json.itemData) {
            arr.push(i);
        }
    });
    ps.push(pr);
}

// function read_players_file(fn: string, output_arr: Player[]): Promise<any> {
//     return Bun.file(fn).json().then((json: PlayersFileFormat) => {
//         for (let i of json.itemData) {
//             output_arr.push(i);
//         }
//     });
// }

function read_md_file(ps: Promise<any>[], out_map: Map<number, MD>) {
    const pr = Bun.file(PLAYERS_MD_FILE).json().then((json) => {
        for (let d of json.LegendsPlayers) {
            out_map.set(d.id, d);
        }
        for (let d of json.Players) {
            out_map.set(d.id, d);
        }
    });
    ps.push(pr);
}
