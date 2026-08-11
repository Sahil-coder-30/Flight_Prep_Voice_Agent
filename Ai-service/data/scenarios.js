export const scenarios = {
    "taxi-basic": {
        id: "taxi-basic",

        steps: [
            {
                id: "taxi-1",

                query: "Issue a taxi clearance to runway 27.",

                procedureType: "taxi",

                phase: "ground",

                expected: {
                    taxiway: "Alpha",
                    runway: "27",
                    hold_short: "runway 27"
                }
            }
        ]
    }
};

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc4NjQ0MDU1MiwiZXhwIjoxNzg2NDQ0MTUyfQ.7IfH2BzkUX5WGu_9AW6y0f3uvXd-Gee3AH5y8I6IcKE

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc4NjQ0MTgyMCwiZXhwIjoxNzg2NDQ1NDIwfQ.90vxJ16Hx9-BExMd6PHoP7a1KBgRgaBMvilOu396RQs