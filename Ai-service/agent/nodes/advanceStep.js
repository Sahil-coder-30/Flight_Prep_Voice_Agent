export async function advanceStep(state) {
    const nextIndex = state.stepIndex + 1;
    const finished = nextIndex >= (state.steps?.length ?? 0);

    return {
        stepIndex: nextIndex,
        finished,
    };
}