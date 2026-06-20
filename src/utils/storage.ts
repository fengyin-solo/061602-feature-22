import type { GameState, SaveSlot, SaveSummary } from '@/types/game'

const STORAGE_KEY = 'virtual-bird-nest-saves'
const LEGACY_STORAGE_KEY = 'virtual-bird-nest-save'

export const MAX_SLOTS = 6

const readAll = (): Record<string, SaveSlot> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.warn('读取存档失败', e)
    return {}
  }
}

const writeAll = (slots: Record<string, SaveSlot>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
  } catch (e) {
    console.warn('保存游戏失败', e)
  }
}

const buildSummary = (state: GameState, slotId: string, slotName: string): SaveSummary => {
  const aliveBirds = state.birds.filter(b => !b.isDead)
  const adultCount = aliveBirds.filter(b => b.stage === 'adult').length
  const coverBirdNames = aliveBirds
    .filter(b => b.stage !== 'egg')
    .slice(0, 3)
    .map(b => b.name)

  return {
    slotId,
    slotName,
    phase: state.phase,
    day: state.day,
    totalHatched: state.totalHatched,
    totalDied: state.totalDied,
    breedingCount: state.breedingCount,
    aliveCount: aliveBirds.length,
    adultCount,
    savedAt: Date.now(),
    score: state.score,
    coverBirdNames,
    currentWeather: state.currentWeather,
  }
}

export const migrateLegacySave = (): void => {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!legacy) return
    const state = JSON.parse(legacy) as GameState
    if (state && state.phase !== 'start') {
      const slotId = 'slot-legacy'
      const slotName = '经典存档'
      const summary = buildSummary(state, slotId, slotName)
      const slot: SaveSlot = {
        slotId,
        slotName,
        state: { ...state, slotId, slotName },
        summary,
        savedAt: summary.savedAt,
      }
      const all = readAll()
      all[slotId] = slot
      writeAll(all)
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch (e) {
    console.warn('迁移旧存档失败', e)
  }
}

export const listSaves = (): SaveSummary[] => {
  migrateLegacySave()
  const all = readAll()
  return Object.values(all)
    .map(s => s.summary)
    .sort((a, b) => b.savedAt - a.savedAt)
}

export const saveGame = (state: GameState, slotId?: string, slotName?: string): SaveSummary | null => {
  const id = slotId ?? state.slotId
  if (!id) return null
  const name = slotName ?? state.slotName ?? id
  const all = readAll()
  const summary = buildSummary(state, id, name)
  const slot: SaveSlot = {
    slotId: id,
    slotName: name,
    state: { ...state, slotId: id, slotName: name },
    summary,
    savedAt: summary.savedAt,
  }
  all[id] = slot
  writeAll(all)
  return summary
}

export const loadGame = (slotId: string): GameState | null => {
  const all = readAll()
  const slot = all[slotId]
  return slot ? slot.state : null
}

export const deleteSave = (slotId: string): void => {
  const all = readAll()
  delete all[slotId]
  writeAll(all)
}

export const clearSave = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch (e) {
    console.warn('清除存档失败', e)
  }
}

export const hasSave = (slotId: string): boolean => {
  const all = readAll()
  return !!all[slotId]
}

export const getSlotCount = (): number => {
  return Object.keys(readAll()).length
}

export const generateSlotId = (): string => {
  return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const renameSlot = (slotId: string, newName: string): void => {
  const all = readAll()
  const slot = all[slotId]
  if (!slot) return
  slot.slotName = newName
  slot.summary.slotName = newName
  slot.state.slotName = newName
  writeAll(all)
}
