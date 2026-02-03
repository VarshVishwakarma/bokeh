import type {CSSStyles, CSSStyleSheetDecl} from "./css"
import {compose_stylesheet} from "./css"
import {isString} from "./util/types"

import type {VNode} from "preact"
import {signal} from "@preact/signals"

export abstract class StyleSheet {
  abstract get vnode(): VNode

  readonly is_global: boolean = false
}

export abstract class InlineBaseStyleSheet extends StyleSheet {
  abstract get native(): CSSStyleSheet
}

export class StaticStyleSheet extends InlineBaseStyleSheet {
  constructor(readonly css: string) {
    super()
  }

  get vnode(): VNode {
    return <style>{this.css}</style>
  }

  get native(): CSSStyleSheet {
    const stylesheet = new CSSStyleSheet()
    stylesheet.replaceSync(this.css)
    return stylesheet
  }
}

export class InlineStyleSheet extends InlineBaseStyleSheet {
  readonly css = signal("")

  constructor(css: string | CSSStyleSheetDecl = "", readonly description?: string, readonly persistent: boolean = false) {
    super()
    this._update(css)
  }

  get vnode(): VNode {
    return (
      <style>
        {this.description != null ? `/** ${this.description} */\n` : null}
        {this.css}
      </style>
    )
  }

  private _native: CSSStyleSheet | null = null
  get native(): CSSStyleSheet {
    if (this._native == null) {
      this._native = new CSSStyleSheet()
      this._native.replaceSync(this.css.value)
    }
    return this._native
  }

  protected _update(css: string | CSSStyleSheetDecl): void {
    const style = isString(css) ? css : compose_stylesheet(css)
    this.css.value = style
    this._native?.replaceSync(style)
  }

  clear(): void {
    this.replace("")
  }

  private _compose(css: string, styles: CSSStyles | undefined): string {
    return styles == null ? css : compose_stylesheet({[css]: styles})
  }

  replace(css: string, styles?: CSSStyles): void {
    this._update(this._compose(css, styles))
  }

  prepend(css: string, styles?: CSSStyles): void {
    this._update(`${this._compose(css, styles)}\n${this.css}`)
  }

  append(css: string, styles?: CSSStyles): void {
    this._update(`${this.css}\n${this._compose(css, styles)}`)
  }
}

export class ImportedStyleSheet extends StyleSheet {
  constructor(readonly url: string) {
    super()
  }

  get vnode(): VNode {
    return <link rel="stylesheet" href={this.url}></link>
  }
}

export class GlobalInlineStyleSheet extends InlineStyleSheet {
  override readonly is_global = true
}

export class GlobalImportedStyleSheet extends ImportedStyleSheet {
  override readonly is_global = true
}

export type StyleSheetLike = StyleSheet | string
