-- ============================================================================
-- Roblox Lua - World of ClaudeCraft Types Module
-- TypeScript types.ts'den dönüştürülmüştür
-- ============================================================================

local Types = {}

-- ============================================================================
-- Enum-like Constants
-- ============================================================================

-- Player Classes
Types.PlayerClasses = {
  WARRIOR = "warrior",
  PALADIN = "paladin",
  SHAMAN = "shaman",
  MAGE = "mage",
  PRIEST = "priest",
  WARLOCK = "warlock",
  DRUID = "druid",
  ROGUE = "rogue",
  HUNTER = "hunter",
}

-- Item Kinds
Types.ItemKinds = {
  WEAPON = "weapon",
  ARMOR = "armor",
  BAG = "bag",
  FOOD = "food",
  DRINK = "drink",
  POTION = "potion",
  TOOL = "tool",
  JUNK = "junk",
  ELIXIR = "elixir",
}

-- Item Quality (Rarity)
Types.ItemQuality = {
  POOR = "poor",
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary",
}

-- Armor Types
Types.ArmorTypes = {
  CLOTH = "cloth",
  LEATHER = "leather",
  MAIL = "mail",
  PLATE = "plate",
}

-- Equipment Slots
Types.EquipmentSlots = {
  MAINHAND = "mainhand",
  OFFHAND = "offhand",
  CHEST = "chest",
  HEAD = "helmet",
  HANDS = "gloves",
  FEET = "feet",
  LEGS = "legs",
  BACK = "shoulder",
  WAIST = "waist",
}

-- Aura Kinds (Buff/Debuff Types)
Types.AuraKinds = {
  -- Buffs
  BUFF_STR = "buff_str",
  BUFF_AGI = "buff_agi",
  BUFF_INT = "buff_int",
  BUFF_STA = "buff_sta",
  BUFF_SPI = "buff_spi",
  -- Debuffs
  DEBUFF_SLOW = "debuff_slow",
  DEBUFF_POISON = "debuff_poison",
  -- Special
  STUN = "stun",
  ROOT = "root",
  SILENCE = "silence",
}

-- Dungeon Difficulties
Types.DungeonDifficulties = {
  NORMAL = "normal",
  HARD = "hard",
  HEROIC = "heroic",
}

-- Damage Types
Types.DamageTypes = {
  PHYSICAL = "physical",
  FIRE = "fire",
  FROST = "frost",
  HOLY = "holy",
  NATURE = "nature",
  SHADOW = "shadow",
}

-- ============================================================================
-- Type Definitions (Documentation)
-- ============================================================================

-- ItemDef: Item tanımı
-- @class ItemDef
-- @field id string - Benzersiz item ID
-- @field name string - Görünen isim
-- @field kind string - "weapon", "armor", "bag", vb.
-- @field slot string? - Ekipman slotu
-- @field quality string - Kalite: common, uncommon, rare, epic
-- @field stats table? - Stat bonusları {str=2, int=1}
-- @field weapon table? - Silah özellikleri {min, max, speed}
-- @field armorType string? - Zırh tipi: cloth, leather, mail
-- @field stats table? - Armor ve diğer statlar
-- @field sellValue number - Satış değeri
-- @field buyValue number? - Satın alma değeri (vendor)
-- @field requiredClass table? - Gerekli sınıflar
local ItemDef = {
  id = "",
  name = "",
  kind = "",
  slot = nil,
  quality = "",
  stats = {},
  weapon = nil,
  armorType = nil,
  sellValue = 0,
  buyValue = nil,
  requiredClass = nil,
}

-- PlayerStats: Oyuncu istatistikleri
-- @class PlayerStats
-- @field hp number - Sağlık
-- @field mana number - Mana
-- @field str number - Güç
-- @field agi number - Çeviklik
-- @field int number - Zeka
-- @field sta number - Dayanıklılık
-- @field spi number - Ruh
-- @field armor number - Zırh
local PlayerStats = {
  hp = 100,
  mana = 100,
  str = 1,
  agi = 1,
  int = 1,
  sta = 1,
  spi = 1,
  armor = 0,
}

-- Entity: Oyun varlığı (NPC, oyuncu, düşman)
-- @class Entity
-- @field id string - Benzersiz ID
-- @field name string - Ad
-- @field level number - Seviye
-- @field hp number - Mevcut sağlık
-- @field maxHp number - Maksimum sağlık
-- @field mana number - Mevcut mana
-- @field maxMana number - Maksimum mana
-- @field stats PlayerStats - Taban istatistikleri
-- @field position table - {x, z} konumu
local Entity = {
  id = "",
  name = "",
  level = 1,
  hp = 100,
  maxHp = 100,
  mana = 50,
  maxMana = 50,
  stats = {},
  position = {x = 0, z = 0},
}

-- CombatResult: Dövüş sonucu
-- @class CombatResult
-- @field attacker string - Saldıran ID
-- @field target string - Hedef ID
-- @field damage number - Hasar
-- @field damageType string - Hasar türü
-- @field isCrit boolean - Kritik isabet
-- @field isMiss boolean - Kaçış
-- @field timestamp number - Zaman damgası
local CombatResult = {
  attacker = "",
  target = "",
  damage = 0,
  damageType = "",
  isCrit = false,
  isMiss = false,
  timestamp = 0,
}

-- ============================================================================
-- Utility Functions
-- ============================================================================

--- Verilen değerin belirtilen enum'da olup olmadığını kontrol et
-- @param value any - Kontrol edilecek değer
-- @param enum table - Enum tablosu
-- @return boolean - Eğer enum'da varsa true
function Types.isValidEnum(value, enum)
  for _, v in pairs(enum) do
    if v == value then return true end
  end
  return false
end

--- İstatistik bonusu hesapla
-- @param baseStat number - Taban stat
-- @param bonusPercent number - Yüzde bonus
-- @return number - Toplam stat
function Types.calculateStat(baseStat, bonusPercent)
  return baseStat * (1 + (bonusPercent or 0) / 100)
end

--- Hasar hesapla (temel hasar formülü)
-- @param baseDamage number - Temel hasar
-- @param str number - Güç stat
-- @param critChance number - Kritik şansı
-- @return table - {damage, isCrit}
function Types.calculateDamage(baseDamage, str, critChance)
  local finalDamage = baseDamage + (str * 0.5)
  local isCrit = math.random() < (critChance or 0)
  
  if isCrit then
    finalDamage = finalDamage * 1.5 -- Kritik çarpanı
  end
  
  return {
    damage = math.floor(finalDamage),
    isCrit = isCrit,
  }
end

--- Zırh azalması hesapla
-- @param armor number - Zırh değeri
-- @param attackerLevel number - Saldıranın seviyesi
-- @return number - Hasar azalması oranı
function Types.calculateArmorReduction(armor, attackerLevel)
  -- Klasik WoW formülü
  local levelDiff = attackerLevel - 60
  local denominator = 400 + (85 * math.max(levelDiff, 0))
  return armor / denominator
end

--- Mana maliyetini hesapla
-- @param baseCost number - Temel mana maliyeti
-- @param int number - Zeka stat
-- @return number - Azaltılmış maliyet
function Types.calculateManaCost(baseCost, int)
  local reduction = (int * 0.05) / 100 -- Her 20 int için %1 azalış
  return math.max(baseCost * (1 - reduction), 0)
end

--- Seviye deneyimi hesapla
-- @param level number - Hedef seviye
-- @return number - Gerekli toplam deneyim
function Types.xpToReachLevel(level)
  if level <= 1 then return 0 end
  -- Basit formül: level başına 1000 * level
  local total = 0
  for i = 1, level - 1 do
    total = total + (1000 * i)
  end
  return total
end

--- Hit şansını hesapla
-- @param casterLevel number - Saldıranın seviyesi
-- @param targetLevel number - Hedefin seviyesi
-- @return number - Hit şansı (0-1)
function Types.spellHitChance(casterLevel, targetLevel)
  local diff = casterLevel - targetLevel
  
  if diff >= 0 then
    return 0.96 -- Seviye veya üstü için %96
  else
    local missChance = (-diff * 0.02)
    return math.max(1 - missChance, 0.01)
  end
end

--- Kritik hasar çarpanı
-- @param critChance number - Kritik şansı (0-1)
-- @param critDamage number - Kritik hasar bonusu
-- @return number - Ortalama hasar çarpanı
function Types.averageCritDamage(critChance, critDamage)
  return 1 + (critChance * (critDamage - 1))
end

-- ============================================================================
-- Export
-- ============================================================================

return Types
