export const atcKnowledge = [
    {
        id: "departure-clearance-components",
        text:
            "An IFR departure clearance may contain the aircraft clearance limit or destination, assigned Standard Instrument Departure when applicable, departure runway, initial altitude or other departure instructions, departure frequency when applicable, and an SSR transponder code. The exact clearance depends on the applicable procedure and local publication.",

        procedure_type: "departure",
        phase: "clearance",
        category: "clearance_components",

        jurisdiction: "training",
        source:
            "AAI eAIP / FAA ATC reference",
    },

    {
        id: "departure-readback-runway",
        text:
            "When acknowledging a departure clearance, the pilot should correctly read back the assigned runway and other clearance elements that require readback. Aircraft identification should be included in the readback.",

        procedure_type: "departure",
        phase: "clearance",
        category: "readback",

        jurisdiction: "training",
        source:
            "FAA ATC / AIM readback guidance",
    },

    {
        id: "departure-sid",
        text:
            "A Standard Instrument Departure is a published instrument departure procedure. An aircraft must receive the applicable ATC clearance before operating on the assigned SID.",

        procedure_type: "departure",
        phase: "clearance",
        category: "sid",

        jurisdiction: "training",
        source:
            "FAA Pilot/Controller Glossary",
    },

    {
        id: "departure-takeoff-distinction",
        text:
            "A departure clearance is not the same as a takeoff clearance. Receiving an IFR route, SID, runway, altitude, frequency or transponder assignment does not by itself authorize takeoff.",

        procedure_type: "departure",
        phase: "clearance",
        category: "clearance_distinction",

        jurisdiction: "training",
        source:
            "FAA AIM / ATC guidance",
    },

    {
        id: "landing-clearance",
        text:
            "A landing clearance is an ATC authorization for an aircraft to land. The landing runway must be identified by the applicable clearance, and the pilot must correctly acknowledge the clearance.",

        procedure_type: "landing",
        phase: "tower",
        category: "landing_clearance",

        jurisdiction: "training",
        source:
            "FAA AIM / ATC guidance",
    },

    {
        id: "landing-readback",
        text:
            "An initial readback of a landing clearance should include the assigned runway and aircraft identification. The controller must ensure that the pilot's readback is correct.",

        procedure_type: "landing",
        phase: "tower",
        category: "readback",

        jurisdiction: "training",
        source:
            "FAA ATC readback guidance",
    },

    {
        id: "landing-clearance-not-altitude",
        text:
            "A landing clearance authorizes landing under the applicable ATC conditions but does not cancel previously issued altitude restrictions or other applicable instructions.",

        procedure_type: "landing",
        phase: "tower",
        category: "clearance_scope",

        jurisdiction: "training",
        source:
            "FAA AIM clearance guidance",
    },

    {
        id: "frequency-contact-departure",
        text:
            "When transferring an aircraft to another ATC facility or function, the controller specifies the facility or terminal function to contact and the frequency to use when required. A departure control transfer may therefore contain the instruction to contact departure and the assigned frequency.",

        procedure_type: "frequency_change",
        phase: "departure",
        category: "communication_transfer",

        jurisdiction: "training",
        source:
            "FAA ATC communication-transfer guidance",
    },

    {
        id: "frequency-change-readback",
        text:
            "Aircraft identification should be used when acknowledging ATC clearances, frequency changes, or related instructions. The pilot should monitor the assigned frequency after the communication transfer.",

        procedure_type: "frequency_change",
        phase: "departure",
        category: "readback",

        jurisdiction: "training",
        source:
            "FAA AIM / ATC communication guidance",
    },

    {
        id: "frequency-contact-facility",
        text:
            "A frequency-transfer instruction identifies the receiving facility or terminal function and, when required, gives the frequency. The controller may also specify a time, fix, altitude, or other point at which the contact should occur.",

        procedure_type: "frequency_change",
        phase: "departure",
        category: "transfer_components",

        jurisdiction: "training",
        source:
            "FAA ATC communication-transfer guidance",
    },

    {
        id: "taxi-runway-assignment",
        text:
            "Taxi instructions should identify the taxi destination and routing. When an assigned takeoff runway is involved, the runway assignment should be communicated along with applicable taxi instructions.",

        procedure_type: "taxi",
        phase: "ground",
        category: "taxi_clearance",

        jurisdiction: "training",
        source:
            "FAA AIM taxi guidance",
    },

    {
        id: "taxi-hold-short",
        text:
            "A taxi instruction may contain a hold-short instruction for a specific runway. Runway hold-short instructions are safety-critical and require correct pilot acknowledgment or readback according to the applicable procedure.",

        procedure_type: "taxi",
        phase: "ground",
        category: "hold_short",

        jurisdiction: "training",
        source:
            "FAA AIM / ATC taxi guidance",
    },

    {
        id: "taxi-runway-crossing",
        text:
            "Taxi instructions do not automatically authorize an aircraft to enter or cross a runway unless the applicable ATC instruction explicitly provides that authorization. Runway crossing instructions must be clearly understood and acknowledged as required.",

        procedure_type: "taxi",
        phase: "ground",
        category: "runway_crossing",

        jurisdiction: "training",
        source:
            "FAA AIM taxi guidance",
    },

    {
        id: "line-up-and-wait",
        text:
            "Line up and wait instructs an aircraft to taxi onto the departure runway, align with the runway, and wait. It is not authorization for takeoff.",

        procedure_type: "takeoff",
        phase: "tower",
        category: "line_up_wait",

        jurisdiction: "training",
        source:
            "FAA Pilot/Controller Glossary",
    },

    {
        id: "takeoff-clearance",
        text:
            "A takeoff clearance is ATC authorization for an aircraft to depart from the applicable runway. A runway assignment, taxi instruction, or line-up-and-wait instruction must not be treated as a takeoff clearance.",

        procedure_type: "takeoff",
        phase: "tower",
        category: "takeoff_clearance",

        jurisdiction: "training",
        source:
            "FAA Pilot/Controller Glossary / AIM",
    },

    {
        id: "general-atc-readback",
        text:
            "Pilots should acknowledge ATC clearances and instructions and ensure that important clearance elements are read back correctly. Controllers should ensure that pilot readbacks of clearances and instructions are correct.",

        procedure_type: "readback",
        phase: "general",
        category: "general",

        jurisdiction: "training",
        source:
            "FAA ATC readback guidance",
    },

    {
        id: "general-callsign-readback",
        text:
            "Aircraft identification should be included when acknowledging an ATC clearance or instruction so that the controller can identify which aircraft has received and accepted the instruction.",

        procedure_type: "readback",
        phase: "general",
        category: "callsign",

        jurisdiction: "training",
        source:
            "FAA ATC / AIM guidance",
    },
];