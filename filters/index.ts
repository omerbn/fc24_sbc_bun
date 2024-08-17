import { Player, SupportPlayerInformation } from "../data/i";
import { IterationFilter } from "../permutations";

export interface AmountFilter {
    total?: number;
    min?: number;
    max?: number;
}

export interface MinMax {
    max_player?: number,
    min_player?: number,
    min_squad?: number,
    max_squad?: number
}

export interface Rarity extends MinMax {
    disallowed_rarities?: string[],
    allowed_rarities?: string[],
    conditions?: object
}

export interface Chemistry {
    min_points_for_each_player?: number,
    min_squad?: number
}

export interface Ratings extends MinMax {
    min_bronze?: number,
    max_bronze?: number,
    min_silver?: number,
    max_silver?: number,
    min_gold?: number,
    max_gold?: number,
}

export interface LeagueNationTeamRequirement {
    exact_in_squad?: number,
    min_in_squad?: number,
    max_in_squad?: number,

    max_players_from_same?: number
    min_players_from_same?: number,
    exact_players_from_same?: number
}
export interface SearchQuery {
    group?: string,
    name: string,
    positions: string[],
    leagues?: LeagueNationTeamRequirement,
    nations?: LeagueNationTeamRequirement,
    teams?: LeagueNationTeamRequirement,
    ratings?: Ratings,
    chemistry?: Chemistry,
    rarity?: Rarity,
    quality?: object,
    hinted_players?: Set<Player>;
    hinted_players_are_must?: boolean;

    max_results?: number;
    max_running_time_ms?: number;
    allow_random_positions?: boolean;
}

export abstract class BaseIterationFilter<ValueType, RequirementType> extends IterationFilter<ValueType> {
    protected stats_name: string = "";
    protected _requirement: RequirementType | undefined;
    protected abstract get_field_name(): string;

    protected _allowed_values: Set<ValueType> = new Set();
    protected _disallowed_values: Set<ValueType> = new Set();

    constructor(requirement: RequirementType | undefined) {
        super();
        this._requirement = requirement;
    }

    no_requirements() {
        return !this._requirement;
    }

    private _reduce(initial_ds: Player[][]): ValueType[][] {
        const field_name = this.get_field_name();

        return initial_ds.map((players) => {
            const set: Set<ValueType> = new Set();
            for (const player of players) {
                const field_value = player[field_name];
                // if we can reduce by allowed values
                if (this._allowed_values.size && !this._allowed_values.has(field_value)) {
                    continue;
                } else if (this._disallowed_values.size && this._disallowed_values.has(field_value)) {
                    continue;
                } else {
                    set.add(field_value);
                }
            }
            return set;
        }).map((set) => {
            return Array.from(set) as ValueType[];
        });
    }

    private _convert_reduced_to_dataset(reduced: ValueType[], initial_ds: Player[][]): Player[][] {
        const field_name = this.get_field_name();
        return initial_ds.map((array, index) => {
            const group_value = reduced[index];
            return array.filter((player) => player[field_name] === group_value);
        });
    }

    * generate_players_permutations(dataset: Player[][]): Generator<Player[][]> {
        if (this.no_requirements()) {
            yield dataset;
            return;
        }

        // reducing array by field
        const reduced_array = this._reduce(dataset);

        // creating permutations
        for (const found_permutation of this.generate_permutations(reduced_array)) {
            yield this._convert_reduced_to_dataset(found_permutation, dataset);
        }
    }
}
