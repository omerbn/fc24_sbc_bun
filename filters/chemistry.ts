import { Chemistry } from "./index";
import { Player } from "../data/i";
import STATS from "../stats";
import { DistinctIterationFilter } from "../permutations";

export class ChemistryAndDistinctIterationFilter extends DistinctIterationFilter<Player> {
    stats_name: string = "ChemistryFilter";
    private _positions: string[];
    private _requirement: Chemistry | undefined;

    constructor(requirement: Chemistry | undefined, positions: string[]) {
        super();
        this._requirement = requirement;
        this._positions = positions;
    }

    clear(): void {
        super.clear();
    }

    delete(obj: Player): void {
        super.delete(obj);
    }

    try_add(obj: Player): boolean {
        return super.try_add(obj);
    }

    is_permutation_approved(permutation: Player[]): boolean {
        if (!super.is_permutation_approved(permutation)) return false;
        if (!this._requirement) return true;

        let team_map: Map<number, number> = new Map();
        let nation_map: Map<number, number> = new Map();
        let league_map: Map<number, number> = new Map();
        // collecting data
        for (const player of permutation) {
            let v: number;

            v = team_map.get(player.teamid) || 0;
            team_map.set(player.teamid, v + 1);

            v = nation_map.get(player.nation) || 0;
            nation_map.set(player.nation, v + 1);

            v = league_map.get(player.leagueId) || 0;
            league_map.set(player.leagueId, v + 1);
        }

        // claculating chemistry
        let total_chemistry = 0;
        for (let i = 0; i < permutation.length; i++) {
            const player = permutation[i];
            let player_chemistry = 0;

            // only in-position players contribute to chemistry
            if (player.possiblePositions.indexOf(this._positions[i]) !== -1) {
                // values
                const team_value: number = team_map.get(player.teamid) || 0;
                const nation_value: number = nation_map.get(player.nation) || 0;
                const league_value: number = league_map.get(player.leagueId) || 0;

                // team
                if (team_value >= 7) {
                    player_chemistry += 3;
                } else if (team_value >= 4) {
                    player_chemistry += 2;
                } else if (team_value >= 2) {
                    player_chemistry += 1;
                }

                // nation
                if (nation_value >= 8) {
                    player_chemistry += 3;
                } else if (nation_value >= 5) {
                    player_chemistry += 2;
                } else if (nation_value >= 2) {
                    player_chemistry += 1;
                }

                // league
                if (league_value >= 8) {
                    player_chemistry += 3;
                } else if (league_value >= 5) {
                    player_chemistry += 2;
                } else if (league_value >= 3) {
                    player_chemistry += 1;
                }

                // max value is 3
                player_chemistry = Math.min(3, player_chemistry);
                total_chemistry += player_chemistry;
            }

            if (this._requirement.min_points_for_each_player && player_chemistry < this._requirement.min_points_for_each_player) {
                STATS.get(this.stats_name).inc_discarded(`min_points_for_each_player>value`);
                return false;
            }
        }

        if (this._requirement.min_squad && total_chemistry < this._requirement.min_squad) {
            STATS.get(this.stats_name).inc_discarded(`min_squad>total_keys`);
            return false;
        }

        return true;
    }
}