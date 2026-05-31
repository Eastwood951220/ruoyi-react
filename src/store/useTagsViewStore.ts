import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { TagView } from '@/routes/types'

const HOME_TAG: TagView = {
  path: '/',
  fullPath: '/',
  title: '首页',
  closable: false,
}

type TagsViewState = {
  visitedViews: TagView[]

  addView(view: TagView): void
  addVisitedView(view: TagView): void
  updateVisitedView(view: TagView): void
  removeView(fullPathOrPath: string): string
  removeSelectedView(view: TagView): TagView[]
  removeOtherViews(view: TagView): TagView[]
  removeLeftViews(view: TagView): TagView[]
  removeRightViews(view: TagView): TagView[]
  removeAllViews(): TagView[]
  resetViews(): void
}

export const useTagsViewStore = create<TagsViewState>()(
  devtools(
    persist(
      (set, get) => ({
        visitedViews: [HOME_TAG],

        addView: (view) => {
          get().addVisitedView(view)
        },

        addVisitedView: (view) => {
          const { visitedViews } = get()

          // 同 fullPath 已存在，不重复添加
          if (visitedViews.some((v) => v.fullPath === view.fullPath)) {
            return
          }

          // 同 path 但不同 fullPath（不同 query），作为新标签添加
          const samePathIndex = visitedViews.findIndex((v) => v.path === view.path)
          if (samePathIndex !== -1 && view.fullPath !== view.path) {
            set({ visitedViews: [...visitedViews, view] })
            return
          }

          // 同 path 且无 query 差异，更新已有标签
          if (samePathIndex !== -1) {
            get().updateVisitedView(view)
            return
          }

          set({ visitedViews: [...visitedViews, view] })
        },

        updateVisitedView: (view) => {
          const { visitedViews } = get()

          set({
            visitedViews: visitedViews.map((v) =>
              v.fullPath === view.fullPath ? { ...v, ...view } : v,
            ),
          })
        },

        removeView: (fullPathOrPath) => {
          const { visitedViews } = get()
          const nextViews = visitedViews.filter(
            (v) => (v.fullPath !== fullPathOrPath && v.path !== fullPathOrPath) || v.closable === false,
          )
          const normalized = nextViews.length > 0 ? nextViews : [HOME_TAG]

          set({ visitedViews: normalized })

          return normalized.at(-1)?.fullPath ?? '/'
        },

        removeSelectedView: (view) => {
          const { visitedViews } = get()
          const nextViews = visitedViews.filter(
            (v) => v.fullPath !== view.fullPath || v.closable === false,
          )
          const normalized = nextViews.length > 0 ? nextViews : [HOME_TAG]

          set({ visitedViews: normalized })
          return normalized
        },

        removeOtherViews: (view) => {
          const { visitedViews } = get()
          const nextViews = visitedViews.filter(
            (v) => v.fullPath === view.fullPath || v.closable === false,
          )
          const normalized = nextViews.length > 0 ? nextViews : [HOME_TAG]

          set({ visitedViews: normalized })
          return normalized
        },

        removeLeftViews: (view) => {
          const { visitedViews } = get()
          const targetIndex = visitedViews.findIndex((v) => v.fullPath === view.fullPath)
          if (targetIndex <= 0) return visitedViews

          const nextViews = visitedViews.filter(
            (v, index) => index >= targetIndex || v.closable === false,
          )
          const normalized = nextViews.length > 0 ? nextViews : [HOME_TAG]

          set({ visitedViews: normalized })
          return normalized
        },

        removeRightViews: (view) => {
          const { visitedViews } = get()
          const targetIndex = visitedViews.findIndex((v) => v.fullPath === view.fullPath)
          if (targetIndex === -1) return visitedViews

          const nextViews = visitedViews.filter(
            (v, index) => index <= targetIndex || v.closable === false,
          )
          const normalized = nextViews.length > 0 ? nextViews : [HOME_TAG]

          set({ visitedViews: normalized })
          return normalized
        },

        removeAllViews: () => {
          const { visitedViews } = get()
          const affixOnly = visitedViews.filter((v) => v.closable === false)
          const normalized = affixOnly.length > 0 ? affixOnly : [HOME_TAG]

          set({ visitedViews: normalized })
          return normalized
        },

        resetViews: () => {
          set({ visitedViews: [HOME_TAG] })
        },
      }),
      {
        name: 'ruoyi-react-tags-view',
        partialize: (state) => ({ visitedViews: state.visitedViews }),
      },
    ),
  ),
)
