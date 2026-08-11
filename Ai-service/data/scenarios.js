export const scenarios = {
    "departure-clearance": {
        id: "departure-clearance",

        steps: [
            {
                id: "departure-1",

                query:
                    "Issue an IFR departure clearance to the aircraft.",

                procedureType:
                    "departure",

                phase:
                    "clearance",

                expected: {
                    callsign: "VTX123",
                    runway: "27",
                    departure: "NAGPUR",
                    squawk: "4521",
                },
            },
        ],
    },

    "landing-clearance": {
        id: "landing-clearance",

        steps: [
            {
                id: "landing-1",

                query:
                    "Issue a landing clearance to the aircraft.",

                procedureType:
                    "landing",

                phase:
                    "tower",

                expected: {
                    callsign: "VTX123",
                    runway: "27",
                },
            },
        ],
    },

    "frequency-change": {
        id: "frequency-change",

        steps: [
            {
                id: "frequency-1",

                query:
                    "Instruct the aircraft to contact departure control.",

                procedureType:
                    "frequency_change",

                phase:
                    "departure",

                expected: {
                    callsign: "VTX123",
                    frequency: "124.7",
                },
            },
        ],
    },
};