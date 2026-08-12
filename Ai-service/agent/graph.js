import {
    StateGraph,
    START,
    END,
    MemorySaver,
} from "@langchain/langgraph";

import { AgentState } from "./state.js";

import { loadStep } from "./nodes/loadStep.js";
import { qdrantRetrieve } from "./nodes/qdrantRetrieve.js";
import { composeLine } from "./nodes/composeLine.js";
import { ttsSpeak } from "./nodes/ttsSpeak.js";
import { awaitReadback } from "./nodes/awaitReadback.js";
import { validateReadback } from "./nodes/validateReadback.js";
import { issueCorrection } from "./nodes/issueCorrection.js";
import { clarify } from "./nodes/clarify.js";
import { advanceStep } from "./nodes/advanceStep.js";
import { debrief } from "./nodes/debrief.js";

const workflow =
    new StateGraph(AgentState)

        .addNode("loadStep", loadStep)
        .addNode("qdrantRetrieve", qdrantRetrieve)
        .addNode("composeLine", composeLine)
        .addNode("ttsSpeak", ttsSpeak)
        .addNode("awaitReadback", awaitReadback)
        .addNode("validateReadback", validateReadback)
        .addNode("issueCorrection", issueCorrection)
        .addNode("clarify", clarify)
        .addNode("advanceStep", advanceStep)
        .addNode("debrief", debrief);

workflow.addEdge(
    START,
    "loadStep"
);

workflow.addEdge(
    "loadStep",
    "qdrantRetrieve"
);

workflow.addEdge(
    "qdrantRetrieve",
    "composeLine"
);

workflow.addEdge(
    "composeLine",
    "ttsSpeak"
);

workflow.addEdge(
    "ttsSpeak",
    "awaitReadback"
);

workflow.addEdge(
    "awaitReadback",
    "validateReadback"
);

workflow.addConditionalEdges(
    "validateReadback",

    (state) => {
        if (
            state.extracted?.valid === true
        ) {
            return "correct";
        }

        /*
         * retries is already incremented
         * inside validateReadback.
         *
         * Therefore:
         * 1st wrong readback -> retries = 1
         * 2nd wrong readback -> retries = 2
         * 3rd wrong readback -> retries = 3
         *
         * After the 3rd attempt, terminate.
         */
        if (
            (state.retries ?? 0) >= 3
        ) {
            return "max_retries";
        }

        return "incorrect";
    },

    {
        correct: "advanceStep",
        incorrect: "issueCorrection",
        max_retries: "clarify",
    }
);

workflow.addEdge(
    "issueCorrection",
    "ttsSpeak"
);

/*
 * clarify is now the FINAL response
 * after three failed readbacks.
 *
 * It must NOT go back to ttsSpeak,
 * otherwise a fourth readback is possible.
 */
workflow.addEdge(
    "clarify",
    "debrief"
);

workflow.addConditionalEdges(
    "advanceStep",

    (state) => {
        if (state.finished) {
            return "finished";
        }

        return "next";
    },

    {
        finished: "debrief",
        next: "loadStep",
    }
);

workflow.addEdge(
    "debrief",
    END
);

const checkpointer =
    new MemorySaver();

const compiledGraph =
    workflow.compile({
        checkpointer,
    });

export {
    compiledGraph,
};