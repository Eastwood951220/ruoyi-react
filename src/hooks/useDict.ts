import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDictStore, type DictOption } from '@/store/useDictStore'

type DictResult<T extends string> = Record<T, DictOption[]>

/**
 * 订阅字典数据。
 *
 * 优化点：只订阅指定 dictType 的数据，避免其他字典变化触发重渲染。
 * 使用 useShallow 做浅比较，避免 selector 返回新对象导致无限循环。
 */
export function useDict<T extends string>(...dictTypes: T[]): DictResult<T> {
  const loadDict = useDictStore((state) => state.loadDict)

  // 稳定化 dictTypes 引用，避免 effect 和 selector 无限触发
  const stableKey = dictTypes.join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableTypes = useMemo(() => dictTypes, [stableKey])

  // 触发加载（只在首次缺少时）
  useEffect(() => {
    const store = useDictStore.getState()
    stableTypes.forEach((dictType) => {
      if (!store.getDict(dictType)) {
        void loadDict(dictType)
      }
    })
    // loadDict 是稳定引用，不需要加入依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, stableTypes)

  // 只订阅指定 dictType 的缓存值，useShallow 做浅比较
  return useDictStore(
    useShallow((state) => {
      const partial = {} as DictResult<T>
      for (const dictType of stableTypes) {
        partial[dictType] = state.cache.get(dictType) ?? []
      }
      return partial
    }),
  )
}
