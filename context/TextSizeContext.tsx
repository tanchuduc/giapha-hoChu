'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type TextScale = 'normal' | 'large' | 'extra-large'

interface TextSizeContextType {
  textScale: TextScale
  setTextScale: (scale: TextScale) => void
  cycleTextScale: () => void
}

const TextSizeContext = createContext<TextSizeContextType>({
  textScale: 'normal',
  setTextScale: () => {},
  cycleTextScale: () => {}
})

const STORAGE_KEY = 'giapha_text_scale'

function getInitialTextScale(): TextScale {
  if (typeof window === 'undefined') return 'normal'
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as TextScale | null
    if (saved && (saved === 'normal' || saved === 'large' || saved === 'extra-large')) {
      return saved
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'normal'
}

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const [textScale, setTextScale] = useState<TextScale>(getInitialTextScale)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, textScale)
      const root = document.documentElement
      root.classList.remove('text-scale-large', 'text-scale-extra-large')
      if (textScale === 'large') {
        root.classList.add('text-scale-large')
      } else if (textScale === 'extra-large') {
        root.classList.add('text-scale-extra-large')
      }
    } catch {
      // Ignore
    }
  }, [textScale])

  const cycleTextScale = () => {
    setTextScale((prev) => {
      if (prev === 'normal') return 'large'
      if (prev === 'large') return 'extra-large'
      return 'normal'
    })
  }

  return (
    <TextSizeContext.Provider value={{ textScale, setTextScale, cycleTextScale }}>
      {children}
    </TextSizeContext.Provider>
  )
}

export function useTextSize() {
  return useContext(TextSizeContext)
}
