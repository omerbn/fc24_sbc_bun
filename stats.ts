
function pp(n: number | bigint): string {
    return new Intl.NumberFormat().format(n);
}

class Permutations {
    private _ops = 0;
    private _skipped_ops = 0;
    private _found = 0;
    private _max_permutations: bigint = BigInt(0);
    private _discardes: Map<string, number> = new Map();


    inc_ops(): number {
        return ++this._ops;
    }

    inc_skipped(): number {
        return ++this._skipped_ops;
    }

    inc_found(): number {
        return ++this._found;
    }

    inc_discarded(reason: string): number {
        let v = this._discardes.get(reason) || 0;
        this._discardes.set(reason, ++v);
        return v;
    }

    inc_max_permutations(n: bigint) {
        this._max_permutations += n;
    }

    get_max_permutations(): bigint {
        return this._max_permutations;
    }

    get_skipped(): number {
        return this._skipped_ops;
    }

    get_ops(): number {
        return this._ops;
    }

    get_found(): number {
        return this._found;
    }

    to_json() {
        return {
            max_permutations: pp(this._max_permutations),
            ops: pp(this._ops),
            skipped_ops: pp(this._skipped_ops),
            found: pp(this._found),
        };
    }

    reset() {
        this._ops = 0;
        this._skipped_ops = 0;
        this._found = 0;
        this._max_permutations = BigInt(0);
        this._discardes.clear();
    }

    print_value(): void {
        if (this._max_permutations !== BigInt(0)) {
            console.log(`total_permutations=${pp(this._max_permutations)}`);
        }
        if (this._ops !== 0) {
            console.log(`total_ops=${pp(this._ops)} skipped_ops=${pp(this._skipped_ops)} found_permutations=${pp(this._found)}`);
        }
        for (const [reason, count] of this._discardes) {
            console.log(`> ${reason}: ${pp(count)}`);
        }
    }
}

class Stats {
    private _permutations: Map<string, Permutations> = new Map();
    private _timer_max_run_timer: number = 0;
    private _timer_now: number = 0;
    private _last_gc: number = 0;

    pp(num: number | bigint): string {
        return pp(num);
    }

    get(type: string): Permutations {
        let x = this._permutations.get(type);
        if (!x) {
            x = new Permutations();
            this._permutations.set(type, x);
        }
        return x;
    }

    reset() {
        this._timer_max_run_timer = 0;
        this._timer_now = 0;
        this._last_gc = 0;
        for (const p of this._permutations.values()) {
            p.reset();
        }
    }

    start_timer(max_running_time_ms: number) {
        this._timer_max_run_timer = max_running_time_ms;
        this._timer_now = Date.now();
    }

    timer_elapsed_ms(): number {
        return Date.now() - this._timer_now;
    }

    has_timer_expired(): boolean {
        if (this._timer_now === 0) return false;
        const now = Date.now();
        if (now - this._last_gc > 1000 * 62) {
            Bun.gc(true);
            this._last_gc = now;
        }
        return (now - this._timer_now) > this._timer_max_run_timer;
    }

    print() {
        console.log();
        if (this._timer_now !== 0) {
            console.log(`Elapsed time: ${(this.timer_elapsed_ms() / 1000) | 0} seconds out of ${(this._timer_max_run_timer / 1000) | 0}`);
        }
        const ss = {};
        for (const [type, p] of this._permutations) {
            ss[type] = p.to_json();
        }
        console.table(ss);
        console.log();
    }
}

const STATS = new Stats();

export default STATS;