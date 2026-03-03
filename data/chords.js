const CHORD_DATA = [
    {
        category: "Triad",
        name: "Major",
        symbol: "M",
        root6: {
            intervals: ["1", "5", "1", "3", "5", "1"],
            fingers: [1, 3, 4, 2, 1, 1],
            frets_rel: [0, 2, 2, 1, 0, 0]
        },
        root5: {
            intervals: ["X", "1", "5", "1", "3", "5"],
            fingers: ["X", 1, 3, 3, 3, 1],
            frets_rel: ["X", 0, 2, 2, 2, 0]
        }
    },
    {
        category: "Triad",
        name: "Minor",
        symbol: "m",
        root6: {
            intervals: ["1", "5", "1", "b3", "5", "1"],
            fingers: [1, 3, 4, 1, 1, 1],
            frets_rel: [0, 2, 2, 0, 0, 0]
        },
        root5: {
            intervals: ["X", "1", "5", "1", "b3", "5"],
            fingers: ["X", 1, 3, 4, 2, 1],
            frets_rel: ["X", 0, 2, 2, 1, 0]
        }
    },
    {
        category: "7th",
        name: "Major 7",
        symbol: "M7",
        root6: {
            intervals: ["1", "X", "7", "3", "5", "X"],
            fingers: [1, "X", 2, 3, 4, "X"],
            frets_rel: [0, "X", 1, 1, 0, "X"]
        },
        root5: {
            intervals: ["X", "1", "5", "7", "3", "5"],
            fingers: ["X", 1, 3, 4, 2, 1],
            frets_rel: ["X", 0, 2, 1, 2, 0]
        }
    },
    {
        category: "7th",
        name: "Minor 7",
        symbol: "m7",
        root6: {
            intervals: ["1", "X", "b7", "b3", "5", "X"],
            fingers: [1, "X", 2, 3, 4, "X"],
            frets_rel: [0, "X", 0, 0, 0, "X"]
        },
        root5: {
            intervals: ["X", "1", "5", "b7", "b3", "5"],
            fingers: ["X", 1, 3, 1, 2, 1],
            frets_rel: ["X", 0, 2, 0, 1, 0]
        }
    },
    {
        category: "7th",
        name: "Dominant 7",
        symbol: "7",
        root6: {
            intervals: ["1", "X", "b7", "3", "5", "X"],
            fingers: [1, "X", 2, 3, 4, "X"],
            frets_rel: [0, "X", 0, 1, 0, "X"]
        },
        root5: {
            intervals: ["X", "1", "5", "b7", "3", "5"],
            fingers: ["X", 1, 3, 1, 4, 1],
            frets_rel: ["X", 0, 2, 0, 2, 0]
        }
    },
    {
        category: "Advanced",
        name: "Minor 7♭5",
        symbol: "m7b5",
        root6: {
            intervals: ["1", "X", "b7", "b3", "b5", "X"],
            fingers: [1, "X", 2, 3, 4, "X"],
            frets_rel: [0, "X", 0, 0, -1, "X"]
        },
        root5: {
            intervals: ["X", "1", "X", "b7", "b3", "b5"],
            fingers: ["X", 1, "X", 3, 4, 2],
            frets_rel: ["X", 0, "X", 0, 1, 0]
        }
    },
    {
        category: "9th",
        name: "Dominant 9",
        symbol: "9",
        root6: {
            intervals: ["1", "X", "b7", "3", "X", "9"],
            fingers: [1, "X", 2, 3, "X", 4],
            frets_rel: [0, "X", 0, 1, "X", 2]
        },
        root5: {
            intervals: ["X", "1", "3", "b7", "9", "X"],
            fingers: ["X", 2, 1, 3, 4, "X"],
            frets_rel: ["X", 0, -1, 0, 2, "X"]
        }
    }
];
