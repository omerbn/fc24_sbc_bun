import STATS from "./stats";

export abstract class IterationFilter<T> {
    protected stats_name: string;
    abstract clear(): void;
    abstract delete(obj: T): void;
    abstract try_add(obj: T): boolean
    abstract is_permutation_approved(permutation: T[]): boolean;
    
    // New: Early constraint checking hook
    abstract can_potentially_complete(partial_permutation: T[], size: number, remaining_positions: number): boolean;

    private _next_checkpoint: number = 200 * 10**6;
    // private _next_big_checkpoint: number = 500 * 10**6;

    private _indices: number[] = new Array(11);
    private _permutation: T[] = new Array(11);

    get get_stats_name(): string {
        return this.stats_name;
    }

    get_stats() {
        return STATS.get(this.stats_name);
    }

    * generate_permutations(by_positions_array: T[][]): Generator<T[]> {
        this._indices.length = by_positions_array.length;
        this._indices.fill(-1); // resetting state
        this._permutation.length = by_positions_array.length;
        const indices = this._indices;
        const permutation = this._permutation;
        const stats = STATS.get(this.stats_name);

        if (STATS.has_timer_expired()) {
            return;
        }
    
        // counting total permutations
        let total_permutations = BigInt(1);
        for (const arr of by_positions_array) {
            total_permutations *= BigInt(arr.length);
        }
        stats.inc_max_permutations(total_permutations);
    
        let i = 0;
        while (true) {
            if (i == 0) this.clear();
    
            if (STATS.has_timer_expired()) {
                return;
            }

            indices[i]++;
            const ops_so_far: number = stats.inc_ops();
            if (indices[i] === by_positions_array[i].length) {
                if (i === 0) break;
                indices[i] = -1;
                --i;
                this.delete(permutation[i]);
                continue;
            }
            if (ops_so_far >= this._next_checkpoint) {
                STATS.print();
                this._next_checkpoint += (200 * 10**6);
            }
    
            const obj: T = by_positions_array[i][indices[i]];
            if (!this.try_add(obj)) {
                stats.inc_skipped();
                continue;
            }
            permutation[i] = obj;
            
            // Optimization: Early pruning check
            if (i < by_positions_array.length - 1) {
                const remaining_positions = by_positions_array.length - i - 1;
                if (!this.can_potentially_complete(permutation, i + 1, remaining_positions)) {
                    stats.inc_skipped();
                    this.delete(obj);
                    continue;
                }
            }
    
            // we have a permutation
            if (i === by_positions_array.length - 1) {
                if (this.is_permutation_approved(permutation)) {
                    stats.inc_found();
                    yield permutation;
                } else {
                    stats.inc_skipped();
                }
    
                // re-doing this again
                this.delete(obj);
            } else {
                ++i;
            }
        }
    }
}

export class DistinctIterationFilter<T> extends IterationFilter<T> {
    protected stats_name: string = "DistinctFilter";
    used: Set<T> = new Set();

    clear() {
        this.used.clear();
    }

    delete(obj: T) {
        this.used.delete(obj);
    }

    try_add(obj: T): boolean {
        if (this.used.has(obj)) return false;
        this.used.add(obj);
        return true;
    }

    is_permutation_approved(permutation: T[]): boolean {
        return true;
    }
    
    can_potentially_complete(partial_permutation: T[], size: number, remaining_positions: number): boolean {
        // Basic implementation: check if we have enough unused objects
        // This can be overridden by subclasses for more sophisticated checks
        return true;
    }
}

export class NonDistinctIterationFilter<T> extends IterationFilter<T> {
    protected stats_name: string = "NonDistinctFilter";

    clear() {
    }

    delete(obj: T) {
        
    }

    try_add(obj: T): boolean {
        return true;
    }

    is_permutation_approved(permutation: T[]): boolean {
        return true;
    }
    
    can_potentially_complete(partial_permutation: T[], size: number, remaining_positions: number): boolean {
        return true;
    }
}
