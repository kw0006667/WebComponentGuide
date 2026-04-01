export const metadata = {
  id: 23,
  part: 5,
  title: '測試 Web Components',
  tags: ['面試重點', '實用技巧'] as string[],
  sections: [
    { slug: 'ch23-s01', title: '用 Web Test Runner 與 @open-wc/testing 進行單元測試' },
    { slug: 'ch23-s02', title: '測試 Shadow DOM：在測試中使用 shadowRoot.querySelector' },
    { slug: 'ch23-s03', title: '測試 Slot 與投影內容（Projected Content）' },
    { slug: 'ch23-s04', title: 'Template 的 Snapshot 測試' },
    { slug: 'ch23-s05', title: 'Playwright 進行元件層級的 E2E 測試' },
    { slug: 'ch23-s06', title: 'Mock Reactive Controller 與 Context Provider' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 23 · 第五部：品質保證：測試、無障礙與效能</div>
  <h1>測試 Web Components</h1>
  <p>Shadow DOM 的封裝特性讓傳統測試工具面臨挑戰，但 Web Components 生態系已有完整的測試工具鏈。本章從單元測試到 E2E 測試，系統性地介紹如何對 Web Components 進行可靠的自動化測試。</p>
  <div class="chapter-tags">
    <span class="tag tag-interview">面試重點</span>
    <span class="tag tag-tip">實用技巧</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch23-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">用 Web Test Runner 與 @open-wc/testing 進行單元測試</span>
    </a>
    <a class="catalog-item" href="#ch23-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">測試 Shadow DOM：在測試中使用 shadowRoot.querySelector</span>
    </a>
    <a class="catalog-item" href="#ch23-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">測試 Slot 與投影內容（Projected Content）</span>
    </a>
    <a class="catalog-item" href="#ch23-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Template 的 Snapshot 測試</span>
    </a>
    <a class="catalog-item" href="#ch23-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Playwright 進行元件層級的 E2E 測試</span>
    </a>
    <a class="catalog-item" href="#ch23-s06">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">Mock Reactive Controller 與 Context Provider</span>
    </a>
  </div>
</div>

<h2 id="ch23-s01">用 Web Test Runner 與 @open-wc/testing 進行單元測試</h2>

<p>@open-wc/testing 是 Web Components 社群推薦的測試工具組，建立在 Chai 斷言函式庫之上，提供了專為 Web Components 設計的輔助函式。Web Test Runner 則是比 jsdom 更接近真實瀏覽器環境的測試執行器。</p>

<book-code-block language="bash" label="Shell — 安裝測試工具鏈">
# 安裝 Web Test Runner 和 @open-wc/testing
npm install --save-dev @web/test-runner @open-wc/testing

# 安裝 Chai（斷言）和 Sinon（Mock/Stub）整合
npm install --save-dev @open-wc/testing-helpers

# web-test-runner.config.mjs 設定檔
</book-code-block>

<book-code-block language="javascript" label="JavaScript — web-test-runner.config.mjs">
// web-test-runner.config.mjs
import { playwrightLauncher } from '@web/test-runner-playwright'

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  // 使用真實瀏覽器（非 jsdom）
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],
  // 覆蓋率報告
  coverage: true,
  coverageConfig: {
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.test.ts'],
  },
}
</book-code-block>

<book-code-block language="typescript" label="TypeScript — @open-wc/testing 基本單元測試範例">
// src/components/counter-button.test.ts
import { expect, fixture, html, elementUpdated } from '@open-wc/testing'
import sinon from 'sinon'

// 引入被測試的元件
import './counter-button.js'

describe('&lt;counter-button&gt;', () =&gt; {
  // fixture() 把元件插入真實 DOM，並等待第一次渲染完成
  it('初始計數應為 0', async () =&gt; {
    const el = await fixture&lt;HTMLElement&gt;(html\`&lt;counter-button&gt;&lt;/counter-button&gt;\`)
    // @open-wc/testing 的 expect 擴展了 Chai
    expect(el).to.exist
    expect(el.getAttribute('count')).to.equal('0')
  })

  it('點擊按鈕應增加計數', async () =&gt; {
    const el = await fixture&lt;HTMLElement&gt;(html\`&lt;counter-button&gt;&lt;/counter-button&gt;\`)
    const button = el.shadowRoot!.querySelector('button')!

    button.click()
    await elementUpdated(el) // 等待 LitElement 非同步更新完成

    expect(el.getAttribute('count')).to.equal('1')
  })

  it('應在計數變更時觸發 count-change 事件', async () =&gt; {
    const el = await fixture&lt;HTMLElement&gt;(html\`&lt;counter-button&gt;&lt;/counter-button&gt;\`)
    const button = el.shadowRoot!.querySelector('button')!

    // 監聽事件
    const listener = sinon.spy()
    el.addEventListener('count-change', listener)

    button.click()
    await elementUpdated(el)

    expect(listener.calledOnce).to.be.true
    expect(listener.firstCall.args[0].detail.count).to.equal(1)
  })

  it('應支援設定初始值', async () =&gt; {
    // 傳入 attribute
    const el = await fixture&lt;HTMLElement&gt;(html\`&lt;counter-button count="5"&gt;&lt;/counter-button&gt;\`)
    await elementUpdated(el)

    const display = el.shadowRoot!.querySelector('.count-display')
    expect(display?.textContent?.trim()).to.equal('5')
  })

  // 無障礙測試（使用 axe）
  it('應通過 a11y 無障礙稽核', async () =&gt; {
    const el = await fixture(html\`&lt;counter-button label="計數器"&gt;&lt;/counter-button&gt;\`)
    await expect(el).to.be.accessible()
  })
})
</book-code-block>

<h2 id="ch23-s02">測試 Shadow DOM：在測試中使用 shadowRoot.querySelector</h2>

<p>測試 Shadow DOM 內部的關鍵是透過 <code>element.shadowRoot</code> 存取 Shadow DOM，並使用一般的 DOM 查詢方法。注意：<code>document.querySelector()</code> 無法穿透 Shadow Boundary。</p>

<book-code-block language="typescript" label="TypeScript — Shadow DOM 查詢的完整測試模式">
// src/components/user-profile.test.ts
import { expect, fixture, html, elementUpdated } from '@open-wc/testing'
import './user-profile.js'

describe('&lt;user-profile&gt;', () =&gt; {
  it('應正確渲染使用者名稱', async () =&gt; {
    const el = await fixture(html\`
      &lt;user-profile name="Alice Chen" role="admin"&gt;&lt;/user-profile&gt;
    \`)

    // ✅ 正確：透過 shadowRoot 查詢 Shadow DOM 內部
    const nameEl = el.shadowRoot!.querySelector('.user-name')
    expect(nameEl).to.exist
    expect(nameEl!.textContent).to.equal('Alice Chen')

    // ❌ 錯誤：document.querySelector 找不到 Shadow DOM 內的元素
    // const wrongWay = document.querySelector('.user-name') // null!
  })

  it('應根據 role 顯示對應的標籤', async () =&gt; {
    const el = await fixture(html\`
      &lt;user-profile name="Bob" role="admin"&gt;&lt;/user-profile&gt;
    \`)

    const badge = el.shadowRoot!.querySelector('.role-badge')
    expect(badge).to.exist
    expect(badge!.textContent?.trim()).to.equal('管理員')
    expect(badge!.classList.contains('role-badge--admin')).to.be.true
  })

  it('更新 name property 後應重新渲染', async () =&gt; {
    const el = await fixture&lt;HTMLElement &amp; { name: string }&gt;(
      html\`&lt;user-profile name="Alice"&gt;&lt;/user-profile&gt;\`
    )

    // 更新 property（非 attribute）
    el.name = 'Carol'
    await elementUpdated(el)

    const nameEl = el.shadowRoot!.querySelector('.user-name')
    expect(nameEl!.textContent).to.equal('Carol')
  })

  it('應正確處理巢狀 Shadow DOM 查詢', async () =&gt; {
    const el = await fixture(html\`
      &lt;user-profile name="Dave"&gt;&lt;/user-profile&gt;
    \`)

    // 深層查詢：shadowRoot 中的元素還可以繼續查詢
    const avatarSection = el.shadowRoot!.querySelector('.avatar-section')
    const img = avatarSection?.querySelector('img')
    expect(img).to.exist
    expect(img!.getAttribute('alt')).to.equal('Dave')
  })

  // 測試計算樣式
  it('停用狀態下應顯示灰色', async () =&gt; {
    const el = await fixture(html\`
      &lt;user-profile name="Eve" disabled&gt;&lt;/user-profile&gt;
    \`)

    // 測試 CSS 自訂屬性或 class 狀態
    expect(el.hasAttribute('disabled')).to.be.true

    const wrapper = el.shadowRoot!.querySelector('.wrapper')
    // 透過計算樣式驗證（適用於 CSS 變數）
    const styles = getComputedStyle(wrapper as Element)
    // 驗證 opacity 或其他樣式屬性
    expect(parseFloat(styles.opacity)).to.be.lessThan(1)
  })
})
</book-code-block>

<h2 id="ch23-s03">測試 Slot 與投影內容（Projected Content）</h2>

<p>Slot 的測試需要理解 light DOM 和 Shadow DOM 的關係：Slot 的內容在 light DOM（元件外部），但被渲染到 Shadow DOM 的 Slot 位置。</p>

<book-code-block language="typescript" label="TypeScript — 測試 Slot 與 assignedElements">
// src/components/card-container.test.ts
import { expect, fixture, html, elementUpdated } from '@open-wc/testing'
import './card-container.js'

describe('&lt;card-container&gt; — Slot 測試', () =&gt; {
  it('預設 slot 應渲染 light DOM 內容', async () =&gt; {
    const el = await fixture(html\`
      &lt;card-container&gt;
        &lt;p&gt;這是卡片內容&lt;/p&gt;
        &lt;button&gt;操作按鈕&lt;/button&gt;
      &lt;/card-container&gt;
    \`)

    // 在 Shadow DOM 中找到 slot 元素
    const slot = el.shadowRoot!.querySelector('slot:not([name])')
    expect(slot).to.exist

    // assignedElements() 回傳被指派到這個 slot 的 light DOM 元素
    const assignedEls = (slot as HTMLSlotElement).assignedElements()
    expect(assignedEls).to.have.lengthOf(2)
    expect(assignedEls[0].tagName.toLowerCase()).to.equal('p')
    expect(assignedEls[1].tagName.toLowerCase()).to.equal('button')
  })

  it('命名 slot 應正確投影對應內容', async () =&gt; {
    const el = await fixture(html\`
      &lt;card-container&gt;
        &lt;span slot="title"&gt;卡片標題&lt;/span&gt;
        &lt;p slot="footer"&gt;頁腳資訊&lt;/p&gt;
        &lt;p&gt;主要內容&lt;/p&gt;
      &lt;/card-container&gt;
    \`)

    const titleSlot = el.shadowRoot!.querySelector('slot[name="title"]') as HTMLSlotElement
    const footerSlot = el.shadowRoot!.querySelector('slot[name="footer"]') as HTMLSlotElement
    const defaultSlot = el.shadowRoot!.querySelector('slot:not([name])') as HTMLSlotElement

    expect(titleSlot.assignedElements()).to.have.lengthOf(1)
    expect(titleSlot.assignedElements()[0].textContent).to.equal('卡片標題')

    expect(footerSlot.assignedElements()).to.have.lengthOf(1)
    expect(defaultSlot.assignedElements()).to.have.lengthOf(1)
  })

  it('slot 為空時應顯示 fallback 內容', async () =&gt; {
    const el = await fixture(html\`
      &lt;card-container&gt;
        &lt;!-- 沒有提供 title slot --&gt;
        &lt;p&gt;只有主內容&lt;/p&gt;
      &lt;/card-container&gt;
    \`)

    const titleSlot = el.shadowRoot!.querySelector('slot[name="title"]') as HTMLSlotElement

    // 沒有 assigned elements 時，顯示 slot 的 fallback 內容
    expect(titleSlot.assignedElements()).to.have.lengthOf(0)

    // fallback 內容（slot 的子節點）應可見
    const fallback = titleSlot.querySelector('.default-title')
    expect(fallback?.textContent).to.equal('未命名卡片')
  })

  it('slotchange 事件應在 slot 內容改變時觸發', async () =&gt; {
    const el = await fixture(html\`
      &lt;card-container&gt;
        &lt;p&gt;初始內容&lt;/p&gt;
      &lt;/card-container&gt;
    \`)

    const slot = el.shadowRoot!.querySelector('slot:not([name])')!
    let slotChangeCount = 0
    slot.addEventListener('slotchange', () =&gt; slotChangeCount++)

    // 動態新增內容
    const newEl = document.createElement('span')
    newEl.textContent = '新增內容'
    el.appendChild(newEl)

    // 等待 slotchange 事件
    await new Promise(resolve =&gt; setTimeout(resolve, 0))
    expect(slotChangeCount).to.equal(1)
  })
})
</book-code-block>

<h2 id="ch23-s04">Template 的 Snapshot 測試</h2>

<p>Snapshot 測試記錄元件在特定輸入下的 HTML 輸出，後續運行時自動比對。這可以防止意外的渲染變更，適合用於穩定的 UI 元件。</p>

<book-code-block language="typescript" label="TypeScript — Web Components Snapshot 測試">
// src/components/badge.test.ts
import { expect, fixture, html } from '@open-wc/testing'
import { sendMouse } from '@web/test-runner-commands'
// npm install --save-dev @open-wc/semantic-dom-diff
import { getDiffableHTML } from '@open-wc/semantic-dom-diff'
import './badge.js'

describe('&lt;status-badge&gt; Snapshot 測試', () =&gt; {
  it('success 狀態的 snapshot', async () =&gt; {
    const el = await fixture(html\`
      &lt;status-badge variant="success" label="已完成"&gt;&lt;/status-badge&gt;
    \`)

    // getDiffableHTML 正規化 HTML 使比對更穩定
    // （移除無意義的空白、排序 attributes 等）
    const shadowHtml = getDiffableHTML(el.shadowRoot!)

    // 手動 snapshot（第一次執行時建立，之後自動比對）
    // 實際使用時會整合 snapshot 框架（如 @web/test-runner-visual-regression）
    expect(shadowHtml).to.matchSnapshot()
  })

  it('所有 variant 的 snapshot', async () =&gt; {
    const variants = ['success', 'warning', 'error', 'info', 'neutral']

    for (const variant of variants) {
      const el = await fixture(html\`
        &lt;status-badge variant="\${variant}" label="\${variant}"&gt;&lt;/status-badge&gt;
      \`)

      const html_ = getDiffableHTML(el.shadowRoot!)
      // 每個 variant 獨立的 snapshot 鍵值
      expect(html_).to.matchSnapshot(\`variant-\${variant}\`)
    }
  })

  // 手寫斷言（更精確，不依賴 snapshot 框架）
  it('success variant 應有正確的 CSS 類別', async () =&gt; {
    const el = await fixture(html\`
      &lt;status-badge variant="success"&gt;&lt;/status-badge&gt;
    \`)

    const badge = el.shadowRoot!.querySelector('.badge')!
    expect(badge.classList.contains('badge--success')).to.be.true

    // 透過計算樣式驗證顏色（更可靠）
    const styles = getComputedStyle(badge)
    // CSS 自訂屬性的值
    expect(el.style.getPropertyValue('--badge-bg') || styles.backgroundColor)
      .to.not.be.empty
  })
})
</book-code-block>

<h2 id="ch23-s05">Playwright 進行元件層級的 E2E 測試</h2>

<p>Playwright 的 <code>locator</code> API 支援穿透 Shadow DOM，是進行 Web Components E2E 測試的最佳工具。</p>

<book-code-block language="typescript" label="TypeScript — Playwright 測試 Web Components">
// tests/product-card.spec.ts
import { test, expect } from '@playwright/test'

test.describe('product-card E2E 測試', () =&gt; {
  test.beforeEach(async ({ page }) =&gt; {
    // 導航到元件展示頁面（或使用 page.setContent）
    await page.goto('/components/product-card')
  })

  test('應顯示商品名稱和價格', async ({ page }) =&gt; {
    // Playwright 的 locator 預設穿透 Shadow DOM
    const card = page.locator('product-card').first()

    // shadowRoot 內的元素可以直接查詢
    await expect(card.locator('.product-name')).toHaveText('藍牙耳機')
    await expect(card.locator('.product-price')).toContainText('1,299')
  })

  test('點擊加入購物車按鈕應觸發事件', async ({ page }) =&gt; {
    const card = page.locator('product-card').first()
    let eventFired = false
    let eventDetail: unknown

    // 在 JS context 中監聽 CustomEvent
    await page.evaluate(() =&gt; {
      document.addEventListener('add-to-cart', (e) =&gt; {
        (window as any).__lastCartEvent = (e as CustomEvent).detail
      })
    })

    // 穿透 Shadow DOM 點擊按鈕
    await card.locator('[data-testid="add-to-cart"]').click()

    // 驗證事件已觸發
    const detail = await page.evaluate(() =&gt; (window as any).__lastCartEvent)
    expect(detail).toBeTruthy()
    expect(detail.productId).toBeTruthy()
  })

  test('應支援鍵盤操作', async ({ page }) =&gt; {
    const card = page.locator('product-card').first()

    // Tab 到按鈕
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // 確認焦點在 Shadow DOM 內的按鈕
    const focusedTag = await page.evaluate(() =&gt; {
      const active = document.activeElement
      // 取得 Shadow DOM 內的焦點元素
      const shadowActive = (active?.shadowRoot?.activeElement ?? active)
      return shadowActive?.tagName.toLowerCase()
    })
    expect(focusedTag).toBe('button')

    // Enter 鍵觸發點擊
    await page.keyboard.press('Enter')
    const detail = await page.evaluate(() =&gt; (window as any).__lastCartEvent)
    expect(detail).toBeTruthy()
  })

  test('視覺回歸：商品卡片快照', async ({ page }) =&gt; {
    const card = page.locator('product-card').first()
    // Playwright 內建的視覺快照測試
    await expect(card).toHaveScreenshot('product-card-default.png')
  })
})

// ===== playwright.config.ts =====
// import { defineConfig } from '@playwright/test'
//
// export default defineConfig({
//   testDir: './tests',
//   use: {
//     baseURL: 'http://localhost:5173',
//   },
//   webServer: {
//     command: 'npm run dev',
//     url: 'http://localhost:5173',
//     reuseExistingServer: !process.env.CI,
//   },
// })
</book-code-block>

<h2 id="ch23-s06">Mock Reactive Controller 與 Context Provider</h2>

<p>測試使用了 Reactive Controller 或 Context 的元件時，需要提供 Mock 版本以隔離測試邏輯。</p>

<book-code-block language="typescript" label="TypeScript — Mock Reactive Controller 與 Context Provider">
// src/components/auth-status.test.ts
import { expect, fixture, html } from '@open-wc/testing'
import { ContextProvider } from '@lit/context'
import { authContext, type AuthState } from '../contexts/auth-context.js'
import './auth-status.js'

describe('&lt;auth-status&gt; — 使用 Mock Context', () =&gt; {
  // 輔助函式：建立帶有 Context Provider 的 DOM 環境
  async function fixtureWithAuth(authState: AuthState) {
    // 建立包含 Context Provider 的 wrapper
    const wrapper = await fixture(html\`
      &lt;div id="provider-root"&gt;
        &lt;auth-status&gt;&lt;/auth-status&gt;
      &lt;/div&gt;
    \`)

    // 在 wrapper 上掛載 Context Provider（提供 Mock 資料）
    const provider = new ContextProvider(wrapper, {
      context: authContext,
      initialValue: authState,
    })

    // 等待元件消費 context 並重新渲染
    const authStatusEl = wrapper.querySelector('auth-status')!
    await new Promise(resolve =&gt; setTimeout(resolve, 0))

    return { wrapper, provider, el: authStatusEl }
  }

  it('未登入時應顯示登入按鈕', async () =&gt; {
    const { el } = await fixtureWithAuth({ user: null, isLoading: false })

    const loginBtn = el.shadowRoot!.querySelector('[data-testid="login-btn"]')
    expect(loginBtn).to.exist
    expect(el.shadowRoot!.querySelector('[data-testid="user-info"]')).to.not.exist
  })

  it('已登入時應顯示使用者資訊', async () =&gt; {
    const { el } = await fixtureWithAuth({
      user: { id: '1', name: 'Alice', email: 'alice@example.com', role: 'user' },
      isLoading: false,
    })

    const userInfo = el.shadowRoot!.querySelector('[data-testid="user-info"]')
    expect(userInfo).to.exist
    expect(userInfo!.textContent).to.include('Alice')
  })

  it('Context 更新時應重新渲染', async () =&gt; {
    const { el, provider } = await fixtureWithAuth({ user: null, isLoading: false })

    // 驗證初始狀態
    expect(el.shadowRoot!.querySelector('[data-testid="login-btn"]')).to.exist

    // 更新 Context（模擬登入成功）
    provider.setValue({
      user: { id: '1', name: 'Bob', email: 'bob@example.com', role: 'user' },
      isLoading: false,
    })

    await new Promise(resolve =&gt; setTimeout(resolve, 0))

    // 驗證元件響應 Context 變更
    expect(el.shadowRoot!.querySelector('[data-testid="user-info"]')).to.exist
  })
})

// ===== Mock Reactive Controller =====
// src/controllers/fetch-controller.mock.ts
import type { ReactiveControllerHost } from 'lit'

export class MockFetchController {
  host: ReactiveControllerHost
  loading = false
  error: Error | null = null
  data: unknown = null

  constructor(host: ReactiveControllerHost) {
    this.host = host
    host.addController(this)
  }

  hostConnected() {}
  hostDisconnected() {}

  // 在測試中手動設定狀態
  setLoading(loading: boolean) {
    this.loading = loading
    this.host.requestUpdate()
  }

  setData(data: unknown) {
    this.data = data
    this.loading = false
    this.host.requestUpdate()
  }

  setError(error: Error) {
    this.error = error
    this.loading = false
    this.host.requestUpdate()
  }
}
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Web Components 測試的核心是透過 <code>shadowRoot.querySelector()</code> 存取 Shadow DOM 內部，搭配 @open-wc/testing 的 <code>fixture()</code> 和 <code>elementUpdated()</code> 確保非同步更新完成，Playwright 的 locator 則能無縫穿透 Shadow Boundary 進行 E2E 測試。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch22">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">表單、驗證與 Form-Associated Custom Elements API</span>
    </a>
    <a class="footer-link" href="#ch24">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Web Components 的無障礙設計（Accessibility）</span>
    </a>
  </div>
</div>
`
