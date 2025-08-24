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
    
    // Optimization: Load all data in parallel
    const [players_promise, metadata_promise, skipped_promise, hinted_promise] = await Promise.allSettled([
        load_players_optimized(),
        load_metadata_optimized(),
        load_skipped_players_file(),
        load_hinted_players_file()
    ]);
    
    // Handle results
    if (players_promise.status === 'fulfilled') {
        player_data.club = players_promise.value;
    } else {
        throw new Error(`Failed to load players: ${players_promise.reason}`);
    }
    
    if (metadata_promise.status === 'fulfilled') {
        player_data.meta_data = metadata_promise.value;
    } else {
        throw new Error(`Failed to load metadata: ${metadata_promise.reason}`);
    }
    
    if (skipped_promise.status === 'fulfilled') {
        player_data.skipped = new Set(skipped_promise.value.map((x: SupportPlayerInformation) => x.id));
        if (skipped_promise.value.length) {
            console.log(`${skipped_promise.value.length} skipped players loaded`);
        }
    }
    console.log(player_data.club.length, "players in db");

    // Optimization: Combined filtering and enrichment in single pass
    const enriched_players: Player[] = [];
    const player_lookup = new Map<number, Player>(); // Optimization: Create player lookup map for O(1) access

    for (const player of player_data.club) {
        // Skip filtered players early
        if ((player.loans && player.loans > 0) || player_data.skipped.has(player.id)) {
            continue;
        }

        // for O(1) access
        player_lookup.set(player.id, player);
        
        // Enrich player data
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
        
        enriched_players.push(player);
    }
    
    player_data.club = enriched_players;

    // Optimization: Sort using more efficient comparison
    player_data.club.sort((a, b) => a.rating - b.rating);

    // Process hinted players
    if (hinted_promise.status === 'fulfilled') {
        const hinted_data = hinted_promise.value;
        if (hinted_data.length) {
            console.log(`${hinted_data.length} hinted players loaded`);
        }
        
        for (const p of hinted_data) {
            const player = player_lookup.get(p.id);
            if (!player) {
                throw new Error(`Player with id=${p.id} not found`);
            }
            player_data.hinted.add(player);
        }
    }

    console.log("players loaded.", player_data.club.length, "usage players");
    return player_data;
}

// Optimized helper functions
async function load_players_optimized(): Promise<Player[]> {
    const file = Bun.file(CLUB_PLAYERS_FILES);
    const json: PlayersFileFormat = await file.json();
    return json.itemData || [];
}

async function load_metadata_optimized(): Promise<Map<number, MD>> {
    const file = Bun.file(PLAYERS_MD_FILE);
    const json = await file.json();
    const metadata = new Map<number, MD>();
    
    // Combine both arrays in single pass
    const all_players = [...(json.LegendsPlayers || []), ...(json.Players || [])];
    for (const player of all_players) {
        metadata.set(player.id, player);
    }
    
    return metadata;
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
