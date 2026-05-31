import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useThemeStore } from '@/store/useThemeStore'
import type { StartViewTransition, UseThemeViewTransitionOptions } from './types'

const DEFAULT_DURATION = 900
const DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const TRANSITION_CLASS = 'theme-transition-active'

function shouldSkipTransition() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true
  }

  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function getStartViewTransition(): StartViewTransition | null {
  if (typeof document === 'undefined') return null

  const startViewTransition = (
    document as Document & {
      startViewTransition?: StartViewTransition
    }
  ).startViewTransition

  return typeof startViewTransition === 'function'
    ? startViewTransition.bind(document)
    : null
}

export function useThemeViewTransition({
  duration = DEFAULT_DURATION,
  easing = DEFAULT_EASING,
  toggleTheme,
}: UseThemeViewTransitionOptions) {
  const transitionLockRef = useRef(false)
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  const runTransition = useCallback(async () => {
    if (transitionLockRef.current) return

    const triggerEl = triggerRef.current
    const startViewTransition = getStartViewTransition()

    if (!triggerEl || !startViewTransition || shouldSkipTransition()) {
      toggleTheme()
      return
    }

    transitionLockRef.current = true
    setTransitioning(true)

    const root = document.documentElement

    try {
      const transition = startViewTransition(() => {
        // 在 React 渲染前同步更新 data-theme，确保 View Transition 截取新状态时
        // CSS 选择器（:root[data-theme='dark']）已生效，避免新旧快照之间出现中间态闪烁
        const nextDark = !useThemeStore.getState().darkMode
        root.dataset.theme = nextDark ? 'dark' : 'light'
        root.classList.add(TRANSITION_CLASS)

        flushSync(() => {
          toggleTheme()
        })
      })

      await transition.ready

      const { top, left, width, height } = triggerEl.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
      const right = window.innerWidth - x
      const bottom = window.innerHeight - y
      const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom))

      // 同时动画新旧两层：旧层保持不透明，新层通过 clip-path 从按钮位置圆形展开
      const oldAnim = root.animate(
        { opacity: [1, 1] },
        { duration, pseudoElement: '::view-transition-old(root)' },
      )

      const newAnim = root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing,
          pseudoElement: '::view-transition-new(root)',
        },
      )

      await newAnim.finished
      oldAnim.commitStyles()
    } catch (error) {
      console.warn('[theme transition] failed:', error)
    } finally {
      root.classList.remove(TRANSITION_CLASS)
      transitionLockRef.current = false
      setTransitioning(false)
    }
  }, [duration, easing, toggleTheme])

  return {
    runTransition,
    transitioning,
    triggerRef,
  }
}

export type { UseThemeViewTransitionOptions, ViewTransitionLike, StartViewTransition } from './types'
