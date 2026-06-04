import { useEffect } from 'react'
import { useDictStore, type DictOption } from '@/store/useDictStore'

type DictResult<T extends string> = Record<T, DictOption[]>

/**
 * 订阅字典数据。
 *
 * 优化点：只订阅指定 dictType 的数据，避免其他字典变化触发重渲染。
 */
export function useDict<T extends string>(...dictTypes: T[]): DictResult<T> {
  const loadDict = useDictStore((state) => state.loadDict)

  // 触发加载（只在首次缺少时）
  useEffect(() => {
    const store = useDictStore.getState()
    dictTypes.forEach((dictType) => {
      if (!store.getDict(dictType)) {
        void loadDict(dictType)
      }
    })
    // loadDict 是稳定引用，不需要加入依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dictTypes)

  // 只订阅指定 dictType 的缓存值
  return useDictStore((state) => {
    const partial = {} as DictResult<T>
    for (const dictType of dictTypes) {
      partial[dictType] = state.cache.get(dictType) ?? []
    }
    return partial
  })
}
