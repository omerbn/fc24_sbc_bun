import { SearchQuery } from "./filters/index"

export const challenges: Map<string, SearchQuery> = (function (): Map<string, SearchQuery> {
    const map = new Map<string, SearchQuery>();
    function add_to_map(q: SearchQuery) {
        q.max_running_time_ms = 1000 * 60; // default
        map.set(q.name, q);
    }

    add_to_map({
        "name": "FUTTIES Crafting Upgrade",
        "positions": ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
        "ratings": {
            "min_player": 75
        },
        "rarity": {
            "conditions": {
                "rare": ">0"
            }
        }
    });

    add_to_map({
        "name": "FUTTIES daily challenge",
        "group": "challenges",
        "positions": ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CDM", "LW", "ST", "RW"],
        leagues: {
            max_players_from_same: 2
        },
        nations: {
            min_players_from_same: 4
        },
        "ratings": {
            min_squad: 75
        },
        "rarity": {
            "conditions": {
                "common": "<11"
            }
        },
        chemistry: {
            min_squad: 31
        }
    });

    add_to_map({
        name: "gold upgrade",
        group: "upgrades",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CDM", "CAM", "RM", "ST", "ST"],
        ratings: {
            min_player: 75
        },
        allow_random_positions: true,
    });

    add_to_map({
        // repeatable
        name: "Silver challenge",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
        ratings: {
            min_player: 65,
            max_player: 74
        },
        allow_random_positions: true,
    });

    add_to_map({
        // repeatable
        name: "Bronze challenge",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
        ratings: {
            max_player: 64
        },
        rarity: {
            conditions: {
                "common": "=11"
            }
        },
        allow_random_positions: true,
    });

    add_to_map({
        group: "Foundations V",
        name: "Better buildup",
        positions: ["CM", "CM", "CM"],
        nations: {
            exact_players_from_same: 2
        },
        teams: {
            exact_players_from_same: 2
        },
        ratings: {
            max_player: 64
        },
        chemistry: {
            min_points_for_each_player: 1
        },
    });

    add_to_map({
        group: "Foundations V",
        name: "Advancing attack",
        positions: ["CF", "ST", "ST"],
        ratings: {
            max_player: 64
        },
        chemistry: {
            min_points_for_each_player: 1
        },
    });

    add_to_map({
        group: "Hybrid Leagues",
        name: "Seven League boots",
        positions: ["GK", "CB", "CB", "CB", "LM", "CM", "CM", "RM", "LW", "ST", "RW"],
        leagues: {
            exact_in_squad: 7,
            max_players_from_same: 3
        },
        teams: {
            max_players_from_same: 3
        },
        ratings: {
            min_squad: 78
        },
        chemistry: {
            min_squad: 18,
            min_points_for_each_player: 1
        },
    });

    add_to_map({
        group: "Hybrid Leagues",
        name: "First XI",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CDM", "CM", "RM", "ST"],
        leagues: {
            exact_in_squad: 11,
        },
        ratings: {
            min_player: 75
        },
        rarity: {
            conditions: {
                "rare": ">6"
            }
        },
        chemistry: {
            min_squad: 27,
        },
    });

    add_to_map({
        group: "Hybrid Leagues",
        name: "Whole nine yards",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CDM", "CDM", "RM", "ST", "ST"],
        leagues: {
            exact_in_squad: 9,
            max_players_from_same: 2
        },
        teams: {
            max_players_from_same: 2
        },
        rarity: {
            conditions: {
                "rare": ">5"
            }
        },
        ratings: {
            min_squad: 80
        },
        chemistry: {
            min_squad: 21
        },
        hinted_players_are_must: true
    });

    add_to_map({
        group: "Icon:Kaka",
        name: "Born Legend",
        positions: ["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CDM", "CM", "ST", "ST"],
        ratings: {
            max_player: 64
        },
        rarity: {
            conditions: {
                "rare": "=11"
            }
        },
        max_results: 5
    });

    add_to_map({
        group: "Icon:Kaka",
        name: "Rising Star",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CAM", "CM", "CAM", "RM", "ST"],
        ratings: {
            max_player: 74,
            min_player: 65
        },
        rarity: {
            conditions: {
                "rare": "=11"
            }
        },
        max_results: 5
    });

    add_to_map({
        group: "Icon:Kaka",
        name: "Mid Icon",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CAM", "CM", "CAM", "RM", "ST"],
        ratings: {
            min_player: 75
        },
        rarity: {
            conditions: {
                "rare": "=11"
            }
        },
        max_results: 5
    });

    add_to_map({
        name: "Six of the best",
        group: "Hybrid nations",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
        nations: {
            exact_in_squad: 6,
            max_players_from_same: 3
        },
        teams: {
            max_players_from_same: 3
        },
        ratings: {
            min_squad: 75
        },
        chemistry: {
            min_squad: 18
        }
    });

    add_to_map({
        name: "Elite eight",
        group: "Hybrid nations",
        positions: ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "ST", "RW"],
        nations: {
            exact_in_squad: 8,
            max_players_from_same: 2
        },
        teams: {
            max_players_from_same: 3
        },
        rarity: {
            conditions: {
                "rare": ">4"
            }
        },
        ratings: {
            min_player: 75
        },
        chemistry: {
            min_squad: 21
        }
    });

    add_to_map({
        name: "Around the world",
        group: "Hybrid nations",
        positions: ["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CM", "CAM", "ST", "ST"],
        nations: {
            exact_in_squad: 10,
        },
        rarity: {
            // conditions: {
            //     // "rare": ">7"
            //     "commmon": "=0"
            // }
            disallowed_rarities: ["common"]
        },
        ratings: {
            min_squad: 81,
            min_player: 72
        },
        chemistry: {
            min_points_for_each_player: 2,
            min_squad: 24
        }
    });

    add_to_map({
        name: "81+ player pick",
        group: "upgrades",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
        ratings: {
            min_squad: 87,
            // min_player: 87
        },
    });

    add_to_map({
        name: "81+ tradeable totw upgrade",
        group: "upgrades",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
        ratings: {
            min_squad: 85
        },
    });

    add_to_map({
        name: "83+ totw player pick - 2",
        group: "upgrades",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CAM", "RM", "ST", "ST"],
        ratings: {
            min_squad: 83,
            min_player: 72
            // min_player: 87
        },
    });

    add_to_map({
        name: "83+ totw player pick - 1",
        group: "upgrades",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CDM", "CM", "RM", "ST"],
        ratings: {
            min_squad: 82,
            min_player: 72,
        },
    });

    add_to_map({
        name: "82+ player pick",
        group: "upgrades",
        positions: ["GK", "CB", "CB", "CM", "CM", "CM", "CF", "CF"],
        ratings: {
            // min_squad: 87,
            min_player: 75
            // min_player: 87
        },
        rarity: {
            conditions: {
                "rare": ">2"
            },
            allowed_rarities: ["rare", "common"]
        },
    });

    // add_to_map({
    //     name: "84+ x10 upgrade",
    //     group: "upgrades",
    //     positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CAM", "RM", "ST", "ST"],
    //     ratings: {
    //         min_squad: 83,
    //         min_player: 72
    //         // min_player: 87
    //     },
    // });

    add_to_map({
        name: "exchange 85+",
        positions: ["GK"],
        ratings: {
            min_player: 85,
        },
        rarity: {
            allowed_rarities: ["rare", "common"]
        },
    });

    add_to_map({
        name: "exchange 86+",
        positions: ["GK"],
        ratings: {
            min_player: 86,
        },
        rarity: {
            allowed_rarities: ["rare", "common"]
        },
    });

    add_to_map({
        name: "exchange 87+",
        positions: ["GK"],
        ratings: {
            min_player: 87,
        },
        rarity: {
            allowed_rarities: ["rare", "common"]
        },
    });

    add_to_map({
        name: "exchange 88+",
        positions: ["GK"],
        ratings: {
            min_player: 88,
        },
        rarity: {
            allowed_rarities: ["rare", "common"]
        },
    });

    add_to_map({
        name: "exchange 89+",
        positions: ["GK"],
        ratings: {
            min_player: 89,
        },
        rarity: {
            allowed_rarities: ["rare", "common"]
        },
    });

    add_to_map({
        name: "83 rated",
        group: "upgrades",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CDM", "RM", "CAM", "ST", "ST"],
        ratings: {
            min_squad: 83,
            min_player: 77,
            max_player: 88
        },
        rarity: {
            allowed_rarities: ["rare", "common"]
        }
    });

    add_to_map({
        name: "82 challenge squad",
        group: "upgrades",
        positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CDM", "CM", "RM", "ST"],
        ratings: {
            min_squad: 82,
            min_player: 70
        }
    });

    add_to_map({
        name: "Ultimate Bronze upgrade",
        group: "",
        positions: ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "ST", "RW"],
        // ratings: {
        //     min_player: 50
        // },
        leagues: {
            exact_in_squad: 4,
            max_players_from_same: 3
        },
        nations: {
            exact_in_squad: 2,
            min_players_from_same: 3
        }
    });

    add_to_map({
        name: "futties silver cup challenge",
        "group": "challenges",
        positions: ["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "CAM", "CAM", "CAM", "ST"],
        leagues: {
            max_in_squad: 5
        },
        nations: {
            min_players_from_same: 2
        },
        ratings: {
            min_silver: 1
        },
        rarity: {
            conditions: {
                // "rare": ">2"
                "common": "=0"
            }
        },
        chemistry: {
            min_squad: 14
        }
    });


    return map;
})();