let queue = Promise.resolve();

const MIN_INTERVAL_MS = 15000;

function scheduleMistralRequest(fn) {
    const task = queue.then(async () => {
        const now = Date.now();

        if (scheduleMistralRequest.lastRequest) {
            const elapsed =
                now - scheduleMistralRequest.lastRequest;

            if (elapsed < MIN_INTERVAL_MS) {
                const waitTime =
                    MIN_INTERVAL_MS - elapsed;

                console.log(
                    `[Mistral] Queue waiting ${waitTime}ms`
                );

                await new Promise((resolve) =>
                    setTimeout(resolve, waitTime)
                );
            }
        }

        scheduleMistralRequest.lastRequest = Date.now();

        console.log(
            `[Mistral] Sending request at ${scheduleMistralRequest.lastRequest}`
        );

        return fn();
    });

    queue = task.catch(() => { });

    return task;
}

scheduleMistralRequest.lastRequest = 0;

export { scheduleMistralRequest };