export function startTimer(label) {
    const start = performance.now();

    return {
        end(extra = "") {
            const elapsed = performance.now() - start;

            console.log(
                `[Latency] ${label}: ${elapsed.toFixed(0)}ms${extra}`
            );

            return elapsed;
        },
    };
}