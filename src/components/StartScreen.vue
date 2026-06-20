<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { useGameState } from '@/composables/useGameState'
import { WEATHER_NAMES } from '@/utils/constants'
import type { SaveSummary } from '@/types/game'
import { MAX_SLOTS } from '@/utils/storage'

const router = useRouter()
const { startGame, tryLoadGame, getAllSaves, removeSave, renameSave } = useGameState()

const saves = ref<SaveSummary[]>([])
const showNewSlotDialog = ref(false)
const newSlotName = ref('')
const renamingSlot = ref<string | null>(null)
const renameInput = ref('')
const confirmDeleteSlot = ref<string | null>(null)

const refreshSaves = () => {
  saves.value = getAllSaves()
}

onMounted(() => {
  refreshSaves()
})

const canCreateNew = computed(() => saves.value.length < MAX_SLOTS)

const formatTime = (ts: number) => {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const phaseBadge = (s: SaveSummary) => {
  if (s.phase === 'ended') return { text: '已结束', cls: 'bg-slate-500/60', icon: '🏁' }
  if (s.phase === 'breeding') return { text: '繁殖中', cls: 'bg-pink-500/60', icon: '💝' }
  return { text: '进行中', cls: 'bg-green-500/60', icon: '🌱' }
}

const handleStartNew = () => {
  if (!canCreateNew.value) return
  newSlotName.value = ''
  showNewSlotDialog.value = true
}

const confirmNewSlot = () => {
  const name = newSlotName.value.trim() || `第 ${saves.value.length + 1} 窝`
  startGame(undefined, name)
  showNewSlotDialog.value = false
  router.push('/game')
}

const handleLoad = (s: SaveSummary) => {
  if (s.phase === 'ended') {
    tryLoadGame(s.slotId)
    router.push('/end')
  } else {
    tryLoadGame(s.slotId)
    router.push('/game')
  }
}

const handleDelete = (slotId: string) => {
  confirmDeleteSlot.value = slotId
}

const confirmDelete = () => {
  if (confirmDeleteSlot.value) {
    removeSave(confirmDeleteSlot.value)
    confirmDeleteSlot.value = null
    refreshSaves()
  }
}

const handleRename = (s: SaveSummary) => {
  renamingSlot.value = s.slotId
  renameInput.value = s.slotName
}

const confirmRename = () => {
  if (renamingSlot.value && renameInput.value.trim()) {
    renameSave(renamingSlot.value, renameInput.value.trim())
    renamingSlot.value = null
    refreshSaves()
  }
}

const cancelRename = () => {
  renamingSlot.value = null
  renameInput.value = ''
}
</script>

<template>
  <div class="w-full h-full bg-gradient-to-br from-forest-dark via-forest to-forest-light flex items-center justify-center p-4 overflow-auto">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-10 left-10 text-6xl opacity-20 animate-float">🌳</div>
      <div class="absolute top-20 right-16 text-5xl opacity-20 animate-float" style="animation-delay: 0.5s">🌲</div>
      <div class="absolute bottom-20 left-20 text-4xl opacity-20 animate-float" style="animation-delay: 1s">🍃</div>
      <div class="absolute bottom-16 right-10 text-5xl opacity-20 animate-float" style="animation-delay: 1.5s">🌿</div>
      <div class="absolute top-1/3 left-1/4 text-3xl opacity-10 animate-bounce-slow">🐦</div>
      <div class="absolute top-1/2 right-1/3 text-3xl opacity-10 animate-bounce-slow" style="animation-delay: 0.7s">🐦</div>
    </div>

    <div class="relative z-10 max-w-5xl w-full">
      <div class="text-center mb-6 animate-pop-in">
        <div class="text-7xl mb-3 animate-bounce-slow inline-block">🪺</div>
        <h1 class="font-display text-5xl text-white text-stroke mb-2 tracking-wide">
          虚拟鸟巢
        </h1>
        <p class="text-forest-light/80 text-lg font-medium">选择一个鸟巢历程开始吧~</p>
      </div>

      <div class="glass rounded-3xl p-6 card-shadow animate-pop-in" style="animation-delay: 0.15s">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-display text-2xl text-amber-300 flex items-center gap-2">
            <span>📂</span> 我的存档
            <span class="text-sm text-white/50 font-normal">({{ saves.length }}/{{ MAX_SLOTS }})</span>
          </h2>
          <button
            v-if="canCreateNew"
            class="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl
                   font-bold btn-3d hover:from-green-400 hover:to-emerald-500 flex items-center gap-1.5 text-sm"
            @click="handleStartNew"
          >
            <span>🪺</span> 新开一窝
          </button>
          <div v-else class="text-white/40 text-sm">已达最大存档数</div>
        </div>

        <div v-if="saves.length === 0" class="text-center py-16">
          <div class="text-6xl mb-4 opacity-50">🪹</div>
          <div class="text-white/60 text-lg mb-6">还没有任何鸟巢历程，开启你的第一窝吧！</div>
          <button
            class="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl
                   font-bold text-lg btn-3d hover:from-green-400 hover:to-emerald-500 flex items-center justify-center gap-2 mx-auto"
            @click="handleStartNew"
          >
            <span class="text-xl">🥚</span> 开始孵蛋！
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="s in saves"
            :key="s.slotId"
            class="group relative bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 hover:border-amber-400/40 transition-all hover:scale-[1.02] hover:shadow-xl cursor-pointer overflow-hidden"
            @click="handleLoad(s)"
          >
            <div
              class="absolute inset-0 opacity-30 pointer-events-none transition-opacity group-hover:opacity-50"
              :class="[
                s.phase === 'ended' ? 'bg-gradient-to-br from-slate-500/40 to-purple-900/30' :
                s.phase === 'breeding' ? 'bg-gradient-to-br from-pink-500/30 to-rose-700/20' :
                'bg-gradient-to-br from-emerald-500/30 to-teal-700/20'
              ]"
            />

            <div class="relative z-10">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1 min-w-0">
                  <div v-if="renamingSlot === s.slotId" class="flex items-center gap-1" @click.stop>
                    <input
                      v-model="renameInput"
                      type="text"
                      class="flex-1 bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-amber-400/60"
                      @keyup.enter="confirmRename"
                      @keyup.escape="cancelRename"
                      ref="(el) => el && el.focus()"
                    />
                    <button class="text-green-400 text-xs px-1" @click.stop="confirmRename">✓</button>
                    <button class="text-white/50 text-xs px-1" @click.stop="cancelRename">✕</button>
                  </div>
                  <h3 v-else class="font-bold text-white text-lg truncate pr-2">{{ s.slotName }}</h3>
                </div>
                <div class="flex items-center gap-1" @click.stop>
                  <button
                    class="p-1.5 rounded-lg text-white/40 hover:text-amber-300 hover:bg-white/10 transition-all"
                    title="重命名"
                    @click="handleRename(s)"
                  >
                    ✏️
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-all"
                    title="删除"
                    @click="handleDelete(s.slotId)"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-2 mb-3">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  :class="phaseBadge(s).cls"
                >
                  {{ phaseBadge(s).icon }} {{ phaseBadge(s).text }}
                </span>
                <span class="text-white/50 text-xs">{{ formatTime(s.savedAt) }}</span>
              </div>

              <div class="grid grid-cols-3 gap-2 mb-3 text-center">
                <div class="bg-white/5 rounded-xl p-2">
                  <div class="text-xl leading-none">📅</div>
                  <div class="text-white/90 font-bold text-sm mt-1">第{{ s.day }}天</div>
                </div>
                <div class="bg-white/5 rounded-xl p-2">
                  <div class="text-xl leading-none">💚</div>
                  <div class="text-white/90 font-bold text-sm mt-1">{{ s.aliveCount }}只</div>
                </div>
                <div class="bg-white/5 rounded-xl p-2">
                  <div class="text-xl leading-none">🐦</div>
                  <div class="text-white/90 font-bold text-sm mt-1">{{ s.adultCount }}成鸟</div>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5 text-xs text-white/60 mb-3">
                <span>🥚{{ s.totalHatched }}</span>
                <span class="text-white/20">|</span>
                <span>💔{{ s.totalDied }}</span>
                <span class="text-white/20">|</span>
                <span>💝{{ s.breedingCount }}窝</span>
                <span class="text-white/20">|</span>
                <span>{{ WEATHER_NAMES[s.currentWeather] }}</span>
              </div>

              <div v-if="s.coverBirdNames.length > 0" class="flex flex-wrap gap-1">
                <span
                  v-for="name in s.coverBirdNames"
                  :key="name"
                  class="bg-amber-400/15 px-2 py-0.5 rounded-lg text-xs text-amber-200 border border-amber-400/20"
                >
                  🐦 {{ name }}
                </span>
              </div>
              <div v-else class="text-white/30 text-xs italic">蛋还在孵化中...</div>

              <div v-if="s.score" class="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div class="text-white/50 text-xs">得分</div>
                  <div class="font-display text-2xl text-yellow-300">{{ s.score.totalScore }}</div>
                </div>
                <div class="flex">
                  <span v-for="i in 5" :key="i" class="text-lg" :class="i <= s.score.stars ? '' : 'opacity-20 grayscale'">⭐</span>
                </div>
              </div>

              <div class="mt-3 pt-3 border-t border-white/10">
                <button
                  class="w-full py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5"
                  :class="s.phase === 'ended'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-400 hover:to-indigo-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'"
                >
                  <span>{{ s.phase === 'ended' ? '📖 回看结算' : '📂 继续游戏' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-5 border-t border-white/10">
          <h3 class="font-display text-lg text-amber-300 mb-4 flex items-center gap-2">
            <span>📜</span> 游戏规则
          </h3>
          <div class="grid md:grid-cols-3 gap-3">
            <div class="bg-white/5 rounded-xl p-3 border border-white/10">
              <div class="text-xl mb-1">🥚🍒🌤️</div>
              <div class="text-white/80 text-xs leading-relaxed">每窝 2~4 颗蛋独立孵化，时长影响性格。点击浆果收集食物喂食，天气变化影响属性！</div>
            </div>
            <div class="bg-white/5 rounded-xl p-3 border border-white/10">
              <div class="text-xl mb-1">📈💔</div>
              <div class="text-white/80 text-xs leading-relaxed">五段成长：蛋→雏鸟→幼鸟→亚成鸟→成鸟。健康过低会死亡，埋葬影响同伴心理。</div>
            </div>
            <div class="bg-white/5 rounded-xl p-3 border border-white/10">
              <div class="text-xl mb-1">🏆💝</div>
              <div class="text-white/80 text-xs leading-relaxed">成鸟后可放飞或配对繁殖，根据成活率、健康、繁殖、照料综合评分！</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showNewSlotDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="showNewSlotDialog = false">
      <div class="glass rounded-3xl p-6 w-full max-w-sm card-shadow animate-pop-in">
        <h3 class="font-display text-2xl text-amber-300 mb-4 flex items-center gap-2">
          <span>🪺</span> 开启新的一窝
        </h3>
        <div class="mb-5">
          <label class="text-white/70 text-sm mb-2 block">给这窝起个名字吧（可选）</label>
          <input
            v-model="newSlotName"
            type="text"
            placeholder="例如：春天的第一窝"
            class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50"
            @keyup.enter="confirmNewSlot"
          />
        </div>
        <div class="flex gap-3">
          <button
            class="flex-1 py-3 rounded-xl font-bold bg-white/10 text-white/70 hover:bg-white/20 transition-all"
            @click="showNewSlotDialog = false"
          >
            取消
          </button>
          <button
            class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 transition-all flex items-center justify-center gap-1.5"
            @click="confirmNewSlot"
          >
            <span>🥚</span> 开始孵蛋！
          </button>
        </div>
      </div>
    </div>

    <div v-if="confirmDeleteSlot" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="confirmDeleteSlot = null">
      <div class="glass rounded-3xl p-6 w-full max-w-sm card-shadow animate-pop-in">
        <h3 class="font-display text-2xl text-red-400 mb-3 flex items-center gap-2">
          <span>🗑️</span> 确认删除
        </h3>
        <p class="text-white/70 mb-6">确定要删除这个鸟巢历程吗？删除后无法恢复哦~</p>
        <div class="flex gap-3">
          <button
            class="flex-1 py-3 rounded-xl font-bold bg-white/10 text-white/70 hover:bg-white/20 transition-all"
            @click="confirmDeleteSlot = null"
          >
            取消
          </button>
          <button
            class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500 transition-all flex items-center justify-center gap-1.5"
            @click="confirmDelete"
          >
            <span>💔</span> 确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
