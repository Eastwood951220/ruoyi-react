import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type UIEventHandler,
} from 'react'
import type { ThumbState, UseAutoHideScrollOptions, UseAutoHideScrollResult } from './types'

const DEFAULT_HIDE_DELAY = 800
const DEFAULT_MIN_THUMB_SIZE = 24

export function useAutoHideScroll(
  options: UseAutoHideScrollOptions = {},
): UseAutoHideScrollResult {
  const {
    direction = 'vertical',
    hideDelay = DEFAULT_HIDE_DELAY,
    minThumbSize = DEFAULT_MIN_THUMB_SIZE,
  } = options

  const [isScrolling, setIsScrolling] = useState(false)
  const [thumbState, setThumbState] = useState<ThumbState>({
    visible: false,
    size: 0,
    offset: 0,
  })

  const timerRef = useRef<number | null>(null)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  const isVertical = direction === 'vertical'

  const clearScrollTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const updateThumb = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const containerSize = isVertical
      ? scroller.clientHeight
      : scroller.clientWidth

    const scrollSize = isVertical
      ? scroller.scrollHeight
      : scroller.scrollWidth

    const scrollOffset = isVertical
      ? scroller.scrollTop
      : scroller.scrollLeft

    const canScroll = scrollSize > containerSize + 1

    if (!canScroll) {
      setThumbState((prev) =>
        prev.visible || prev.size !== 0 || prev.offset !== 0
          ? { visible: false, size: 0, offset: 0 }
          : prev,
      )
      return
    }

    const size = Math.max(
      Math.round((containerSize / scrollSize) * containerSize),
      minThumbSize,
    )

    const maxOffset = containerSize - size
    const maxScrollOffset = scrollSize - containerSize

    const offset =
      maxScrollOffset > 0
        ? Math.round((scrollOffset / maxScrollOffset) * maxOffset)
        : 0

    setThumbState((prev) => {
      if (prev.visible && prev.size === size && prev.offset === offset) return prev
      return { visible: true, size, offset }
    })
  }, [isVertical, minThumbSize])

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(() => {
    setIsScrolling(true)
    updateThumb()
    clearScrollTimer()

    timerRef.current = window.setTimeout(() => {
      setIsScrolling(false)
      timerRef.current = null
    }, hideDelay)
  }, [clearScrollTimer, hideDelay, updateThumb])

  useEffect(() => {
    updateThumb()

    const scroller = scrollerRef.current
    const content = contentRef.current
    const handleResize = () => updateThumb()

    window.addEventListener('resize', handleResize)

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateThumb())
      if (scroller) resizeObserver.observe(scroller)
      if (content) resizeObserver.observe(content)
    }

    return () => {
      clearScrollTimer()
      window.removeEventListener('resize', handleResize)
      resizeObserver?.disconnect()
    }
  }, [clearScrollTimer, updateThumb])

  const thumbStyle = useMemo<CSSProperties>(() => {
    if (isVertical) {
      return {
        height: thumbState.size,
        transform: `translateY(${thumbState.offset}px)`,
      }
    }

    return {
      width: thumbState.size,
      transform: `translateX(${thumbState.offset}px)`,
    }
  }, [isVertical, thumbState.offset, thumbState.size])

  return {
    direction,
    isVertical,
    isScrolling,
    thumbVisible: thumbState.visible,
    thumbStyle,
    scrollerRef,
    contentRef,
    rootProps: {
      onMouseEnter: updateThumb,
    },
    scrollerProps: {
      ref: scrollerRef,
      onScroll: handleScroll,
    },
    contentProps: {
      ref: contentRef,
    },
  }
}

export type { UseAutoHideScrollOptions, UseAutoHideScrollResult, ScrollDirection, ThumbState } from './types'
