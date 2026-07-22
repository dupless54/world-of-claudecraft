--[[
    World of ClaudeCraft - Entity System
    Roblox Lua Adaptation
    
    Core entity/character data structures and functions
]]

local Types = require(script.Parent:WaitForChild("types"))

-- Entity template (Player or NPC)
local EntityTemplate = {
    -- Identity
    pid = nil,              -- Player ID (nil for NPCs)
    name = "",
    level = 1,
    class = "warrior",
    race = "human",
    
    -- Position & movement
    x = 0,
    z = 0,
    heading = 0,            -- Radians (0 = facing positive X)
    movementSpeed = 1.0,
    
    -- Health & mana
    hp = 100,
    maxHp = 100,
    mana = 50,
    maxMana = 50,
    
    -- Stats
    stats = {
        str = 10,
        agi = 10,
        sta = 10,
        int = 10,
        spi = 10,
        armor = 0,
        fireRes = 0,
        frostRes = 0,
        natureRes = 0,
        arcaneRes = 0,
        shadowRes = 0,
    },
    
    -- Equipment
    equipment = {
        mainhand = nil,
        offhand = nil,
        chest = nil,
        legs = nil,
        feet = nil,
        hands = nil,
        head = nil,
        shoulder = nil,
        back = nil,
        waist = nil,
        wrist = nil,
        neck = nil,
        finger = nil,
        trinket = nil,
    },
    
    -- Inventory
    bags = {},              -- Equipped bags for inventory
    inventory = {},         -- Items in bags
    
    -- Auras (buffs/debuffs)
    auras = {},
    
    -- Combat state
    inCombat = false,
    target = nil,           -- Target entity ID
    threat = 0,             -- Threat value for NPCs
    
    -- Experience & progression
    experience = 0,
    lifetimeExp = 0,
    
    -- Abilities & cooldowns
    abilities = {},
    cooldowns = {},
    
    -- Yells for NPCs
    yells = {
        engage = nil,
        summon = nil,
        enrage = nil,
    },
    
    -- Faction/reputation
    faction = nil,
    reputation = 0,
    
    -- Status effects
    isDead = false,
    isStunned = false,
    isSilenced = false,
    isRooted = false,
}

-- Create a new entity instance
local function createEntity(data)
    local entity = {}
    
    -- Copy template
    for k, v in pairs(EntityTemplate) do
        if type(v) == "table" then
            entity[k] = {}
            for k2, v2 in pairs(v) do
                entity[k][k2] = v2
            end
        else
            entity[k] = v
        end
    end
    
    -- Apply custom data
    if data then
        for k, v in pairs(data) do
            if type(v) == "table" and type(entity[k]) == "table" then
                for k2, v2 in pairs(v) do
                    entity[k][k2] = v2
                end
            else
                entity[k] = v
            end
        end
    end
    
    return entity
end

-- Calculate total armor from equipment
local function calculateTotalArmor(entity)
    local total = entity.stats.armor or 0
    
    for slot, item in pairs(entity.equipment) do
        if item and item.stats and item.stats.armor then
            total = total + item.stats.armor
        end
    end
    
    return total
end

-- Calculate total stats from equipment
local function calculateTotalStats(entity)
    local stats = {}
    for stat, value in pairs(Types.StatTypes) do
        stats[value] = entity.stats[value] or 0
    end
    
    -- Add equipment stats
    for slot, item in pairs(entity.equipment) do
        if item and item.stats then
            for stat, value in pairs(item.stats) do
                stats[stat] = (stats[stat] or 0) + value
            end
        end
    end
    
    return stats
end

-- Get inventory capacity from bags
local function getInventoryCapacity(entity)
    local baseCapacity = 20  -- Base inventory slots
    local bagCapacity = 0
    
    if entity.bags then
        for _, bag in ipairs(entity.bags) do
            if bag and bag.bagSlots then
                bagCapacity = bagCapacity + bag.bagSlots
            end
        end
    end
    
    return baseCapacity + bagCapacity
end

-- Count items in inventory
local function countInventoryItems(entity)
    local count = 0
    
    if entity.inventory then
        for _, item in ipairs(entity.inventory) do
            if item then
                count = count + (item.quantity or 1)
            end
        end
    end
    
    return count
end

-- Get available inventory space
local function getAvailableInventorySpace(entity)
    local capacity = getInventoryCapacity(entity)
    local used = countInventoryItems(entity)
    return capacity - used
end

-- Add item to inventory
local function addItemToInventory(entity, itemId, quantity)
    if not entity.inventory then
        entity.inventory = {}
    end
    
    quantity = quantity or 1
    
    -- Try to stack with existing item
    for _, slot in ipairs(entity.inventory) do
        if slot.itemId == itemId then
            slot.quantity = (slot.quantity or 1) + quantity
            return true
        end
    end
    
    -- Add new item
    if #entity.inventory < getInventoryCapacity(entity) then
        table.insert(entity.inventory, {
            itemId = itemId,
            quantity = quantity,
            enchantments = {},
        })
        return true
    end
    
    return false
end

-- Remove item from inventory
local function removeItemFromInventory(entity, itemId, quantity)
    quantity = quantity or 1
    
    if not entity.inventory then
        return false
    end
    
    for i, slot in ipairs(entity.inventory) do
        if slot.itemId == itemId then
            slot.quantity = (slot.quantity or 1) - quantity
            if slot.quantity <= 0 then
                table.remove(entity.inventory, i)
            end
            return true
        end
    end
    
    return false
end

-- Get item count in inventory
local function getItemCount(entity, itemId)
    if not entity.inventory then
        return 0
    end
    
    for _, slot in ipairs(entity.inventory) do
        if slot.itemId == itemId then
            return slot.quantity or 1
        end
    end
    
    return 0
end

-- Equip item to slot
local function equipItem(entity, itemId, slot)
    local item = nil
    
    -- Find item in inventory
    if entity.inventory then
        for _, invSlot in ipairs(entity.inventory) do
            if invSlot.itemId == itemId then
                item = invSlot
                break
            end
        end
    end
    
    if not item then
        return false
    end
    
    -- Unequip current item in slot
    local oldItem = entity.equipment[slot]
    if oldItem then
        addItemToInventory(entity, oldItem.id, 1)
    end
    
    -- Equip new item
    entity.equipment[slot] = item
    removeItemFromInventory(entity, itemId, 1)
    
    return true
end

-- Unequip item from slot
local function unequipItem(entity, slot)
    local item = entity.equipment[slot]
    
    if not item then
        return false
    end
    
    if addItemToInventory(entity, item.id, 1) then
        entity.equipment[slot] = nil
        return true
    end
    
    return false
end

-- Add aura to entity
local function addAura(entity, aura)
    if not entity.auras then
        entity.auras = {}
    end
    
    -- Check if aura already exists
    for _, existing in ipairs(entity.auras) do
        if existing.auraId == aura.auraId then
            existing.stackCount = (existing.stackCount or 1) + 1
            return
        end
    end
    
    table.insert(entity.auras, aura)
end

-- Remove aura from entity
local function removeAura(entity, auraId)
    if not entity.auras then
        return
    end
    
    for i, aura in ipairs(entity.auras) do
        if aura.auraId == auraId then
            table.remove(entity.auras, i)
            return true
        end
    end
    
    return false
end

-- Check if entity has aura
local function hasAura(entity, auraId)
    if not entity.auras then
        return false
    end
    
    for _, aura in ipairs(entity.auras) do
        if aura.auraId == auraId then
            return true
        end
    end
    
    return false
end

-- Get movement speed multiplier from auras
local function getMovementSpeedMultiplier(entity)
    local mult = 1.0
    
    if entity.auras then
        for _, aura in ipairs(entity.auras) do
            if aura.kind == "movement_speed_buff" then
                mult = mult * (aura.mult or 1.0)
            elseif aura.kind == "movement_speed_debuff" then
                mult = mult / (aura.mult or 1.0)
            end
        end
    end
    
    return mult
end

-- Get effective movement speed
local function getEffectiveMovementSpeed(entity)
    local baseSpeed = entity.movementSpeed or 1.0
    return baseSpeed * getMovementSpeedMultiplier(entity)
end

-- Get damage multiplier from stats and auras
local function getDamageMultiplier(entity)
    local mult = 1.0
    local str = calculateTotalStats(entity).str or 10
    
    -- Strength contributes to damage
    mult = mult * (1.0 + (str - 10) * 0.01)
    
    -- Apply aura multipliers
    if entity.auras then
        for _, aura in ipairs(entity.auras) do
            if aura.kind == "damage_buff" then
                mult = mult * (aura.mult or 1.0)
            elseif aura.kind == "damage_debuff" then
                mult = mult / (aura.mult or 1.0)
            end
        end
    end
    
    return mult
end

-- Get spell power from stats
local function getSpellPower(entity)
    local stats = calculateTotalStats(entity)
    local int = stats.int or 10
    local spi = stats.spi or 10
    
    return (int - 10) * 2 + (spi - 10)
end

-- Get attack power from stats
local function getAttackPower(entity)
    local stats = calculateTotalStats(entity)
    local str = stats.str or 10
    
    return (str - 10) * 2
end

-- Take damage
local function takeDamage(entity, amount, damageType)
    damageType = damageType or "physical"
    
    -- Apply armor reduction for physical damage
    if damageType == "physical" then
        local armor = calculateTotalArmor(entity)
        local reduction = Types.armorReduction(armor, 1)
        amount = amount * (1 - reduction)
    end
    
    -- Apply resistance for magical damage
    local resistType = damageType .. "Res"
    if entity.stats[resistType] then
        local resistance = entity.stats[resistType] / 100
        amount = amount * (1 - math.min(0.75, resistance))
    end
    
    entity.hp = math.max(0, entity.hp - amount)
    
    if entity.hp <= 0 then
        entity.isDead = true
    end
    
    return amount
end

-- Heal entity
local function healEntity(entity, amount)
    local oldHp = entity.hp
    entity.hp = math.min(entity.maxHp, entity.hp + amount)
    entity.isDead = false
    return entity.hp - oldHp
end

-- Restore mana
local function restoreMana(entity, amount)
    local oldMana = entity.mana
    entity.mana = math.min(entity.maxMana, entity.mana + amount)
    return entity.mana - oldMana
end

-- Check if entity is alive
local function isAlive(entity)
    return entity.hp > 0 and not entity.isDead
end

-- Get entity distance to another entity
local function distanceTo(entity1, entity2)
    local dx = entity2.x - entity1.x
    local dz = entity2.z - entity1.z
    return math.sqrt(dx * dx + dz * dz)
end

-- Export entity functions
return {
    EntityTemplate = EntityTemplate,
    
    -- Creation
    createEntity = createEntity,
    
    -- Stats
    calculateTotalArmor = calculateTotalArmor,
    calculateTotalStats = calculateTotalStats,
    getSpellPower = getSpellPower,
    getAttackPower = getAttackPower,
    getDamageMultiplier = getDamageMultiplier,
    
    -- Inventory
    getInventoryCapacity = getInventoryCapacity,
    countInventoryItems = countInventoryItems,
    getAvailableInventorySpace = getAvailableInventorySpace,
    addItemToInventory = addItemToInventory,
    removeItemFromInventory = removeItemFromInventory,
    getItemCount = getItemCount,
    equipItem = equipItem,
    unequipItem = unequipItem,
    
    -- Auras
    addAura = addAura,
    removeAura = removeAura,
    hasAura = hasAura,
    getMovementSpeedMultiplier = getMovementSpeedMultiplier,
    getEffectiveMovementSpeed = getEffectiveMovementSpeed,
    
    -- Combat
    takeDamage = takeDamage,
    healEntity = healEntity,
    restoreMana = restoreMana,
    isAlive = isAlive,
    distanceTo = distanceTo,
}
