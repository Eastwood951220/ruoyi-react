import { useEffect, useMemo } from 'react'
import { useDictStore, type DictOption } from '@/store/useDictStore'

type DictResult<T extends string> = Record<T, DictOption[]>

export function useDict<T extends string>(...dictTypes: T[]): DictResult<T> {
  const cache = useDictStore((state) => state.cache)
  const loadDict = useDictStore((state) => state.loadDict)

  const dictTypeKey = dictTypes.join('|')

  useEffect(() => {
    const types = dictTypeKey.split('|') as T[]
    types.forEach((dictType) => {
      if (!cache.get(dictType)) {
        void loadDict(dictType)
      }
    })
  }, [cache, loadDict, dictTypeKey])

  return useMemo(() => {
    const types = dictTypeKey.split('|') as T[]
    return types.reduce((result, dictType) => {
      result[dictType] = cache.get(dictType) ?? []
      return result
    }, {} as DictResult<T>)
  }, [cache, dictTypeKey])
}
