export interface SectionMeta {
  readonly slug: string
  readonly title: string
}

export interface ChapterMeta {
  readonly id: number
  readonly part: number
  readonly title: string
  readonly tags: readonly string[]
  readonly sections: readonly SectionMeta[]
}

export interface PartMeta {
  readonly id: number
  readonly label: string
  readonly range: string
  readonly level: string
}

export interface ChapterModule {
  metadata: ChapterMeta
  content: string
}

export type Theme = 'light' | 'dark'

export type RouteState =
  | { type: 'home' }
  | { type: 'chapter'; chapterId: number; sectionSlug: string | null }

declare global {
  interface Window {
    Prism?: {
      highlightAllUnder(element: ParentNode): void
      highlightElement(element: Element): void
    }
  }
}
