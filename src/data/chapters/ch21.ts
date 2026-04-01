export const metadata = {
  id: 21,
  part: 4,
  title: '跨框架互通性 — 在 React / Angular / Vue 的世界裡生存',
  tags: ['進階', '面試重點'] as string[],
  sections: [
    { slug: 'ch21-s01', title: '在 React 中使用 Web Components（Wrapper Component 模式）' },
    { slug: 'ch21-s02', title: 'React 19 原生支援 Custom Elements 的細節' },
    { slug: 'ch21-s03', title: 'Angular 的 CUSTOM_ELEMENTS_SCHEMA 與 Change Detection' },
    { slug: 'ch21-s04', title: 'Vue 的 resolveComponent 與 Custom Element 模式' },
    { slug: 'ch21-s05', title: '把 React Component 包裝成 Web Component' },
    { slug: 'ch21-s06', title: '常見錯誤：在 React 中混淆 Property Binding 與 Attribute Binding' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 21 · 第四部：進階模式與系統架構</div>
  <h1>跨框架互通性 — 在 React / Angular / Vue 的世界裡生存</h1>
  <p>Web Components 的理想是「寫一次，在任何框架都能用」，但現實中每個框架對 Custom Elements 的處理方式都有細微差異。本章系統性地解析 React、Angular、Vue 三大框架與 Web Components 的整合方式，以及常見的陷阱與解法。</p>
  <div class="chapter-tags">
    <span class="tag tag-advanced">進階</span>
    <span class="tag tag-interview">面試重點</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch21-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">在 React 中使用 Web Components（Wrapper Component 模式）</span>
    </a>
    <a class="catalog-item" href="#ch21-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">React 19 原生支援 Custom Elements 的細節</span>
    </a>
    <a class="catalog-item" href="#ch21-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">Angular 的 CUSTOM_ELEMENTS_SCHEMA 與 Change Detection</span>
    </a>
    <a class="catalog-item" href="#ch21-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Vue 的 resolveComponent 與 Custom Element 模式</span>
    </a>
    <a class="catalog-item" href="#ch21-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">把 React Component 包裝成 Web Component</span>
    </a>
    <a class="catalog-item" href="#ch21-s06">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">常見錯誤：在 React 中混淆 Property Binding 與 Attribute Binding</span>
    </a>
  </div>
</div>

<h2 id="ch21-s01">在 React 中使用 Web Components（Wrapper Component 模式）</h2>

<p>React 18 及以前版本對 Custom Elements 的支援有一個重要限制：它只能透過 HTML attributes（字串）傳遞資料，無法直接設定 DOM properties。對於需要傳遞物件、陣列或函式的 Web Components，必須使用 Wrapper Component 模式。</p>

<book-code-block language="typescript" label="TypeScript — React Wrapper Component 模式（useRef + useEffect）">
// react-wrappers/ProductCarousel.tsx
import React, { useRef, useEffect, useCallback } from 'react'

// 定義 Web Component 的 DOM 介面
interface ProductCarouselElement extends HTMLElement {
  products: Product[]
  autoplay: boolean
  interval: number
}

interface Product {
  id: string
  name: string
  imageUrl: string
  price: number
}

interface ProductCarouselProps {
  products: Product[]
  autoplay?: boolean
  interval?: number
  onSlideChange?: (index: number) =&gt; void
  onProductClick?: (productId: string) =&gt; void
}

export function ProductCarousel({
  products,
  autoplay = false,
  interval = 3000,
  onSlideChange,
  onProductClick,
}: ProductCarouselProps) {
  const ref = useRef&lt;ProductCarouselElement&gt;(null)

  // 同步非字串 properties（物件/陣列/布林/數字）
  useEffect(() =&gt; {
    if (!ref.current) return
    // 必須用 property 設定（不能用 attribute，因為 JSON 字串化有陷阱）
    ref.current.products = products
  }, [products])

  useEffect(() =&gt; {
    if (!ref.current) return
    ref.current.autoplay = autoplay
  }, [autoplay])

  useEffect(() =&gt; {
    if (!ref.current) return
    ref.current.interval = interval
  }, [interval])

  // 監聽 Custom Events
  useEffect(() =&gt; {
    const el = ref.current
    if (!el) return

    const handleSlideChange = (e: Event) =&gt; {
      onSlideChange?.((e as CustomEvent&lt;{ index: number }&gt;).detail.index)
    }
    const handleProductClick = (e: Event) =&gt; {
      onProductClick?.((e as CustomEvent&lt;{ productId: string }&gt;).detail.productId)
    }

    el.addEventListener('slide-change', handleSlideChange)
    el.addEventListener('product-click', handleProductClick)

    return () =&gt; {
      el.removeEventListener('slide-change', handleSlideChange)
      el.removeEventListener('product-click', handleProductClick)
    }
  }, [onSlideChange, onProductClick])

  // attribute 可以直接傳（只適用於字串/簡單布林）
  return &lt;product-carousel ref={ref as any} /&gt;
}
</book-code-block>

<h2 id="ch21-s02">React 19 原生支援 Custom Elements 的細節</h2>

<p>React 19 是重大突破：它終於原生支援 Custom Elements，可以直接傳遞物件和陣列作為 properties，無需 Wrapper Component。但有些細節需要了解。</p>

<book-code-block language="typescript" label="TypeScript — React 19 直接使用 Custom Elements">
// React 19 可以直接使用 Custom Elements，不需要 Wrapper
// react-19-example.tsx

import React from 'react'

// 需要擴展 JSX 的型別定義（在 global.d.ts 中）
// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       'product-carousel': React.DetailedHTMLProps&lt;
//         React.HTMLAttributes&lt;HTMLElement&gt; &amp; {
//           products?: Product[]
//           autoplay?: boolean
//           interval?: number
//           onSlideChange?: (e: CustomEvent) =&gt; void
//         },
//         HTMLElement
//       &gt;
//     }
//   }
// }

function ProductPage({ products }: { products: Product[] }) {
  // React 19：直接傳物件，React 會智能判斷用 property 還是 attribute
  return (
    &lt;div&gt;
      &lt;product-carousel
        products={products}          // 物件 → 自動設定為 DOM property
        autoplay={true}              // 布林 → DOM property
        interval={5000}              // 數字 → DOM property
        onSlide-change={(e) =&gt; {    // 事件監聽（注意：React 19 支援 on* for custom events）
          console.log('Slide changed:', e.detail)
        }}
      /&gt;
    &lt;/div&gt;
  )
}

// React 19 的規則：
// 1. 如果 prop 值是非字串（物件/陣列/函式/布林/數字），設定為 property
// 2. 如果 prop 值是字串，設定為 attribute
// 3. 以 on 開頭的 prop 視為事件監聽器

// 例外：aria-*、data-*、class、style 仍然是 attributes
</book-code-block>

<h2 id="ch21-s03">Angular 的 CUSTOM_ELEMENTS_SCHEMA 與 Change Detection</h2>

<p>Angular 預設的編譯器會對未知的 HTML 元素拋出錯誤。使用 Web Components 需要加入 <code>CUSTOM_ELEMENTS_SCHEMA</code>，並注意 Change Detection 的整合。</p>

<book-code-block language="typescript" label="TypeScript — Angular 整合 Web Components">
// app.module.ts（NgModule 方式）
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AppComponent } from './app.component'

// 別忘了在 main.ts 或 app.component.ts 中 import Web Component 定義
import '../web-components/product-carousel'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // 允許使用 Custom Elements
  bootstrap: [AppComponent],
})
export class AppModule {}

// ===== app.component.ts =====
import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  ChangeDetectorRef, NgZone,
} from '@angular/core'

interface ProductCarouselElement extends HTMLElement {
  products: Product[]
  autoplay: boolean
}

@Component({
  selector: 'app-root',
  template: \`
    &lt;product-carousel
      #carousel
      [attr.data-id]="carouselId"
    &gt;
    &lt;/product-carousel&gt;
    &lt;p&gt;目前頁面: {{ currentSlide }}&lt;/p&gt;
  \`,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('carousel') carouselRef!: ElementRef&lt;ProductCarouselElement&gt;

  currentSlide = 0
  carouselId = 'main-carousel'
  products: Product[] = []

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit() {
    // 設定非字串 properties
    const el = this.carouselRef.nativeElement
    el.products = this.products
    el.autoplay = true

    // Web Component 的事件在 Angular Zone 外觸發，需要手動通知 Change Detection
    el.addEventListener('slide-change', (e: Event) =&gt; {
      this.ngZone.run(() =&gt; {
        this.currentSlide = (e as CustomEvent&lt;{ index: number }&gt;).detail.index
        this.cdr.detectChanges() // 手動觸發變更偵測
      })
    })
  }

  ngOnDestroy() {
    // Angular 不自動清理 Web Component 的事件監聽器
    // ViewChild 釋放後，addEventListener 的參考也會消失
    // 但最好明確移除
  }
}
</book-code-block>

<book-code-block language="typescript" label="TypeScript — Angular Standalone Component 方式（Angular 14+）">
// standalone-component.ts（推薦的現代 Angular 方式）
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  // 在元件層級宣告
  selector: 'app-product-page',
  template: \`
    &lt;product-carousel
      (slide-change)="onSlideChange(\$event)"
    &gt;&lt;/product-carousel&gt;
  \`,
})
export class ProductPageComponent {
  onSlideChange(event: Event) {
    const detail = (event as CustomEvent).detail
    console.log('Slide:', detail.index)
  }
}
</book-code-block>

<h2 id="ch21-s04">Vue 的 resolveComponent 與 Custom Element 模式</h2>

<p>Vue 3 對 Custom Elements 的支援最為完善，提供了 <code>isCustomElement</code> 配置選項，可以完全無縫地使用 Web Components。</p>

<book-code-block language="typescript" label="TypeScript — Vue 3 整合 Web Components">
// vite.config.ts — 告訴 Vue 編譯器哪些是 Custom Elements
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 所有含有 '-' 的 tag 都視為 Custom Element
          isCustomElement: (tag) =&gt; tag.includes('-'),
          // 或者精確指定：
          // isCustomElement: (tag) =&gt; ['product-carousel', 'user-card'].includes(tag),
        },
      },
    }),
  ],
})

// ===== ProductPage.vue =====
</book-code-block>

<book-code-block language="html" label="Vue SFC — 在 Vue 3 中使用 Web Components">
&lt;!-- ProductPage.vue --&gt;
&lt;template&gt;
  &lt;div&gt;
    &lt;!-- Vue 3 可以直接傳物件作為 property（需要用 . 修飾符）--&gt;
    &lt;product-carousel
      .products="products"
      .autoplay="true"
      :data-id="carouselId"
      @slide-change="onSlideChange"
      @product-click="onProductClick"
    /&gt;

    &lt;!-- 也可以用 v-bind 一次傳多個 properties --&gt;
    &lt;user-card v-bind="userCardProps" /&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup lang="ts"&gt;
import { ref, computed, onMounted } from 'vue'
import '../web-components/product-carousel'
import '../web-components/user-card'

const products = ref([
  { id: '1', name: '商品一', imageUrl: '/img/1.jpg', price: 299 },
])
const carouselId = 'main'

const userCardProps = computed(() =&gt; ({
  name: 'Alice',
  role: 'admin',
  avatar: '/avatar.jpg',
}))

function onSlideChange(event: Event) {
  const { index } = (event as CustomEvent).detail
  console.log('Current slide:', index)
}

function onProductClick(event: Event) {
  const { productId } = (event as CustomEvent).detail
  console.log('Clicked product:', productId)
}
&lt;/script&gt;
</book-code-block>

<h2 id="ch21-s05">把 React Component 包裝成 Web Component</h2>

<p>反向整合同樣重要：把現有的 React 元件包裝成 Web Component，讓非 React 的頁面也能使用。</p>

<book-code-block language="typescript" label="TypeScript — 通用 createReactWebComponent 工具函式">
// create-react-web-component.ts
import React from 'react'
import { createRoot, Root } from 'react-dom/client'

interface ReactWebComponentOptions&lt;P extends Record&lt;string, unknown&gt;&gt; {
  ReactComponent: React.ComponentType&lt;P&gt;
  // 需要從 attributes/properties 對應到 React props 的映射
  propNames: (keyof P)[]
  // 需要轉發的 React 事件 → Custom Event 名稱
  eventMap?: Partial&lt;Record&lt;string, string&gt;&gt;
  shadowMode?: 'open' | 'closed' | 'none'
}

export function createReactWebComponent&lt;P extends Record&lt;string, unknown&gt;&gt;(
  tagName: string,
  options: ReactWebComponentOptions&lt;P&gt;
): void {
  const { ReactComponent, propNames, eventMap = {}, shadowMode = 'open' } = options

  class ReactWrapper extends HTMLElement {
    private _root?: Root
    private _props: Partial&lt;P&gt; = {}

    // 監聽 attribute 變更
    static get observedAttributes() {
      return propNames.map(String)
    }

    attributeChangedCallback(name: string, _old: string, newValue: string) {
      this._props = { ...this._props, [name]: newValue } as Partial&lt;P&gt;
      this._render()
    }

    // 動態 property setter
    connectedCallback() {
      // 為每個 propName 建立 property setter
      propNames.forEach(propName =&gt; {
        const key = propName as string
        Object.defineProperty(this, key, {
          get: () =&gt; this._props[propName],
          set: (value: unknown) =&gt; {
            this._props = { ...this._props, [propName]: value } as Partial&lt;P&gt;
            this._render()
          },
          configurable: true,
        })
      })

      const container = shadowMode !== 'none'
        ? this.attachShadow({ mode: shadowMode })
        : this

      this._root = createRoot(container as Element)
      this._render()
    }

    disconnectedCallback() {
      this._root?.unmount()
    }

    private _render() {
      if (!this._root) return

      // 建立事件轉發 props
      const eventProps: Record&lt;string, (e: unknown) =&gt; void&gt; = {}
      Object.entries(eventMap).forEach(([reactEventName, customEventName]) =&gt; {
        eventProps[reactEventName] = (data: unknown) =&gt; {
          this.dispatchEvent(new CustomEvent(customEventName!, {
            detail: data,
            bubbles: true,
            composed: true,
          }))
        }
      })

      this._root.render(
        React.createElement(ReactComponent, { ...this._props, ...eventProps } as P)
      )
    }
  }

  if (!customElements.get(tagName)) {
    customElements.define(tagName, ReactWrapper)
  }
}

// ===== 使用範例 =====
// 原本的 React 元件
interface DatePickerProps {
  value: string
  minDate?: string
  maxDate?: string
  onChange?: (date: string) =&gt; void
}

function DatePicker({ value, minDate, maxDate, onChange }: DatePickerProps) {
  return (
    &lt;input
      type="date"
      value={value}
      min={minDate}
      max={maxDate}
      onChange={e =&gt; onChange?.(e.target.value)}
    /&gt;
  )
}

// 包裝成 Web Component
createReactWebComponent('react-date-picker', {
  ReactComponent: DatePicker,
  propNames: ['value', 'minDate', 'maxDate'],
  eventMap: { onChange: 'date-change' },
})

// 現在可以在任何地方使用：
// &lt;react-date-picker value="2024-01-01"&gt;&lt;/react-date-picker&gt;
</book-code-block>

<h2 id="ch21-s06">常見錯誤：在 React 中混淆 Property Binding 與 Attribute Binding</h2>

<p>這是 React 與 Web Components 整合中最常見的 Bug 來源。必須深刻理解兩者的差異。</p>

<book-code-block language="typescript" label="TypeScript — Property vs Attribute 的差異與陷阱">
// ===== 錯誤案例 =====

// 假設 &lt;data-table&gt; 有一個 rows property，接受 Row[] 型別

// ❌ 錯誤：React 18 會把這個傳成 attribute（字串）
// rows 會變成 "[object Object],[object Object]" 字串！
function BadUsage({ data }: { data: Row[] }) {
  return &lt;data-table rows={data} /&gt;  // 在 React 18 中，物件被轉成字串
}

// ✅ 正確：使用 Wrapper Component + useEffect 設定 property
function GoodUsage({ data }: { data: Row[] }) {
  const ref = useRef&lt;HTMLElement &amp; { rows?: Row[] }&gt;(null)

  useEffect(() =&gt; {
    if (ref.current) {
      ref.current.rows = data  // 直接設定 DOM property（不通過 React 的 attr 機制）
    }
  }, [data])

  return &lt;data-table ref={ref as any} /&gt;
}

// ===== 深入理解：哪些應該用 attribute，哪些用 property =====

// Attribute（字串）：
// - 可以在 HTML 中靜態設定
// - 只能是字串
// - 透過 element.getAttribute() 讀取
// - 範例：&lt;my-input placeholder="請輸入"&gt; 的 placeholder

// Property（任意型別）：
// - 只能用 JavaScript 設定
// - 可以是物件、陣列、函式、布林、數字
// - 透過 element.propName 讀取
// - 範例：element.data = [{ id: 1 }, { id: 2 }]

// 最佳實踐：Web Component 設計原則
// 1. 簡單的設定（字串、枚舉）同時支援 attribute 和 property（reflect）
// 2. 複雜資料（物件、陣列）只用 property，不嘗試用 attribute
// 3. 提供完整的 TypeScript 型別定義，讓使用者知道哪些是 property

// 型別聲明範例（供使用 React 的開發者參考）
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'data-table': React.HTMLAttributes&lt;HTMLElement&gt; &amp; {
        // attribute（字串類型）
        caption?: string
        variant?: 'striped' | 'bordered'
        // 以下是 property，React 18 無法直接傳，需要 ref
        // rows?: Row[]  // 不要在這裡宣告，避免誤用
      }
    }
  }
}
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>React 18 需要用 Wrapper + useRef/useEffect 模式設定 Web Component properties；React 19 已原生支援；Angular 需要 <code>CUSTOM_ELEMENTS_SCHEMA</code> + NgZone；Vue 3 透過 <code>isCustomElement</code> 配置和 <code>.propName</code> 修飾符實現最自然的整合。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch20">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">用 Web Components 建構 Micro-Frontend</span>
    </a>
    <a class="footer-link" href="#ch22">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">表單、驗證與 Form-Associated Custom Elements API</span>
    </a>
  </div>
</div>
`
