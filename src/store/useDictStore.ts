import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getDicts } from '@/api/system/dict/data'
import type { DictDataVO } from '@/api/system/dict/data/types'

export type DictOption = {
  label: string
  value: string
  listClass?: string
  cssClass?: string
  raw: DictDataVO
}

type DictState = {
  cache: Map<string, DictOption[]>
  loadingMap: Map<string, Promise<DictOption[]>>

  getDict(dictType: string): DictOption[] | null
  setDict(dictType: string, options: DictOption[]): void
  removeDict(dictType: string): void
  cleanDict(): void
  loadDict(dictType: string): Promise<DictOption[]>
}

function mapDictData(items: DictDataVO[]): DictOption[] {
  return items.map((item) => ({
    label: item.dictLabel,
    value: item.dictValue,
    listClass: item.listClass,
    cssClass: item.cssClass,
    raw: item,
  }))
}

export const useDictStore = create<DictState>()(
  devtools(
    (set, get) => ({
      cache: new Map(),
      loadingMap: new Map(),

      getDict: (dictType) => {
        return get().cache.get(dictType) ?? null
      },

      setDict: (dictType, options) => {
        const next = new Map(get().cache)
        next.set(dictType, options)
        set({ cache: next })
      },

      removeDict: (dictType) => {
        const next = new Map(get().cache)
        next.delete(dictType)
        set({ cache: next })
      },

      cleanDict: () => {
        set({
          cache: new Map(),
          loadingMap: new Map(),
        })
      },

      loadDict: async (dictType) => {
        const cached = get().getDict(dictType)
        if (cached) return cached

        const loading = get().loadingMap.get(dictType)
        if (loading) return loading

        const requestPromise = getDicts(dictType)
          .then((res) => {
            const options = mapDictData(res.data ?? [])
            get().setDict(dictType, options)
            return options
          })
          .finally(() => {
            const next = new Map(get().loadingMap)
            next.delete(dictType)
            set({ loadingMap: next })
          })

        const next = new Map(get().loadingMap)
        next.set(dictType, requestPromise)
        set({ loadingMap: next })

        return requestPromise
      },
    }),
    { name: 'ruoyi-react-dict' },
  ),
)
