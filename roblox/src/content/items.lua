-- ============================================================================
-- Roblox Lua - Items System
-- TypeScript src/sim/content/items.ts'den dönüştürülmüştür
-- ============================================================================

local Items = {}

-- Karakter grupları (sınıf kilitli ödüller için)
local WAR = {"warrior", "paladin", "shaman"}
local MAG = {"mage", "priest", "warlock", "druid"}
local ROG = {"rogue", "hunter"}

-- ============================================================================
-- Base Items
-- ============================================================================

Items.BASE_ITEMS = {
  -- --- Başlangıç Ekipmanı ---
  worn_sword = {
    id = "worn_sword",
    name = "Pitted Shortsword",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = { min = 2, max = 5, speed = 2.0 },
    sellValue = 10,
  },
  gnarled_staff = {
    id = "gnarled_staff",
    name = "Bogoak Staff",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = { min = 3, max = 6, speed = 2.9 },
    stats = { int = 1 },
    sellValue = 12,
  },
  rusty_dagger = {
    id = "rusty_dagger",
    name = "Rusty Dagger",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = { min = 2, max = 4, speed = 1.8, dagger = true },
    sellValue = 10,
  },
  training_mace = {
    id = "training_mace",
    name = "Training Mace",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = { min = 2, max = 5, speed = 2.6 },
    sellValue = 10,
  },
  rusty_hatchet = {
    id = "rusty_hatchet",
    name = "Rusty Hatchet",
    kind = "weapon",
    slot = "mainhand",
    quality = "common",
    weapon = { min = 2, max = 5, speed = 2.2 },
    sellValue = 10,
  },
  recruit_tunic = {
    id = "recruit_tunic",
    name = "Levyman's Tunic",
    kind = "armor",
    armorType = "leather",
    slot = "chest",
    quality = "common",
    stats = { armor = 20 },
    sellValue = 5,
  },
  apprentice_robe = {
    id = "apprentice_robe",
    name = "Threadbare Robe",
    kind = "armor",
    armorType = "cloth",
    slot = "chest",
    quality = "common",
    stats = { armor = 8 },
    sellValue = 5,
  },
  footpad_jerkin = {
    id = "footpad_jerkin",
    name = "Cutpurse Jerkin",
    kind = "armor",
    armorType = "leather",
    slot = "chest",
    quality = "common",
    stats = { armor = 14 },
    sellValue = 5,
  },

  -- --- Görev Ödülü Ekipmanı ---
  redbrook_blade = {
    id = "redbrook_blade",
    name = "Redbrook Militia Blade",
    kind = "weapon",
    slot = "mainhand",
    quality = "uncommon",
    weapon = { min = 6, max = 11, speed = 2.2 },
    stats = { str = 2 },
    sellValue = 120,
    requiredClass = WAR,
  },
  apprentice_staff = {
    id = "apprentice_staff",
    name = "Vale Apprentice Staff",
    kind = "weapon",
    slot = "mainhand",
    quality = "uncommon",
    weapon = { min = 7, max = 12, speed = 3.0 },
    stats = { int = 3, sta = 1 },
    sellValue = 120,
    requiredClass = MAG,
  },
  keen_dirk = {
    id = "keen_dirk",
    name = "Keen Dirk",
    kind = "weapon",
    slot = "mainhand",
    quality = "uncommon",
    weapon = { min = 4, max = 8, speed = 1.7, dagger = true },
    stats = { agi = 2 },
    sellValue = 120,
    requiredClass = ROG,
  },
  militia_vest = {
    id = "militia_vest",
    name = "Militia Chainvest",
    kind = "armor",
    armorType = "mail",
    slot = "chest",
    quality = "uncommon",
    stats = { armor = 90, sta = 2 },
    sellValue = 150,
    requiredClass = WAR,
  },
  woven_robe = {
    id = "woven_robe",
    set = "vale_arcanist",
    name = "Valewoven Robe",
    kind = "armor",
    armorType = "cloth",
    slot = "chest",
    quality = "uncommon",
    stats = { armor = 30, int = 3, spi = 2 },
    sellValue = 150,
    requiredClass = MAG,
  },
  shadow_jerkin = {
    id = "shadow_jerkin",
    set = "greyjaw_stalker",
    name = "Shadowstitch Jerkin",
    kind = "armor",
    armorType = "leather",
    slot = "chest",
    quality = "uncommon",
    stats = { armor = 55, agi = 3 },
    sellValue = 150,
    requiredClass = ROG,
  },
  oiled_boots = {
    id = "oiled_boots",
    name = "Oiled Leather Boots",
    kind = "armor",
    armorType = "leather",
    slot = "feet",
    quality = "uncommon",
    stats = { armor = 25, agi = 1 },
    sellValue = 80,
  },
  quilted_trousers = {
    id = "quilted_trousers",
    name = "Quilted Trousers",
    kind = "armor",
    armorType = "cloth",
    slot = "legs",
    quality = "uncommon",
    stats = { armor = 30, sta = 2 },
    sellValue = 90,
  },

  -- --- Çantalar ---
  linen_pouch = {
    id = "linen_pouch",
    name = "Linen Pouch",
    kind = "bag",
    quality = "common",
    bagSlots = 6,
    sellValue = 60,
    buyValue = 250,
  },
  travelers_knapsack = {
    id = "travelers_knapsack",
    name = "Traveler's Knapsack",
    kind = "bag",
    quality = "common",
    bagSlots = 8,
    sellValue = 500,
    buyValue = 2000,
  },
  wolfhide_satchel = {
    id = "wolfhide_satchel",
    name = "Wolfhide Satchel",
    kind = "bag",
    quality = "uncommon",
    bagSlots = 10,
    sellValue = 1200,
  },

  -- --- Yiyecek ve İçecek ---
  baked_bread = {
    id = "baked_bread",
    name = "Cottage Loaf",
    kind = "food",
    quality = "common",
    foodHp = 61,
    sellValue = 6,
    buyValue = 25,
  },
  spring_water = {
    id = "spring_water",
    name = "Cold Well Water",
    kind = "drink",
    quality = "common",
    drinkMana = 76,
    sellValue = 6,
    buyValue = 25,
  },
  roasted_boar = {
    id = "roasted_boar",
    name = "Spitted Boar Haunch",
    kind = "food",
    quality = "common",
    foodHp = 117,
    sellValue = 12,
    buyValue = 100,
  },

  -- --- Aletler ---
  simple_fishing_pole = {
    id = "simple_fishing_pole",
    name = "Simple Fishing Pole",
    kind = "tool",
    quality = "common",
    use = { type = "fishing" },
    sellValue = 4,
    buyValue = 20,
  },
  copper_mining_pick = {
    id = "copper_mining_pick",
    name = "Copper Mining Pick",
    kind = "tool",
    quality = "common",
    use = { type = "gatherTool", professionId = "mining", tier = 1 },
    sellValue = 4,
    buyValue = 20,
  },
  iron_mining_pick = {
    id = "iron_mining_pick",
    name = "Iron Mining Pick",
    kind = "tool",
    quality = "common",
    use = { type = "gatherTool", professionId = "mining", tier = 2 },
    sellValue = 10,
    buyValue = 60,
  },
  mithril_mining_pick = {
    id = "mithril_mining_pick",
    name = "Mithril Mining Pick",
    kind = "tool",
    quality = "uncommon",
    use = { type = "gatherTool", professionId = "mining", tier = 3 },
    sellValue = 25,
    buyValue = 150,
  },

  -- --- İksirler ---
  minor_healing_potion = {
    id = "minor_healing_potion",
    name = "Minor Healing Potion",
    kind = "potion",
    quality = "common",
    potionHp = 90,
    sellValue = 8,
    buyValue = 40,
  },
  minor_mana_potion = {
    id = "minor_mana_potion",
    name = "Minor Mana Potion",
    kind = "potion",
    quality = "common",
    potionMana = 120,
    sellValue = 8,
    buyValue = 40,
  },
  healing_potion = {
    id = "healing_potion",
    name = "Healing Potion",
    kind = "potion",
    quality = "common",
    potionHp = 280,
    sellValue = 32,
    buyValue = 170,
  },
  mana_potion = {
    id = "mana_potion",
    name = "Mana Potion",
    kind = "potion",
    quality = "common",
    potionMana = 360,
    sellValue = 32,
    buyValue = 170,
  },
  elixir_of_the_bear = {
    id = "elixir_of_the_bear",
    name = "Elixir of the Bear",
    kind = "elixir",
    quality = "uncommon",
    elixir = { aura = "Might of the Bear", kind = "buff_sta", value = 12, duration = 900 },
    sellValue = 20,
    buyValue = 100,
  },

  -- --- Junk / Materyaller ---
  copper_ore = {
    id = "copper_ore",
    name = "Copper Ore",
    kind = "junk",
    quality = "common",
    sellValue = 4,
  },
  iron_ore = {
    id = "iron_ore",
    name = "Iron Ore",
    kind = "junk",
    quality = "common",
    sellValue = 8,
  },
  tangled_weed = {
    id = "tangled_weed",
    name = "Tangled Weed",
    kind = "junk",
    quality = "poor",
    sellValue = 1,
  },
}

-- ============================================================================
-- Utility Functions
-- ============================================================================

--- Item bilgisini ID ile al
-- @param id string - Item ID
-- @return table - Item tanımı veya nil
function Items.getItem(id)
  return Items.BASE_ITEMS[id]
end

--- Tüm itemleri getir
-- @return table - Tüm itemler
function Items.getAllItems()
  return Items.BASE_ITEMS
end

--- Item sayısını al
-- @return number - Toplam item sayısı
function Items.getItemCount()
  local count = 0
  for _ in pairs(Items.BASE_ITEMS) do
    count = count + 1
  end
  return count
end

--- Kaliteye göre itemleri filtrele
-- @param quality string - Kalite (common, uncommon, rare, epic)
-- @return table - Filtrelenmiş itemler
function Items.filterByQuality(quality)
  local result = {}
  for id, item in pairs(Items.BASE_ITEMS) do
    if item.quality == quality then
      result[id] = item
    end
  end
  return result
end

--- Türe göre itemleri filtrele
-- @param kind string - Tür (weapon, armor, bag, food, vb.)
-- @return table - Filtrelenmiş itemler
function Items.filterByKind(kind)
  local result = {}
  for id, item in pairs(Items.BASE_ITEMS) do
    if item.kind == kind then
      result[id] = item
    end
  end
  return result
end

--- Silah hasar aralığını hesapla
-- @param weaponId string - Silah ID
-- @return table - {min, max} hasar
function Items.getWeaponDamage(weaponId)
  local item = Items.getItem(weaponId)
  if item and item.weapon then
    return { min = item.weapon.min, max = item.weapon.max }
  end
  return { min = 0, max = 0 }
end

--- Sınıf için uygun itemleri getir
-- @param className string - Sınıf adı
-- @return table - Uygun itemler
function Items.getItemsForClass(className)
  local result = {}
  for id, item in pairs(Items.BASE_ITEMS) do
    if item.requiredClass == nil then
      -- Sınıf gereksinimi yoksa herkese uygun
      result[id] = item
    else
      -- Sınıf listesini kontrol et
      for _, class in ipairs(item.requiredClass) do
        if class == className then
          result[id] = item
          break
        end
      end
    end
  end
  return result
end

--- Item kaç slotu kaplıyor (çanta için)
-- @param itemId string - Item ID
-- @return number - Kaplaması gereken slot sayısı
function Items.getSlotCount(itemId)
  local item = Items.getItem(itemId)
  if not item then return 1 end
  if item.kind == "bag" then
    return 1 -- Çantalar her zaman 1 slot
  end
  return 1 -- Diğer itemler 1 slot
end

-- ============================================================================
-- Export
-- ============================================================================

return Items
