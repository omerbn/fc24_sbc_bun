import { BaseIterationFilter, LeagueNationTeamRequirement } from "./index";
import STATS from "../stats";

export class LeagueTeamNationIterationFilter extends BaseIterationFilter<number, LeagueNationTeamRequirement> {
    stats_name: string;
    private _map: Map<number, number> = new Map();
    private _field_name: string;

    constructor(requirement: LeagueNationTeamRequirement | undefined, field_name: string) {
        super(requirement);
        this._field_name = field_name;
        this.stats_name = `${field_name}Filter`;
    }

    clear(): void {
        this._map.clear();
    }

    delete(obj: number): void {
        const v: number = this._map.get(obj) || 1;
        if (v === 1) {
            this._map.delete(obj);
        } else {
            this._map.set(obj, v - 1);
        }
    }

    try_add(obj: number): boolean {
        if (!this._requirement) return true;
        let v: number = this._map.get(obj) || 0;
        const total_number_of_keys = this._map.size;
        if (v === 0) {
            // new key
            if (this._requirement.exact_in_squad && total_number_of_keys === this._requirement.exact_in_squad) {
                STATS.get(this.stats_name).inc_discarded(`exact_in_squad<total_keys`);
                return false;
            }
            if (this._requirement.max_in_squad && total_number_of_keys === this._requirement.max_in_squad) {
                STATS.get(this.stats_name).inc_discarded(`max_in_squad<total_keys`);
                return false;
            }

            this._map.set(obj, 1);
        } else {
            // existing key
            if (this._requirement.exact_players_from_same && v === this._requirement.exact_players_from_same) {
                STATS.get(this.stats_name).inc_discarded(`exact_players_from_same<value`);
                return false;
            }
            if (this._requirement.max_players_from_same && v === this._requirement.max_players_from_same) {
                STATS.get(this.stats_name).inc_discarded(`max_players_from_same<value`);
                return false;
            }
            this._map.set(obj, v + 1);
        }

        return true;
    }

    is_permutation_approved(permutation: number[]): boolean {
        if (!this._requirement) return true;
        if (this._requirement.exact_in_squad && this._map.size !== this._requirement.exact_in_squad) {
            STATS.get(this.stats_name).inc_discarded(`exact_in_squad!==total_keys`);
            return false;
        }
        if (this._requirement.min_in_squad && this._map.size < this._requirement.min_in_squad) {
            STATS.get(this.stats_name).inc_discarded(`min_in_squad>total_keys`);
            return false;
        }

        for (const [_, value] of this._map) {
            if (this._requirement.exact_players_from_same && value !== this._requirement.exact_players_from_same) {
                STATS.get(this.stats_name).inc_discarded(`exact_players_from_same!==value`);
                return false;
            }

            if (this._requirement.min_players_from_same && value < this._requirement.min_players_from_same) {
                STATS.get(this.stats_name).inc_discarded(`min_players_from_same>value`);
                return false;
            }
        }
        return true;
    }

    protected get_field_name() {
        return this._field_name;
    }
}