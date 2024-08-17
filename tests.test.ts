import { expect, test, describe } from "bun:test";
import { DistinctIterationFilter, IterationFilter } from "./permutations";
import { binary_search } from "./filters";
import STATS from "./stats";



describe("permutations", () => {
    const cases = [
        {
            in_: [[1, 2, 3], [1, 2, 3], [1, 2, 3]],
            expected_: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
        },
        {
            in_: [[1, 2], [3, 4], [5, 6, 7]],
            expected_: [[1, 3, 5], [1, 3, 6], [1, 3, 7], [1, 4, 5], [1, 4, 6], [1, 4, 7],
            [2, 3, 5], [2, 3, 6], [2, 3, 7], [2, 4, 5], [2, 4, 6], [2, 4, 7]]
        },
        {
            in_: [[1, 2], [3, 1], [4, 2]],
            expected_: [[1, 3, 4], [1, 3, 2], [2, 3, 4], [2, 1, 4]]
        }
    ]

    let total_time = 0;
    let total_cases = 0;
    test.each(cases)('.permutations of $in_', ({ in_, expected_ }) => {
        const t0 = performance.now();
        const it = new DistinctIterationFilter<number>();
        const s = it.generate_permutations(in_);
        const output: number[][] = [];
        while (true) {
            const n = s.next();
            if (n.done) break;
            const v: number[] = n.value;
            output.push(v.slice());
        }
        const t1 = performance.now();
        total_time += ((t1 - t0)*1000);
        ++total_cases;
        console.log(`Total calc_time=${total_time}us. average=${(total_time / total_cases).toFixed(2)}us`);
        expect(output).toBeArray()
        expect(output).toBeArrayOfSize(expected_.length);
        expect(Bun.deepEquals(output, expected_)).toBeTrue();
    });
    
});

describe("permutations_indistinct", () => {
    class EmptyIterationFilter extends IterationFilter<number> {
        stats_name: string = "Empty";

        clear() {

        }

        delete(obj: number) {

        }

        try_add(obj: number): boolean {
            return true;
        }

        is_permutation_approved(permutation: number[]): boolean {
            return true;
        }
    }

    function generate_array(from: number, to: number): number[] {
        const arr: number[] = [];
        for (let i = from; i <= to; i++) {
            arr.push(i);
        }
        return arr;
    }

    function generate_arrays(arr: number[]): [number[][], bigint] {
        const res: number[][] = [];
        let total = BigInt(1)
        for (let i = 0; i < arr.length; i++) {
            res.push(generate_array(1, arr[i]));
            total *= BigInt(arr[i]);
        }
        return [res, total];
    }

    const cases = [
        {
            in_: [[1, 2, 3], [1, 2, 3], [1, 2, 3]],
            expected_: 27n
        },
        {
            in_: [[1, 2], [3, 4], [5, 6, 7]],
            expected_: 12n
        },
        {
            in_: [[1, 2], [3, 1], [4, 2]],
            expected_: 8n
        },
        {
            in_: [generate_array(1, 20), generate_array(1, 25), generate_array(1, 25)],
            expected_: 12500n
        },
        (function() {
            const [array, total] = generate_arrays([25, 31, 77, 77, 3]);
            return {
                in_: array,
                expected_: total
            }
        })()
    ]

    test.each(cases)('.permutations of $in_', ({ in_, expected_ }) => {
        STATS.reset();
        const it = new EmptyIterationFilter();
        const s = it.generate_permutations(in_);
        let count = BigInt(0);
        while (true) {
            const n = s.next();
            if (n.done) break;
            count++;
        }
        STATS.print();
        expect(count).toBe(expected_);
    });
});



describe("binary_search", () => {
    const cases = [
        {
            arr: [1, 3, 5, 7, 9, 11, 13],
            target: 6,
            expected_: 3
        },
        {
            arr: [1, 3, 5, 7, 9, 11, 13],
            target: 9,
            expected_: 4
        },
        {
            arr: [1, 3, 5, 7, 9, 11, 13],
            target: 0,
            expected_: 0
        },
        {
            arr: [1, 3, 5, 7, 9, 11, 13],
            target: 14,
            expected_: -1
        },
        {
            arr: [1, 3, 5, 7, 9, 11, 13],
            target: 12,
            expected_: 6
        },
        {
            arr: [1, 1, 1, 2, 9, 11, 13],
            target: 1,
            expected_: 0
        },
        {
            arr: [1, 1, 1, 2, 9, 11, 13],
            target: 2,
            expected_: 3
        },
        {
            arr: [1, 1, 1, 2, 9, 11, 13],
            target: 3,
            expected_: 4
        },
        {
            arr: [1, 1, 1, 2, 9, 11, 13],
            target: 14,
            expected_: -1
        }
    ]

    test.each(cases)('.permutations of $target', ({ arr, target, expected_ }) => {
        const res = binary_search(arr, target);
        expect(res).toBe(expected_);
    });
});