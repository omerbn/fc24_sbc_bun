import { BaseIterationFilter } from "./index";
import { Player } from "../data/i";

export class DatasetFilterFlow {
    private _next: DatasetFilterFlow | undefined
    private _iteration_filter: BaseIterationFilter<any, any> | undefined;

    constructor(iteration_filter: BaseIterationFilter<any, any> | undefined = undefined) {
        this._iteration_filter = iteration_filter;
    }

    collect_stats(data: object) {
        if (this._iteration_filter) {
            const stats = this._iteration_filter.get_stats();
            data[this._iteration_filter.get_stats_name] = stats.to_json();
        }
        if (this._next) {
            this._next.collect_stats(data);
        }
    }

    set_next(filter: DatasetFilterFlow) {
        this._next = filter;
        return filter;
    }

    *run(dataset: Player[][]): Generator<Player[][]> {
        if (this._iteration_filter) {
            for (const new_dataset of this._iteration_filter.generate_players_permutations(dataset)) {
                if (this._next) {
                    yield* this._next.run(new_dataset);
                } else {
                    yield new_dataset;
                }
            }
        } else {
            if (this._next) {
                yield* this._next.run(dataset);
            } else {
                yield dataset;
            }
        }
    }
}