--[[
    World of ClaudeCraft - Types & Interfaces
    Roblox Lua Adaptation
    
    Core type definitions and utility functions
]]

-- Player Classes
local PlayerClasses = {
    "warrior",
    "paladin",
    "shaman",
    "mage",
    "priest",
    "warlock",
    "druid",
    "rogue",
    "hunter"
}

-- Item qualities
local ItemQualities = {
    "common",
    "uncommon",
    "rare",
    "epic",
    "legendary"
}

-- Aura kinds
local AuraKinds = {
    "damage",
    "heal",
    "shield",
    "buff",
    "debuff",
    "crowd_control",
    "form"
}

-- Stat constants
local HASTE_RATING_PER_PCT = 32
local CRIT_RATING_PER_PCT = 14
local HIT_RATING_PER_PCT = 12

-- Utility functions for stat conversions
local function hasteFractionFromRating(rating)
    return rating / (HASTE_RATING_PER_PCT * 100)
end

local function critFractionFromRating(rating)
    return rating / (CRIT_RATING_PER_PCT * 100)
end

local function hitFractionFromRating(rating)
    return rating / (HIT_RATING_PER_PCT * 100)
end

-- Check if class is a pet class
local function isPetClass(cls)
    local petClasses = {"mage", "warlock", "hunter", "druid"}
    for _, petClass in ipairs(petClasses) do
        if cls == petClass then
            return true
        end
    end
    return false
end

-- Check if value is a dungeon difficulty
local function isDungeonDifficulty(value)
    if type(value) ~= "string" then
        return false
    end
    local difficulties = {"normal", "heroic", "mythic"}
    for _, difficulty in ipairs(difficulties) do
        if value == difficulty then
            return true
        end
    end
    return false
end

-- Check if aura kind is a form
local function isFormAuraKind(kind)
    local formKinds = {"bear_form", "cat_form", "aquatic_form", "travel_form"}
    for _, formKind in ipairs(formKinds) do
        if kind == formKind then
            return true
        end
    end
    return false
end

-- Item slot types
local ItemSlots = {
    "mainhand",
    "offhand",
    "chest",
    "legs",
    "feet",
    "hands",
    "head",
    "shoulder",
    "back",
    "waist",
    "wrist",
    "neck",
    "finger",
    "trinket"
}

-- Armor types
local ArmorTypes = {
    "cloth",
    "leather",
    "mail",
    "plate"
}

-- Weapon types
local WeaponTypes = {
    "sword",
    "axe",
    "mace",
    "dagger",
    "staff",
    "bow",
    "wand",
    "fist"
}

-- Stat types
local StatTypes = {
    "str",      -- Strength
    "agi",      -- Agility
    "sta",      -- Stamina
    "int",      -- Intellect
    "spi",      -- Spirit
    "armor",    -- Armor
    "fire_res", -- Fire Resistance
    "frost_res",-- Frost Resistance
    "nature_res",-- Nature Resistance
    "arcane_res",-- Arcane Resistance
    "shadow_res" -- Shadow Resistance
}

-- Item definition template
local ItemDefTemplate = {
    id = "",
    name = "",
    kind = "", -- "weapon", "armor", "food", "drink", "tool", "bag", "quest", "misc"
    quality = "common",
    slot = nil,
    stats = {},
    
    -- For weapons
    weapon = nil, -- {min, max, speed, dagger=bool, ...}
    
    -- For armor
    armorType = nil,
    
    -- For bags
    bagSlots = nil,
    
    -- For consumables
    foodHp = nil,
    drinkMana = nil,
    
    -- For tools
    use = nil, -- {type, ...}
    
    -- For sets
    set = nil,
    
    -- Restrictions
    requiredClass = nil,
    requiredLevel = nil,
    
    -- Values
    sellValue = 0,
    buyValue = nil,
}

-- Inventory slot
local InvSlotTemplate = {
    itemId = nil,
    quantity = 1,
    enchantments = {},
}

-- Clone inventory slot
local function cloneInvSlot(slot)
    local cloned = {}
    for k, v in pairs(slot) do
        if type(v) == "table" then
            cloned[k] = {}
            for k2, v2 in pairs(v) do
                cloned[k][k2] = v2
            end
        else
            cloned[k] = v
        end
    end
    return cloned
end

-- Entity stats structure
local EntityStatsTemplate = {
    str = 0,
    agi = 0,
    sta = 0,
    int = 0,
    spi = 0,
    armor = 0,
    hp = 0,
    mana = 0,
    damage = 0,
    attackPower = 0,
    spellPower = 0,
    crit = 0,
    haste = 0,
    hit = 0,
}

-- Aura structure
local AuraTemplate = {
    kind = "",
    name = "",
    auraId = "",
    casterPid = nil,
    duration = 0,
    startTime = 0,
    perTick = 0,
    interval = 0,
    mult = 1.0,
    stackCount = 1,
}

-- Creature/NPC yell types
local YellTypesTemplate = {
    engage = nil,
    summon = nil,
    enrage = nil,
}

-- Experience constants
local XP_PER_LEVEL = {
    0,      -- Level 1
    100,    -- Level 2
    250,
    450,
    700,
    1000,   -- Level 6
    1350,
    1750,
    2200,
    2700,   -- Level 10
    3250,
    3850,
    4500,
    5200,
    5950,   -- Level 15
    6750,
    7600,
    8500,
    9450,
    10450,  -- Level 20
}

-- Calculate XP needed to reach a level
local function xpToReachLevel(level)
    local total = 0
    for i = 1, math.min(level - 1, #XP_PER_LEVEL) do
        total = total + XP_PER_LEVEL[i]
    end
    return total
end

-- Calculate virtual level from lifetime XP
local function virtualLevel(lifetimeXp)
    local level = 1
    local totalXp = 0
    
    for i = 1, #XP_PER_LEVEL do
        if totalXp + XP_PER_LEVEL[i] <= lifetimeXp then
            totalXp = totalXp + XP_PER_LEVEL[i]
            level = i + 1
        else
            break
        end
    end
    
    return level
end

-- Get virtual level progress (0.0 to 1.0)
local function virtualLevelProgress(lifetimeXp)
    local level = virtualLevel(lifetimeXp)
    local currentLevelXp = xpToReachLevel(level)
    local nextLevelXp = currentLevelXp + (XP_PER_LEVEL[level] or 0)
    
    if nextLevelXp <= currentLevelXp then
        return {level = level, progress = 1.0}
    end
    
    local progressInLevel = lifetimeXp - currentLevelXp
    local totalForLevel = nextLevelXp - currentLevelXp
    
    return {
        level = level,
        progress = progressInLevel / totalForLevel
    }
end

-- Progression requirement types
local ProgressionRequirementTypes = {
    "level",
    "quest",
    "quests",
    "achievement",
    "faction",
    "item",
    "skill"
}

-- Delve unlock structure
local DelveUnlockTemplate = {
    delveId = "",
    tierId = "",
    clears = 0,
}

-- Position template
local PositionTemplate = {
    x = 0,
    z = 0,
}

-- 2D segment template (for paths)
local SegmentTemplate = {
    from = {x = 0, z = 0},
    to = {x = 0, z = 0},
}

-- Dungeon door position
local DoorPosTemplate = {
    x = 0,
    z = 0,
}

-- Origin point
local OriginTemplate = {
    x = 0,
    z = 0,
}

-- Ability types
local AbilityTypes = {
    "melee",
    "ranged",
    "spell",
    "heal",
    "buff",
    "debuff",
    "crowd_control",
    "utility"
}

-- Combat event types
local CombatEventTypes = {
    "damage",
    "heal",
    "miss",
    "crit",
    "dodge",
    "parry",
    "block",
    "absorb",
    "reflect"
}

-- Experience table
local EXPERIENCE_TABLE = {}
for i = 1, 20 do
    EXPERIENCE_TABLE[i] = xpToReachLevel(i)
end

-- Berserker crit damage calculation
local function berserkerCritDamage(entity)
    if not entity.stats then return 1.5 end
    -- Base 50% crit damage + bonuses from stats
    local bonus = (entity.stats.int or 0) * 0.01
    return 1.5 + bonus
end

-- Miss chance functions
local function aboveLevelMissPct(diff)
    if diff <= 0 then return 0 end
    if diff >= 10 then return 100 end
    return diff * 5
end

local function spellHitChance(casterLevel, targetLevel)
    local diff = targetLevel - casterLevel
    return math.max(0, 96 - aboveLevelMissPct(diff))
end

local function meleeMissChance(attackerLevel, targetLevel)
    local diff = targetLevel - attackerLevel
    return math.min(100, aboveLevelMissPct(diff))
end

local function swingMissChance(attacker, target)
    if not attacker or not target then return 0 end
    local diff = (target.level or 1) - (attacker.level or 1)
    return meleeMissChance(attacker.level or 1, target.level or 1)
end

-- Armor reduction calculation
local function armorReduction(armor, attackerLevel)
    local levelFactor = attackerLevel * 5
    local reduction = armor / (armor + levelFactor)
    return math.min(0.75, reduction) -- Cap at 75% reduction
end

-- Export all types and functions
return {
    -- Constants
    PlayerClasses = PlayerClasses,
    ItemQualities = ItemQualities,
    AuraKinds = AuraKinds,
    ItemSlots = ItemSlots,
    ArmorTypes = ArmorTypes,
    WeaponTypes = WeaponTypes,
    StatTypes = StatTypes,
    AbilityTypes = AbilityTypes,
    CombatEventTypes = CombatEventTypes,
    ProgressionRequirementTypes = ProgressionRequirementTypes,
    
    -- Stat constants
    HASTE_RATING_PER_PCT = HASTE_RATING_PER_PCT,
    CRIT_RATING_PER_PCT = CRIT_RATING_PER_PCT,
    HIT_RATING_PER_PCT = HIT_RATING_PER_PCT,
    EXPERIENCE_TABLE = EXPERIENCE_TABLE,
    
    -- Templates
    ItemDefTemplate = ItemDefTemplate,
    InvSlotTemplate = InvSlotTemplate,
    EntityStatsTemplate = EntityStatsTemplate,
    AuraTemplate = AuraTemplate,
    YellTypesTemplate = YellTypesTemplate,
    DelveUnlockTemplate = DelveUnlockTemplate,
    PositionTemplate = PositionTemplate,
    SegmentTemplate = SegmentTemplate,
    DoorPosTemplate = DoorPosTemplate,
    OriginTemplate = OriginTemplate,
    
    -- Utility functions
    hasteFractionFromRating = hasteFractionFromRating,
    critFractionFromRating = critFractionFromRating,
    hitFractionFromRating = hitFractionFromRating,
    isPetClass = isPetClass,
    isDungeonDifficulty = isDungeonDifficulty,
    isFormAuraKind = isFormAuraKind,
    cloneInvSlot = cloneInvSlot,
    xpToReachLevel = xpToReachLevel,
    virtualLevel = virtualLevel,
    virtualLevelProgress = virtualLevelProgress,
    berserkerCritDamage = berserkerCritDamage,
    spellHitChance = spellHitChance,
    meleeMissChance = meleeMissChance,
    swingMissChance = swingMissChance,
    armorReduction = armorReduction,
}
