-- ============================================================================
-- Roblox Lua - World of ClaudeCraft Constants
-- ============================================================================

local Constants = {}

-- ============================================================================
-- Rating Dönüşümleri
-- ============================================================================

-- Her % haste için rating noktası
Constants.HASTE_RATING_PER_PCT = 32

-- Her % crit için rating noktası
Constants.CRIT_RATING_PER_PCT = 45.91

-- Her % hit için rating noktası
Constants.HIT_RATING_PER_PCT = 32.79

-- Her % dodge için rating noktası
Constants.DODGE_RATING_PER_PCT = 12.62

-- ============================================================================
-- Combat Constants
-- ============================================================================

-- Varsayılan saldırı hızı (saniye)
Constants.DEFAULT_ATTACK_SPEED = 2.0

-- Minimum hasar çarpanı
Constants.MIN_DAMAGE_MULTIPLIER = 0.25

-- Maksimum hasar çarpanı
Constants.MAX_DAMAGE_MULTIPLIER = 3.0

-- Kritik hasar çarpanı
Constants.CRIT_DAMAGE_MULTIPLIER = 1.5

-- ============================================================================
-- Experience Constants
-- ============================================================================

-- Maksimum seviye
Constants.MAX_LEVEL = 60

-- Başlangıç deneyimi
Constants.BASE_XP = 1000

-- Seviye başına XP çarpanı
Constants.XP_LEVEL_MULTIPLIER = 1

-- ============================================================================
-- Inventory Constants
-- ============================================================================

-- Başlangıç sırt çantası slotu
Constants.BASE_BACKPACK_SLOTS = 16

-- Maksimum çanta slotu
Constants.MAX_INVENTORY_SLOTS = 200

-- Maksimum çanta sayısı
Constants.MAX_BAGS = 4

-- ============================================================================
-- Character Stats Constants
-- ============================================================================

-- Başlangıç istatistikleri
Constants.BASE_STATS = {
  warrior = { str = 10, agi = 5, int = 2, sta = 10, spi = 3 },
  paladin = { str = 9, agi = 4, int = 5, sta = 9, spi = 7 },
  shaman = { str = 8, agi = 5, int = 6, sta = 8, spi = 8 },
  mage = { str = 3, agi = 4, int = 11, sta = 5, spi = 6 },
  priest = { str = 3, agi = 3, int = 9, sta = 5, spi = 9 },
  warlock = { str = 3, agi = 4, int = 10, sta = 6, spi = 7 },
  druid = { str = 6, agi = 7, int = 7, sta = 7, spi = 8 },
  rogue = { str = 6, agi = 11, int = 4, sta = 6, spi = 3 },
  hunter = { str = 7, agi = 10, int = 5, sta = 7, spi = 4 },
}

-- Her sta başına HP
Constants.HP_PER_STAMINA = 10

-- Her int başına mana
Constants.MANA_PER_INT = 10

-- ============================================================================
-- Networking Constants
-- ============================================================================

-- Heartbeat güncellemesi (saniye)
Constants.HEARTBEAT_INTERVAL = 0.1

-- Oyuncu pozisyon senkronizasyon aralığı (saniye)
Constants.PLAYER_SYNC_INTERVAL = 0.05

-- Entity despawn mesafesi (birim)
Constants.ENTITY_DESPAWN_DISTANCE = 500

-- Entity spawn mesafesi (birim)
Constants.ENTITY_SPAWN_DISTANCE = 400

-- ============================================================================
-- Dungeon Constants
-- ============================================================================

-- Maksimum grup üyesi
Constants.MAX_GROUP_SIZE = 5

-- Minimum grup üyesi
Constants.MIN_GROUP_SIZE = 1

-- Dungeon cooldown (saniye)
Constants.DUNGEON_LOCKOUT_SECONDS = 24 * 60 * 60 -- 24 saat

-- ============================================================================
-- Quest Constants
-- ============================================================================

-- Maksimum aktif görev
Constants.MAX_ACTIVE_QUESTS = 25

-- Maksimum tamamlanmış görev
Constants.MAX_COMPLETED_QUESTS = 1000

-- Görev tamamlama verilen XP
Constants.QUEST_COMPLETION_XP_MULTIPLIER = 0.25

-- ============================================================================
-- Profession Constants
-- ============================================================================

-- Maksimum mesleki beceri seviyesi
Constants.MAX_PROFESSION_LEVEL = 300

-- Başlangıç mesleki seviyesi
Constants.BASE_PROFESSION_LEVEL = 0

-- ============================================================================
-- Market/Trading Constants
-- ============================================================================

-- Market listeleme ücreti (neper)
Constants.MARKET_LISTING_TAX = 0.05 -- %5

-- Maksimum market listeleme
Constants.MAX_MARKET_LISTINGS = 100

-- Market listeleme süresi (saniye)
Constants.MARKET_LISTING_DURATION = 7 * 24 * 60 * 60 -- 7 gün

-- ============================================================================
-- Guild Constants
-- ============================================================================

-- Maksimum guild üyesi
Constants.MAX_GUILD_MEMBERS = 500

-- Guild oluşturma maliyeti (gold)
Constants.GUILD_CREATE_COST = 10000

-- ============================================================================
-- Time Constants (ms)
-- ============================================================================

Constants.SECOND_MS = 1000
Constants.MINUTE_MS = 60 * 1000
Constants.HOUR_MS = 60 * 60 * 1000
Constants.DAY_MS = 24 * 60 * 60 * 1000

return Constants
