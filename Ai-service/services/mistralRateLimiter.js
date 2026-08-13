let queue = Promise.resolve();

const MIN_INTERVAL_MS = 1200;

function sleep(ms) {
    return new Promise((resolve) =>
        setTimeout(resolve, ms)
    );
}

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

                await sleep(waitTime);
            }
        }

        scheduleMistralRequest.lastRequest =
            Date.now();

        console.log(
            `[Mistral] Sending request at ${scheduleMistralRequest.lastRequest}`
        );

        try {
            return await fn();
        } finally {
            scheduleMistralRequest.lastCompleted =
                Date.now();
        }
    });

    queue = task.catch(() => { });

    return task;
}

scheduleMistralRequest.lastRequest = 0;
scheduleMistralRequest.lastCompleted = 0;

export {
    scheduleMistralRequest,
};