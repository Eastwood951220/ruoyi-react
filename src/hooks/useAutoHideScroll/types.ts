import React, { CSSProperties, UIEventHandler } from 'react'

export type ScrollDirection = 'vertical' | 'horizontal'

export type ThumbState = {
  visible: boolean
  size: number
  offset: number
}

export interface UseAutoHideScrollOptions {
  direction?: ScrollDirection
  hideDelay?: number
  minThumbSize?: number
}

export interface UseAutoHideScrollResult {
  direction: ScrollDirection
  isVertical: boolean
  isScrolling: boolean
  thumbVisible: boolean
  thumbStyle: CSSProperties
  scrollerRef: React.RefObject<HTMLDivElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  rootProps: {
    onMouseEnter: () => void
  }
  scrollerProps: {
    ref: React.RefObject<HTMLDivElement | null>
    onScroll: UIEventHandler<HTMLDivElement>
  }
  contentProps: {
    ref: React.RefObject<HTMLDivElement | null>
  }
}
