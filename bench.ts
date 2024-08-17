import { run, bench, group, baseline } from 'mitata';
import { heapStats } from "bun:jsc";


function* it1(arr) {
    for (let i = 0; i < arr.length; i++) {
        const arr2 = new Array(arr.length).fill(arr[i]);
        yield arr2;
    }
}
function* it2(arr) {
    let arr2 = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        arr2.fill(arr[i]);
        yield arr2;
    }
}


// function* it3(arr, arr2) {
//     for (let i = 0; i < arr2.length; i++) {
//         for (let j = 0; j < arr2.length; j++) {
//             arr2[j] = arr[i];
//         }
//         yield arr2;
//     }
// }


function cn1(arr, fn) {
    for (let i = 0; i < arr.length; i++) {
        const arr2 = new Array(arr.length);
        arr2.fill(arr[i]);
        fn(arr2);
    }
}
function cn2(arr, fn) {
    let arr2 = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        arr2.fill(arr[i]);
        fn(arr2);
    }
}


// function cn3(arr, arr2, fn) {
//     for (let i = 0; i < arr2.length; i++) {
//         for (let j = 0; j < arr2.length; j++) {
//             arr2[j] = arr[i];
//         }
//         fn(arr2);
//     }
// }

group('group', () => {
    // baseline('baseline', () => {});
    bench('yields', () => {
        const a1 = new Array(30).fill(1);
        let sum = 0;
        let last_heap = heapStats();
        for (const a2 of it1(a1)) {
            for (const a3 of it2(a2)) {
                for (const x of a3) {
                    sum += x;
                    if (sum === 27000)
                        last_heap = heapStats();
                }
            }
        }
        Bun.write("yield.heap.json", JSON.stringify(last_heap, null, 4));
        // console.log(sum);
        // sum === 27000
    });
    bench('cbs', () => {
        function cb2(a3) {
            for (const x of a3) {
                sum += x;
                if (sum === 27000)
                    last_heap = heapStats();
            }
        };
        function cb1(a2) {
            cb2(a2);
        }

        const a1 = new Array(30).fill(1);
        let sum = 0;
        let last_heap = heapStats();
        cn1(a1, cb1);
        Bun.write("cb2.heap.json", JSON.stringify(last_heap, null, 4));
        // console.log(sum);
        // sum === 27000
    });
});




await run({
    silent: false, // enable/disable stdout output
    avg: true, // enable/disable avg column (default: true)
    json: false, // enable/disable json output (default: false)
    colors: true, // enable/disable colors (default: true)
    min_max: true, // enable/disable min/max column (default: true)
    percentiles: false, // enable/disable percentiles column (default: true)
});