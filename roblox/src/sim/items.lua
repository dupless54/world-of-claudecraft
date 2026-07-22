--[[
    World of ClaudeCraft - Items System
    Roblox Lua Adaptation
    
    Archetype groups for class-locked rewards
]]

-- Archetype groups
local WAR = {"warrior", "paladin", "shaman"}
local MAG = {"mage", "priest", "warlock", "druid"}
local ROG = {"rogue", "hunter"}

-- Base items table
local BASE_ITEMS = {}

-- Starting gear
BASE_ITEMS.worn_sword = {
    id = "worn_sword",
    name = "Pitted Shortsword",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = {min = 2, max = 5, speed = 2.0},
    sellValue = 10,
}

BASE_ITEMS.gnarled_staff = {
    id = "gnarled_staff",
    name = "Bogoak Staff",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = {min = 3, max = 6, speed = 2.9},
    stats = {int = 1},
    sellValue = 12,
}

BASE_ITEMS.rusty_dagger = {
    id = "rusty_dagger",
    name = "Rusty Dagger",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = {min = 2, max = 4, speed = 1.8, dagger = true},
    sellValue = 10,
}

BASE_ITEMS.training_mace = {
    id = "training_mace",
    name = "Training Mace",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = {min = 2, max = 5, speed = 2.6},
    sellValue = 10,
}

BASE_ITEMS.rusty_hatchet = {
    id = "rusty_hatchet",
    name = "Rusty Hatchet",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = {min = 2, max = 5, speed = 2.2},
    sellValue = 10,
}

BASE_ITEMS.recruit_tunic = {
    id = "recruit_tunic",
    name = "Levyman's Tunic",
    kind = "armor",
    armorType = "leather",
    slot = "chest",
    quality = "common",
    stats = {armor = 20},
    sellValue = 5,
}

BASE_ITEMS.apprentice_robe = {
    id = "apprentice_robe",
    name = "Threadbare Robe",
    kind = "armor",
    armorType = "cloth",
    slot = "chest",
    quality = "common",
    stats = {armor = 8},
    sellValue = 5,
}

BASE_ITEMS.footpad_jerkin = {
    id = "footpad_jerkin",
    name = "Cutpurse Jerkin",
    kind = "armor",
    armorType = "leather",
    slot = "chest",
    quality = "common",
    stats = {armor = 14},
    sellValue = 5,
}

-- Quest reward gear
BASE_ITEMS.redbrook_blade = {
    id = "redbrook_blade",
    name = "Redbrook Militia Blade",
    kind = "weapon",
    slot = "mainhand",
    quality = "uncommon",
    weapon = {min = 6, max = 11, speed = 2.2},
    stats = {str = 2},
    sellValue = 120,
    requiredClass = WAR,
}

BASE_ITEMS.apprentice_staff = {
    id = "apprentice_staff",
    name = "Vale Apprentice Staff",
    kind = "weapon",
    slot = "mainhand",
    quality = "uncommon",
    weapon = {min = 7, max = 12, speed = 3.0},
    stats = {int = 3, sta = 1},
    sellValue = 120,
    requiredClass = MAG,
}

BASE_ITEMS.keen_dirk = {
    id = "keen_dirk",
    name = "Keen Dirk",
    kind = "weapon",
    slot = "mainhand",
    quality = "uncommon",
    weapon = {min = 4, max = 8, speed = 1.7, dagger = true},
    stats = {agi = 2},
    sellValue = 120,
    requiredClass = ROG,
}

BASE_ITEMS.militia_vest = {
    id = "militia_vest",
    name = "Militia Chainvest",
    kind = "armor",
    armorType = "mail",
    slot = "chest",
    quality = "uncommon",
    stats = {armor = 90, sta = 2},
    sellValue = 150,
    requiredClass = WAR,
}

BASE_ITEMS.woven_robe = {
    id = "woven_robe",
    set = "vale_arcanist",
    name = "Valewoven Robe",
    kind = "armor",
    armorType = "cloth",
    slot = "chest",
    quality = "uncommon",
    stats = {armor = 30, int = 3, spi = 2},
    sellValue = 150,
    requiredClass = MAG,
}

BASE_ITEMS.shadow_jerkin = {
    id = "shadow_jerkin",
    set = "greyjaw_stalker",
    name = "Shadowstitch Jerkin",
    kind = "armor",
    armorType = "leather",
    slot = "chest",
    quality = "uncommon",
    stats = {armor = 55, agi = 3},
    sellValue = 150,
    requiredClass = ROG,
}

BASE_ITEMS.oiled_boots = {
    id = "oiled_boots",
    name = "Oiled Leather Boots",
    kind = "armor",
    armorType = "leather",
    slot = "feet",
    quality = "uncommon",
    stats = {armor = 25, agi = 1},
    sellValue = 80,
}

BASE_ITEMS.quilted_trousers = {
    id = "quilted_trousers",
    name = "Quilted Trousers",
    kind = "armor",
    armorType = "cloth",
    slot = "legs",
    quality = "uncommon",
    stats = {armor = 30, sta = 2},
    sellValue = 90,
}

BASE_ITEMS.greyjaw_pelt_cloak = {
    id = "greyjaw_pelt_cloak",
    name = "Greyjaw's Pelt Leggings",
    kind = "armor",
    armorType = "cloth",
    slot = "legs",
    quality = "uncommon",
    stats = {armor = 35, sta = 1, agi = 1},
    sellValue = 110,
}

BASE_ITEMS.greyjaw_hide_boots = {
    id = "greyjaw_hide_boots",
    set = "greyjaw_stalker",
    name = "Greyjaw Hide Boots",
    kind = "armor",
    armorType = "leather",
    slot = "feet",
    quality = "uncommon",
    stats = {armor = 28, agi = 1, sta = 1},
    sellValue = 130,
}

BASE_ITEMS.bristleback_maul = {
    id = "bristleback_maul",
    name = "Gallowglass Hammer",
    kind = "weapon",
    slot = "mainhand",
    quality = "uncommon",
    weapon = {min = 7, max = 12, speed = 2.8},
    stats = {str = 2, sta = 1},
    sellValue = 160,
    requiredClass = WAR,
}

BASE_ITEMS.sableweb_slippers = {
    id = "sableweb_slippers",
    name = "Sableweb Slippers",
    kind = "armor",
    armorType = "cloth",
    slot = "feet",
    quality = "uncommon",
    stats = {armor = 18, int = 2, spi = 1},
    sellValue = 150,
    requiredClass = MAG,
}

BASE_ITEMS.gorraks_cruel_chopper = {
    id = "gorraks_cruel_chopper",
    name = "Gorrak's Cruel Chopper",
    kind = "weapon",
    slot = "mainhand",
    quality = "uncommon",
    weapon = {min = 8, max = 13, speed = 2.4},
    stats = {str = 2, sta = 1},
    sellValue = 180,
    requiredClass = WAR,
}

BASE_ITEMS.tunnelkings_spade = {
    id = "tunnelkings_spade",
    name = "Tunnelking's Spade",
    kind = "weapon",
    slot = "mainhand",
    quality = "uncommon",
    weapon = {min = 9, max = 15, speed = 2.7},
    stats = {str = 3, sta = 2},
    sellValue = 190,
    requiredClass = WAR,
}

BASE_ITEMS.moggers_stomper_boots = {
    id = "moggers_stomper_boots",
    name = "Mogger's Stomper Boots",
    kind = "armor",
    armorType = "leather",
    slot = "feet",
    quality = "uncommon",
    stats = {armor = 32, agi = 2, sta = 1},
    sellValue = 180,
    requiredClass = ROG,
}

BASE_ITEMS.moggers_copper_cudgel = {
    id = "moggers_copper_cudgel",
    name = "Mogger's Copper Cudgel",
    kind = "weapon",
    slot = "mainhand",
    quality = "rare",
    weapon = {min = 9, max = 15, speed = 2.6},
    stats = {str = 3, sta = 2},
    sellValue = 850,
    requiredClass = WAR,
}

BASE_ITEMS.moggers_shiv = {
    id = "moggers_shiv",
    name = "Mogger's Shiv",
    kind = "weapon",
    slot = "mainhand",
    quality = "rare",
    weapon = {min = 6, max = 11, speed = 1.7, dagger = true},
    stats = {agi = 4, sta = 2},
    sellValue = 850,
    requiredClass = ROG,
}

BASE_ITEMS.valeborn_spellblade = {
    id = "valeborn_spellblade",
    name = "Valeborn Spellblade",
    kind = "weapon",
    slot = "mainhand",
    quality = "rare",
    weapon = {min = 8, max = 14, speed = 2.2},
    stats = {int = 4, spi = 2},
    sellValue = 850,
    requiredClass = MAG,
}

BASE_ITEMS.cryptbone_greaves = {
    id = "cryptbone_greaves",
    name = "Cryptbone Greaves",
    kind = "armor",
    armorType = "mail",
    slot = "legs",
    quality = "uncommon",
    stats = {armor = 48, sta = 2},
    sellValue = 180,
}

-- Inventory 2.0: helmet/shoulder/waist/gloves
BASE_ITEMS.cryptbone_helm = {
    id = "cryptbone_helm",
    name = "Cryptbone Helm",
    kind = "armor",
    armorType = "mail",
    slot = "helmet",
    quality = "uncommon",
    stats = {armor = 48, sta = 3},
    sellValue = 185,
}

BASE_ITEMS.cryptbone_pauldrons = {
    id = "cryptbone_pauldrons",
    name = "Cryptbone Pauldrons",
    kind = "armor",
    armorType = "mail",
    slot = "shoulder",
    quality = "uncommon",
    stats = {armor = 36, sta = 2},
    sellValue = 140,
}

BASE_ITEMS.mistveil_cord = {
    id = "mistveil_cord",
    name = "Mistveil Cord",
    kind = "armor",
    armorType = "cloth",
    slot = "waist",
    quality = "uncommon",
    stats = {armor = 30, sta = 2, agi = 1},
    sellValue = 150,
}

BASE_ITEMS.mistveil_grips = {
    id = "mistveil_grips",
    name = "Mistveil Grips",
    kind = "armor",
    armorType = "cloth",
    slot = "gloves",
    quality = "uncommon",
    stats = {armor = 36, agi = 2, sta = 1},
    sellValue = 165,
}

BASE_ITEMS.boundstone_helm = {
    id = "boundstone_helm",
    set = "boundstone_vanguard",
    name = "Boundstone Helm",
    kind = "armor",
    armorType = "mail",
    slot = "helmet",
    quality = "rare",
    stats = {armor = 105, sta = 6, str = 5},
    sellValue = 460,
}

BASE_ITEMS.boundstone_girdle = {
    id = "boundstone_girdle",
    set = "boundstone_vanguard",
    name = "Boundstone Girdle",
    kind = "armor",
    armorType = "mail",
    slot = "waist",
    quality = "rare",
    stats = {armor = 60, sta = 6, str = 3},
    sellValue = 340,
}

BASE_ITEMS.gravewyrm_mantle = {
    id = "gravewyrm_mantle",
    name = "Gravewyrm Mantle",
    kind = "armor",
    armorType = "mail",
    slot = "shoulder",
    quality = "rare",
    stats = {armor = 82, agi = 7, sta = 3},
    sellValue = 410,
}

BASE_ITEMS.gravewyrm_gauntlets = {
    id = "gravewyrm_gauntlets",
    set = "boundstone_vanguard",
    name = "Gravewyrm Gauntlets",
    kind = "armor",
    armorType = "mail",
    slot = "gloves",
    quality = "rare",
    stats = {armor = 72, str = 5, sta = 4},
    sellValue = 390,
}

-- Bags (equip into bag sockets for +bagSlots pooled inventory capacity)
BASE_ITEMS.linen_pouch = {
    id = "linen_pouch",
    name = "Linen Pouch",
    kind = "bag",
    quality = "common",
    bagSlots = 6,
    sellValue = 60,
    buyValue = 250,
}

BASE_ITEMS.travelers_knapsack = {
    id = "travelers_knapsack",
    name = "Traveler's Knapsack",
    kind = "bag",
    quality = "common",
    bagSlots = 8,
    sellValue = 500,
    buyValue = 2000,
}

BASE_ITEMS.wolfhide_satchel = {
    id = "wolfhide_satchel",
    name = "Wolfhide Satchel",
    kind = "bag",
    quality = "uncommon",
    bagSlots = 10,
    sellValue = 1200,
}

BASE_ITEMS.gravewoven_bag = {
    id = "gravewoven_bag",
    name = "Gravewoven Bag",
    kind = "bag",
    quality = "rare",
    bagSlots = 12,
    sellValue = 3500,
}

BASE_ITEMS.mistcallers_duffel = {
    id = "mistcallers_duffel",
    name = "Fogbinder's Duffel",
    kind = "bag",
    quality = "epic",
    bagSlots = 14,
    sellValue = 9000,
}

-- Food & drink (vendor)
BASE_ITEMS.baked_bread = {
    id = "baked_bread",
    name = "Cottage Loaf",
    kind = "food",
    quality = "common",
    foodHp = 61,
    sellValue = 6,
    buyValue = 25,
}

BASE_ITEMS.spring_water = {
    id = "spring_water",
    name = "Cold Well Water",
    kind = "drink",
    quality = "common",
    drinkMana = 76,
    sellValue = 6,
    buyValue = 25,
}

BASE_ITEMS.simple_fishing_pole = {
    id = "simple_fishing_pole",
    name = "Simple Fishing Pole",
    kind = "tool",
    quality = "common",
    use = {type = "fishing"},
    sellValue = 4,
    buyValue = 20,
}

-- Base gathering tools (infinite-durability, tiered by tier)
BASE_ITEMS.copper_mining_pick = {
    id = "copper_mining_pick",
    name = "Copper Mining Pick",
    kind = "tool",
    quality = "common",
    use = {type = "gatherTool", professionId = "mining", tier = 1},
    sellValue = 4,
    buyValue = 20,
}

BASE_ITEMS.iron_mining_pick = {
    id = "iron_mining_pick",
    name = "Iron Mining Pick",
    kind = "tool",
    quality = "common",
    use = {type = "gatherTool", professionId = "mining", tier = 2},
    sellValue = 10,
    buyValue = 60,
}

BASE_ITEMS.mithril_mining_pick = {
    id = "mithril_mining_pick",
    name = "Mithril Mining Pick",
    kind = "tool",
    quality = "uncommon",
    use = {type = "gatherTool", professionId = "mining", tier = 3},
    sellValue = 25,
    buyValue = 150,
}

BASE_ITEMS.handaxe = {
    id = "handaxe",
    name = "Handaxe",
    kind = "tool",
    quality = "common",
    use = {type = "gatherTool", professionId = "logging", tier = 1},
    sellValue = 4,
    buyValue = 20,
}

-- Export items
return BASE_ITEMS
