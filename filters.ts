import { Player, SupportPlayerInformation } from "./data/i";
import STATS from "./stats";
import { NonDistinctIterationFilter } from "./permutations";
import { SearchQuery } from "./filters/index";
import { ChemistryAndDistinctIterationFilter } from "./filters/chemistry";
import { RatingIterationFilter } from "./filters/ratings";
import { LeagueTeamNationIterationFilter } from "./filters/lnt";
import { RarityIterationFilter } from "./filters/rarity";
import { DatasetFilterFlow } from "./filters/flow";

export class SearchFilter {
    private _query: SearchQuery;

    constructor(query: SearchQuery) {
        this._query = query;
    }

    private _prepare_by_positions(players: Player[]): Player[][] {
        let final_array: Player[][];
        let hint_players_to_find_set: Set<Player> = new Set(Array.from(this._query.hinted_players ? this._query.hinted_players: []));
        if (this._query.allow_random_positions) {
            if (this._query.hinted_players) {
                for (const player of players) {
                    if (this._query.hinted_players.has(player)) {
                        hint_players_to_find_set.delete(player);
                    }
                }
            }

            final_array = this._query.positions.map(() => {
                return players;
            });
        } else {
            const map_players_by_req_positions = new Map();
            for (const pl of players) {
                for (const pl_pos of pl.possiblePositions) {
                    if (this._query.positions.indexOf(pl_pos) !== -1) {
                        const by_pos = try_add_key(map_players_by_req_positions, pl_pos, () => { return []; });
                        by_pos.push(pl);
                    }
                }
                if (this._query.hinted_players && this._query.hinted_players.size && this._query.hinted_players.has(pl)) {
                    hint_players_to_find_set.delete(pl);
                }
            }

            // filling back the array by position
            final_array = this._query.positions.map((pos) => {
                return map_players_by_req_positions.get(pos);
            });
        }

        if (hint_players_to_find_set.size) {
            for (const must_player of hint_players_to_find_set) {
                console.log(`Could not find must player: ${must_player.__name}`);
            }
            throw new Error("Could not find all must players in positions");
        }

        return final_array;
    }

    private _filter_by_player_rating(players: Player[]): Player[] {
        // reducing by ratings
        let starti = 0;
        let endi = players.length;
        if (this._query.ratings?.max_player || this._query.ratings?.min_player) {
            const array_of_ratings = players.map(x => x.rating);

            if (this._query.ratings.max_player) {
                let x = binary_search(array_of_ratings, this._query.ratings.max_player + 1);
                if (x === -1) {
                    x = players.length;
                }
                endi = x;
            }
            if (this._query.ratings.min_player) {
                starti = binary_search(array_of_ratings, this._query.ratings.min_player);
            }
            const removed_players = players.length - endi + starti;
            players = players.slice(starti, endi);
            console.log(`Filtered by player ratings: removed=${removed_players} players. Total players in current count=${endi - starti}`);
        }

        return players;
    }

    find(players: Player[]): Player[][] {
        const results: Player[][] = [];
        STATS.reset();
        if (this._query.max_running_time_ms) {
            STATS.start_timer(this._query.max_running_time_ms);
        }

        if (this._query.allow_random_positions && this._query.chemistry) {
            throw new Error("Random positions and chemistry are not supported");
        } else if (!this._query.chemistry) {
            this._query.allow_random_positions = true;
        }

        players = this._filter_by_player_rating(players);

        // must players
        if (this._query.hinted_players) {
            const not_found_players: Set<Player> = new Set();
            for (const player_info of this._query.hinted_players) {
                const foundp = players.find((player) => player.id === player_info.id);
                if (!foundp) {
                    not_found_players.add(player_info);
                }
            }
            if (not_found_players.size) {
                console.log("Could not find hinted players:");
                console.log(Array.from(not_found_players).map(x => x.__name));
                // if (prompt("Should continue? (y/n)") !== 'y') {
                //     return results;
                // }
            }
        }

        // filtering by positions
        const all_players_by_positions: Player[][] = this._prepare_by_positions(players).filter((players, index) => {
            if (players) return true;
            console.log(`could not fill-in position: ${this._query.positions[index]}`);
            return false;
        });
        if (all_players_by_positions.length !== this._query.positions.length) {
            return results;
        }

        // must players or all
        const datasets_of_players_by_position: Player[][][] = [];
        if (this._query.hinted_players && this._query.hinted_players.size) {
            const hint_players_arr = Array.from(this._query.hinted_players);
            if (this._query.allow_random_positions) {
                // inserting desired players to some positions
                const new_dataset: Player[][] = all_players_by_positions.map((players, index) => {
                    if (index < hint_players_arr.length) {
                        return [hint_players_arr[index]];
                    } else {
                        return players.filter((player: Player) => {
                            return this._query.hinted_players && !this._query.hinted_players.has(player);
                        });
                    }
                });
                console.log(`Filtered hinted-players by position - 1 permutation`);
                datasets_of_players_by_position.push(new_dataset);
            } else {
                // positions matter


                // building all permutations of all positions
                const all_positions = hint_players_arr.map((player) => {
                    return player.possiblePositions;
                });
                // creating all permutations
                for (const permutated_positions of (new NonDistinctIterationFilter<string>()).generate_permutations(all_positions)) {
                    // trying to match all permutations their place in the squad
                    const used_positions: number[] = new Array(11).fill(0);

                    let total_found_positions = 0;
                    for (let i = 0; i < permutated_positions.length; i++) {
                        const pos = permutated_positions[i];
                        let j = 0;
                        for (; j < this._query.positions.length; j++) {
                            if (used_positions[j] === 0 && this._query.positions[j] === pos) {
                                used_positions[j] = hint_players_arr[i].id;
                                break;
                            }
                        }
                        if (j === this._query.positions.length) {
                            break;
                        } else {
                            total_found_positions++;
                        }
                    }

                    // building the permutation
                    if (total_found_positions === permutated_positions.length) {
                        const new_dataset: Player[][] = all_players_by_positions.map((players, index) => {
                            if (used_positions[index] === 0) {
                                return players;
                            } else {
                                return players.filter((player) => player.id === used_positions[index]);
                            }
                        });
                        datasets_of_players_by_position.push(new_dataset);
                    }
                }
                if (datasets_of_players_by_position.length) {
                    console.log(`Filtered hinted-players by position - ${datasets_of_players_by_position.length} permutations`);
                } else {
                    console.log(`Could not find any permutation with hinted-players`);
                }
            }
        }

        // adding all players by positions
        if (!this._query.hinted_players_are_must) {
            datasets_of_players_by_position.push(all_players_by_positions);
        }
        console.log("Prepared datasets");

        // all other filters
        const first_filter: DatasetFilterFlow = new DatasetFilterFlow();
        let last_filter: DatasetFilterFlow = first_filter;
        if (this._query.rarity) {
            last_filter = last_filter.set_next(new DatasetFilterFlow(new RarityIterationFilter(this._query.rarity)));
        }
        if (this._query.nations) {
            last_filter = last_filter.set_next(new DatasetFilterFlow(new LeagueTeamNationIterationFilter(this._query.nations, "nation")));
        }
        if (this._query.leagues) {
            last_filter = last_filter.set_next(new DatasetFilterFlow(new LeagueTeamNationIterationFilter(this._query.leagues, "leagueId")));
        }
        if (this._query.teams) {
            last_filter = last_filter.set_next(new DatasetFilterFlow(new LeagueTeamNationIterationFilter(this._query.teams, "teamid")));
        }
        if (this._query.ratings &&
            (
                !!this._query.ratings.max_squad ||
                !!this._query.ratings.min_squad ||
                !!this._query.ratings.max_bronze ||
                !!this._query.ratings.min_bronze ||
                !!this._query.ratings.max_silver ||
                !!this._query.ratings.min_silver ||
                !!this._query.ratings.min_gold ||
                !!this._query.ratings.max_gold
            )) {
            last_filter = last_filter.set_next(new DatasetFilterFlow(new RatingIterationFilter(this._query.ratings)));
        }

        console.log("Searching...");
        for (const result of this._search(datasets_of_players_by_position, first_filter)) {
            const should_continue: boolean = this._process_new_result(results, result);
            if (!should_continue) break;
            if (STATS.has_timer_expired()) {
                break;
            }
        }

        return results;
    }

    private _process_new_result(results: Player[][], result_permutation_must_clone: Player[]): boolean {
        results.push([...result_permutation_must_clone]);
        if (this._query.max_results && this._query.max_results === results.length) {
            return false;
        } else if (this._query.max_running_time_ms && results.length >= 1 * 10 ** 6) {
            console.log("Reached 1,000,000 matches, stopping...");
            return false;
        } else if (this._query.max_running_time_ms && STATS.timer_elapsed_ms() > (1000 * 60) && results.length >= 100000) {
            console.log("Reached 100,000 matches, stopping...");
            return false;
        }

        return true;
    }

    private *_search(datasets_of_players_by_position: Player[][][], filter_flow: DatasetFilterFlow) {
        const unique_squads = new Set<string>();
        const chemistry_filter = new ChemistryAndDistinctIterationFilter(this._query.chemistry, this._query.positions);
        for (let i = 0; i < datasets_of_players_by_position.length; i++) {
            console.log(`Scanning dataset ${i + 1}/${datasets_of_players_by_position.length}`);
            const dataset = datasets_of_players_by_position[i];
            for (const permutation of filter_flow.run(dataset)) {
                for (const player_permutation of chemistry_filter.generate_permutations(permutation)) {
                    const ids = player_permutation.map((player) => player.id).sort((a, b) => a - b);
                    ids.sort((a, b) => a - b);
                    const key = ids.join(',');
                    if (unique_squads.has(key)) {
                        STATS.get("ChemistryFilter").inc_discarded("duplicate");
                        continue;
                    }

                    unique_squads.add(key);
                    yield player_permutation;
                }
            }

            // found from non-default dataset
            if (unique_squads.size && i !== datasets_of_players_by_position.length - 1) {
                break;
            }
        }
    }
}

export function binary_search(arr: number[], target: number): number {
    let left = 0;
    let right = arr.length - 1;
    let result = -1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (arr[mid] === target) {
            // Track the lowest index of the target
            result = mid;
            right = mid - 1; // Continue searching in the left half
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    if (result !== -1) {
        // If the exact value was found, return the lowest index
        return result;
    }

    // If the exact value was not found, find the next higher value
    if (left < arr.length) {
        return left; // `left` will be the index of the next higher value
    }

    // If no higher value exists
    return -1;
}


function try_add_key(map: Map<any, any>, key: any, default_value_func: Function) {
    let v = map.get(key);
    if (v === undefined) {
        v = default_value_func();
        map.set(key, v);
    }
    return v;
}