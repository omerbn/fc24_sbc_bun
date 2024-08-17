import { BaseIterationFilter, Rarity } from "./index";
import STATS from "../stats";

export class RarityIterationFilter extends BaseIterationFilter<number, Rarity> {
    static RARITY_TO_FLAG = new Map([
        ["common", 0],
        ["rare", 1],
        ["chapmpions league?", 53],
        ["FUT EVO complete", 143],
        ["icon", 170],
    ]);
    static FLAG_TO_RARITY = (function (in_map) {
        const out_map = new Map();
        for (const [rarity, flag] of in_map) {
            out_map.set(flag, rarity);
        }
        return out_map;
    })(RarityIterationFilter.RARITY_TO_FLAG);


    private _functions: Map<string, (x: number) => boolean>;
    private _map: Map<string, number> = new Map();
    stats_name: string = "RarityFilter";

    constructor(requirement: Rarity | undefined) {
        super(requirement);
        this._functions = this._parse_rarities(requirement?.conditions);
        this._allowed_values = this._parse_allowed_rarities(requirement?.allowed_rarities);
        this._disallowed_values = this._parse_allowed_rarities(requirement?.disallowed_rarities);
    }

    private _parse_allowed_rarities(allowed_rarities: string[] | undefined): Set<number> {
        const set: Set<number> = new Set();
        if (!allowed_rarities) return set;
        for (const rare of allowed_rarities) {
            const flag = RarityIterationFilter.RARITY_TO_FLAG.get(rare);
            if (flag !== undefined) {
                set.add(flag);
            } else {
                console.error(`missing flag for ${rare}`);
            }
        }
        return set;
    }

    private _parse_rarities(required: object | undefined): Map<string, (x: number) => boolean> {
        const functions = new Map();
        if (!required) return functions;

        for (const rare_key in required) {
            const rare_value = required[rare_key];

            const op = rare_value.charAt(0);
            const val = rare_value.substring(1) | 0;
            switch (op) {
                case '<':
                    functions.set(rare_key, (found_value: number) => {
                        return found_value < val;
                    });
                    break;
                case '>':
                    functions.set(rare_key, (found_value: number) => {
                        return found_value > val;
                    });
                    break;
                case '=':
                    functions.set(rare_key, (found_value: number) => {
                        return found_value === val;
                    });
                    break;
                default:
                    console.log("missing rarity handler");
            }
        }
        return functions;
    }

    clear(): void {
        this._map.clear();
    }

    delete(obj: number): void {
        const rarity: string = RarityIterationFilter.FLAG_TO_RARITY.get(obj) || "unknown";
        const v = this._map.get(rarity) || 1;
        if (v === 1) {
            this._map.delete(rarity);
        } else {
            this._map.set(rarity, v - 1);
        }
    }

    try_add(obj: number): boolean {
        // player.rareflag

        // count by rarity
        const rarity: string = RarityIterationFilter.FLAG_TO_RARITY.get(obj) || "unknown";
        let v = this._map.get(rarity);
        if (!v) {
            v = 1;
        } else {
            v++;
        }
        this._map.set(rarity, v);
        return true;
    }

    is_permutation_approved(permutation: number[]): boolean {
        if (!this._functions.size) return true;
        for (const [key, func] of this._functions) {
            const found_val = this._map.get(key) || 0;
            if (!func(found_val)) {
                STATS.get(this.stats_name).inc_discarded(`invalid`);
                return false;
            }
        }
        return true;
    }

    protected get_field_name() {
        return "rareflag";
    }
}