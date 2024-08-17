import { BaseIterationFilter, Ratings } from "./index";
import STATS from "../stats";

export class RatingIterationFilter extends BaseIterationFilter<number, Ratings> {
    stats_name: string = "RatingFilter";
    private _sum: number = 0;
    private _count: number = 0;
    private _bronze: number = 0;
    private _silver: number = 0;
    private _gold: number = 0;

    constructor(requirement: Ratings) {
        super(requirement);
    }

    clear(): void {
        this._sum = 0;
        this._count = 0;
        this._bronze = 0;
        this._silver = 0;
        this._gold = 0;
    }

    delete(obj: number): void {
        this._sum -= obj;
        this._count--;

        if (this._is_bronze(obj)) {
            this._bronze--;
        } else if (this._is_silver(obj)) {
            this._silver--;
        } else if (this._is_gold(obj)) {
            this._gold--;
        }
    }

    private _is_bronze(obj: number): boolean {
        return obj < 65;
    }

    private _is_silver(obj: number): boolean {
        return obj >= 65 && obj < 75;
    }

    private _is_gold(obj: number): boolean {
        return obj >= 75;
    }

    try_add(obj: number): boolean {
        if (!this._requirement) return true;

        if (this._is_bronze(obj)) {
            this._bronze++;
            if (this._requirement.max_bronze && this._bronze > this._requirement.max_bronze) {
                STATS.get(this.stats_name).inc_discarded(`max_bronze<total_keys`);
                return false;
            }
        } else if (this._is_silver(obj)) {
            this._silver++;
            if (this._requirement.max_silver && this._silver > this._requirement.max_silver) {
                STATS.get(this.stats_name).inc_discarded(`max_silver<total_keys`);
                return false;
            }
        } else if (this._is_gold(obj)) {
            this._gold++;
            if (this._requirement.max_gold && this._gold > this._requirement.max_gold) {
                STATS.get(this.stats_name).inc_discarded(`max_gold<total_keys`);
                return false;
            }
        }

        this._sum += obj;
        this._count++;
        return true;
    }

    is_permutation_approved(permutation: number[]): boolean {
        if (!this._requirement) return true;
        const avg = this._sum / this._count;
        if (this._requirement.min_squad && avg < this._requirement.min_squad) {
            STATS.get(this.stats_name).inc_discarded(`min_squad>total_keys`);
            return false;
        }
        if (this._requirement.max_squad && avg > this._requirement.max_squad) {
            STATS.get(this.stats_name).inc_discarded(`max_squad<total_keys`);
            return false;
        }

        if (this._requirement.min_bronze && this._bronze < this._requirement.min_bronze) {
            STATS.get(this.stats_name).inc_discarded(`min_bronze>total_keys`);
            return false;
        }

        if (this._requirement.min_silver && this._silver < this._requirement.min_silver) {
            STATS.get(this.stats_name).inc_discarded(`min_silver>total_keys`);
            return false;
        }

        if (this._requirement.min_gold && this._gold < this._requirement.min_gold) {
            STATS.get(this.stats_name).inc_discarded(`min_gold>total_keys`);
            return false;
        }

        return true;
    }

    protected get_field_name() {
        return "rating";
    }
}