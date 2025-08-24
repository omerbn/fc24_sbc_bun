import { Chemistry } from "./index";
import { Player } from "../data/i";
import STATS from "../stats";
import { DistinctIterationFilter } from "../permutations";

export class ChemistryAndDistinctIterationFilter extends DistinctIterationFilter<Player> {
    stats_name: string = "ChemistryFilter";
    private _positions: string[];
    private _requirement: Chemistry | undefined;
    
    // Optimization: Incremental chemistry tracking
    private _team_counts = new Map<number, number>();
    private _nation_counts = new Map<number, number>();
    private _league_counts = new Map<number, number>();

    constructor(requirement: Chemistry | undefined, positions: string[]) {
        super();
        this._requirement = requirement;
        this._positions = positions;
    }

    clear(): void {
        super.clear();
        this._team_counts.clear();
        this._nation_counts.clear();
        this._league_counts.clear();
    }

    delete(obj: Player): void {
        super.delete(obj);
        this._decrement_count(this._team_counts, obj.teamid);
        this._decrement_count(this._nation_counts, obj.nation);
        this._decrement_count(this._league_counts, obj.leagueId);
        // Note: Chemistry will be recalculated in is_permutation_approved for accuracy
    }

    try_add(obj: Player): boolean {
        if (!super.try_add(obj)) return false;
        
        this._increment_count(this._team_counts, obj.teamid);
        this._increment_count(this._nation_counts, obj.nation);
        this._increment_count(this._league_counts, obj.leagueId);
        
        return true;
    }
    
    private _increment_count(map: Map<number, number>, key: number): void {
        map.set(key, (map.get(key) || 0) + 1);
    }
    
    private _decrement_count(map: Map<number, number>, key: number): void {
        const count = map.get(key) || 0;
        if (count <= 1) {
            map.delete(key);
        } else {
            map.set(key, count - 1);
        }
    }

    is_permutation_approved(permutation: Player[]): boolean {
        if (!super.is_permutation_approved(permutation)) return false;
        if (!this._requirement) return true;

        // Optimization: Use pre-computed counts instead of recalculating
        const total_chemistry = this._calculate_total_chemistry_optimized(permutation, permutation.length);
        if (total_chemistry === -1) {
            STATS.get(this.stats_name).inc_discarded(`min_points_for_each_player>value`);
            return false;
        }

        if (this._requirement?.min_squad && total_chemistry < this._requirement.min_squad) {
            STATS.get(this.stats_name).inc_discarded(`min_squad>total_keys`);
            return false;
        }

        return true;
    }
    
    can_potentially_complete(partial_permutation: Player[], size: number, remaining_positions: number): boolean {
        if (!super.can_potentially_complete(partial_permutation, size, remaining_positions)) return false;
        if (!this._requirement) return true;
        
        // Early chemistry check: calculate maximum possible chemistry
        const current_chemistry = this._calculate_total_chemistry_optimized(partial_permutation, size);
        if (current_chemistry === -1) { 
            STATS.get(this.stats_name).inc_discarded(`min_points_for_each_player>value`);
            return false;
        }
        const max_possible_chemistry = current_chemistry + (remaining_positions * 3); // max 3 per position
        
        if (this._requirement?.min_squad && max_possible_chemistry < this._requirement.min_squad) {
            STATS.get(this.stats_name).inc_discarded(`early_prune_chemistry`);
            return false;
        }
        
        return true;
    }
    
    private _calculate_total_chemistry_optimized(permutation: Player[], size: number): number {
        let total_chemistry = 0;
        
        for (let i = 0; i < permutation.length; i++) {
            const player = permutation[i];
            let player_chemistry = 0;

            // only in-position players contribute to chemistry
            if (player.possiblePositions.indexOf(this._positions[i]) !== -1) {
                // Use pre-computed counts for efficiency
                const team_value: number = this._team_counts.get(player.teamid) || 0;
                const nation_value: number = this._nation_counts.get(player.nation) || 0;
                const league_value: number = this._league_counts.get(player.leagueId) || 0;

                // team chemistry
                if (team_value >= 7) {
                    player_chemistry += 3;
                } else if (team_value >= 4) {
                    player_chemistry += 2;
                } else if (team_value >= 2) {
                    player_chemistry += 1;
                }

                // nation chemistry
                if (nation_value >= 8) {
                    player_chemistry += 3;
                } else if (nation_value >= 5) {
                    player_chemistry += 2;
                } else if (nation_value >= 2) {
                    player_chemistry += 1;
                }

                // league chemistry
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

            // Early exit for individual player requirements
            if (this._requirement?.min_points_for_each_player && player_chemistry < this._requirement.min_points_for_each_player) {
                STATS.get(this.stats_name).inc_discarded(`min_points_for_each_player>value`);
                return -1; // Signal failure
            }
        }

        return total_chemistry;
    }
}