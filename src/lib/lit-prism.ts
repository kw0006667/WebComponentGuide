import Prism from 'prismjs'

/**
 * Extends Prism's TypeScript grammar to support Web Component / Lit patterns:
 *
 * Tagged template literals (Lit):
 *   - html`...`  → highlighted as HTML/markup
 *   - css`...`   → highlighted as CSS
 *   - svg`...`   → highlighted as SVG (markup)
 *
 * Vanilla Web Component patterns:
 *   - .innerHTML = `...`        → highlighted as HTML/markup
 *   - .shadowRoot.innerHTML = `...`
 *   - insertAdjacentHTML(pos, `...`)
 *
 * Must be called AFTER prism-typescript, prism-css, and prism-markup are imported.
 */
export function registerLitHighlighting(): void {
  const ts = Prism.languages.typescript
  const cssGrammar = Prism.languages.css
  const markupGrammar = Prism.languages.markup

  if (!ts || !cssGrammar || !markupGrammar) return

  // Matches the body of a template literal:
  //   \\[\s\S]                             – any escaped character
  //   \$\{(?:[^{}]|\{…\})+\}              – ${…} interpolation (up to 3 levels of braces)
  //   (?!\$\{)[^\\`]                       – any normal character (not backslash or backtick)
  const BODY = /(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*/

  // Shared inner `inside` patterns for delimiter and interpolation tokens
  const interpolationInside = {
    'interpolation': {
      pattern: /\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
      inside: {
        'interpolation-punctuation': {
          pattern: /^\$\{|\}$/,
          alias: 'punctuation',
        },
        rest: ts,
      },
    },
  }

  function makeTaggedTemplate(tag: string, grammar: Prism.Grammar) {
    return {
      // e.g. /\bcss`…`/  – word boundary prevents matching e.g. "processCss`"
      pattern: new RegExp(`\\b${tag}\`${BODY.source}\``),
      greedy: true,
      inside: {
        'template-tag': {
          pattern: new RegExp(`^${tag}`),
          alias: 'keyword',
        },
        'template-delimiter': {
          // matches both the opening and closing backtick
          pattern: /`/,
          alias: 'punctuation',
        },
        ...interpolationInside,
        // Everything that wasn't matched above (the actual CSS/HTML content)
        // is re-tokenised using the embedded language grammar.
        rest: grammar,
      },
    }
  }

  // Vanilla Web Component pattern: .innerHTML = `...`
  // Prism's lookbehind:true strips the first capture group from the actual token,
  // so `inside` is applied only to the template literal part.
  const innerHTMLTemplate = {
    pattern: /((?:\.(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\([^,]+,)\s*)`(?:[^`\\$]|\\.|\$\{[^}]*\})*`/,
    lookbehind: true,
    greedy: true,
    inside: {
      'template-delimiter': {
        pattern: /^`|`$/,
        alias: 'punctuation',
      },
      ...interpolationInside,
      rest: markupGrammar,
    },
  }

  Prism.languages.insertBefore('typescript', 'template-string', {
    'lit-html-template': makeTaggedTemplate('html', markupGrammar),
    'lit-css-template': makeTaggedTemplate('css', cssGrammar),
    'lit-svg-template': makeTaggedTemplate('svg', markupGrammar),
    'wc-innerhtml-template': innerHTMLTemplate,
  })
}
