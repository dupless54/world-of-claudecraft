# World of ClaudeCraft - Roblox Lua Dönüşümü

## Proje Takvimi

Bu klasör, World of ClaudeCraft'ın TypeScript kodlarının Roblox Lua'ya dönüştürüldüğü versiyonunu içerir.

### Struktur
```
roblox/
├── src/
│   ├── types.lua              # Tip tanımlamaları ve Utilities
│   ├── constants.lua          # Sabitler
│   ├── content/               # İçerik sistemleri
│   │   ├── items.lua          # Eşya sistemi
│   │   ├── classes.lua        # Sınıf sistemleri
│   │   ├── recipes.lua        # Tarif sistemleri
│   │   └── ...
│   ├── sim/                   # Simülasyon motoru
│   │   ├── entity.lua         # Varlık sistemi
│   │   ├── sim_context.lua    # Oyun bağlamı
│   │   ├── combat.lua         # Dövüş sistemi
│   │   ├── inventory.lua      # Envanter sistemi
│   │   └── ...
│   └── network/               # Ağ/Multiplayer sistemi
│       ├── replication.lua    # Veri çoğaltması
│       ├── sync.lua           # Senkronizasyon
│       └── ...
├── server/
│   ├── main.server.lua        # Server başlangıcı
│   ├── game_server.lua        # Oyun server lojiği
│   └── database.lua           # Veri tabanı yönetimi
├── client/
│   ├── main.client.lua        # Client başlangıcı
│   ├── ui/                    # Kullanıcı arayüzü
│   └── render.lua             # Grafik render
└── shared/
    └── utilities.lua          # Paylaşılan yardımcı fonksiyonlar
```

## Dönüşüm Aşamaları

### Faz 1: Temel Tipler ve Constantlar ✅
- [x] types.lua - Tüm TypeScript type'larını Lua tablosu tanımlamalarına dönüştür
- [x] constants.lua - Sabit değerler
- [x] items.lua - Eşya sistemi

### Faz 2: İçerik Sistemleri (Devam Ediyor)
- [ ] classes.lua - Sınıf tanımlamaları ve yetenekler
- [ ] recipes.lua - Tarif ve crafting
- [ ] talents.lua - Yetenek ağacı
- [ ] quests.lua - Görev sistemi
- [ ] dungeons.lua - Zindan konfigürasyonu

### Faz 3: Simülasyon Motoru
- [ ] entity.lua - Varlık sistem ve özellikler
- [ ] sim_context.lua - Oyun durumu yönetimi
- [ ] combat.lua - Dövüş mekanikleri
- [ ] inventory.lua - Envanter ve item yönetimi
- [ ] skills.lua - Beceri sistemi

### Faz 4: Ağ ve Multiplayer
- [ ] replication.lua - Sunucudan istemciye veri aktarımı
- [ ] sync.lua - Veri senkronizasyonu
- [ ] network_events.lua - RPC/Uzak fonksiyon çağrıları

### Faz 5: Server Mantığı
- [ ] game_server.lua - Ana sunucu döngüsü
- [ ] npc.lua - NPC yönetimi
- [ ] events.lua - Oyun olayları

### Faz 6: Client/UI
- [ ] ui.lua - Arayüz sistemleri
- [ ] input.lua - Oyuncu girdisi
- [ ] render.lua - Grafik sistemi

## Önemli Farklar: TypeScript → Lua

### 1. Type Sistemi
```typescript
// TypeScript
export interface ItemDef {
  id: string;
  name: string;
  kind: 'weapon' | 'armor' | 'bag';
  stats?: Record<string, number>;
}
```

```lua
-- Lua
local ItemDef = {
  id = "",
  name = "",
  kind = "", -- "weapon", "armor", "bag"
  stats = {},
}
```

### 2. Module Sistemi
```typescript
// TypeScript
export const BASE_ITEMS: Record<string, ItemDef> = { ... }
export function getItem(id: string): ItemDef { ... }
```

```lua
-- Lua
local BASE_ITEMS = { ... }
local function getItem(id)
  return BASE_ITEMS[id]
end

return {
  BASE_ITEMS = BASE_ITEMS,
  getItem = getItem,
}
```

### 3. Sınıf ve Kalıtım
```typescript
// TypeScript
class Entity {
  hp: number;
  takeDamage(dmg: number) { ... }
}
```

```lua
-- Lua
local Entity = {}
Entity.__index = Entity

function Entity.new()
  local self = setmetatable({}, Entity)
  self.hp = 100
  return self
end

function Entity:takeDamage(dmg)
  self.hp = self.hp - dmg
end
```

### 4. Promises/Async → Callbacks/Coroutines
```typescript
// TypeScript
async function loadPlayer(id: string): Promise<Player> {
  const data = await db.get(`player:${id}`);
  return new Player(data);
}
```

```lua
-- Lua
local function loadPlayer(id, callback)
  db:getAsync(`player:{id}`, function(data)
    local player = Player.new(data)
    callback(player)
  end)
end
```

## Roblox Spesifik İşlemler

### RemoteEvents (RPC)
```lua
-- Server
local PlayerAttack = Instance.new("RemoteEvent")
PlayerAttack.Name = "PlayerAttack"
PlayerAttack.Parent = ReplicatedStorage

PlayerAttack.OnServerEvent:Connect(function(player, targetId)
  local target = Sim:findEntity(targetId)
  player.entity:attack(target)
end)

-- Client
local PlayerAttack = ReplicatedStorage:WaitForChild("PlayerAttack")
UserInputService.InputBegan:Connect(function(input, gpe)
  if input.KeyCode == Enum.KeyCode.Z then
    PlayerAttack:FireServer(targetEntity.id)
  end
end)
```

## Dönüşüm İpuçları

1. **Record<K, V> → {...}** : TypeScript maps, Lua tablolarına dönüşür
2. **enum → string constants** : Lua'da string ve sayı olarak temsil edilir
3. **Interface → documentation comments** : Lua'da type hints kullanılmaz
4. **for...of → ipairs/pairs** : Lua iteration
5. **async/await → callbacks/RBXScriptSignal** : Roblox event sistemi
6. **.map()/.filter() → for loops** : Lua'da tablo işlemleri

## İlk Adımlar

1. `src/types.lua` dosyasını inceleyin
2. `src/content/items.lua` ile başlayın
3. Server script'i `server/main.server.lua` dosyasına yerleştirin
4. Client script'i `client/main.client.lua` dosyasına yerleştirin

## Sorunlar ve Çözümler

Lua'da TypeScript'in bazı özellikleri yoktur:
- **Type checking** : Runtime validation gereken
- **Interfaces** : Tablo yapısı ve comment kullan
- **Generics** : Dokümantasyon ile belirt
- **Strict mode** : Değişken adlarını dikkatli seç

## Katkıda Bulunma

Eğer dönüşüm sırasında hatalar bulursanız veya iyileştirmeler varsa, pull request açın.

---

**Başlangıç Tarihi**: 2026-07-22
**Hedef**: Tam uyumlu Roblox uyarlaması
**Durum**: 🟡 Devam Ediyor
