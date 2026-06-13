/**
 * @fileoverview `<ns-button>` — neon clip-path button with variants
 * (`cyan` default, `mag`, `ghost`, `gold`). Encapsulated in Shadow DOM.
 *
 * Observed attributes: `variant`, `label`, `pressed`, `disabled`.
 * Emits a bubbling, composed `ns-click` `CustomEvent` on activation.
 */

/**
 * Custom element: `<ns-button>`. Wraps a styled `<button>` and surfaces
 * its activation via `ns-click`.
 *
 * @element ns-button
 * @attr {string} [variant] - Visual variant: `cyan` (default), `mag`, `ghost`, or `gold`.
 * @attr {string} [label] - Reserved for future label projection.
 * @attr {string} [pressed] - Toggle state; mirrored to `aria-pressed`.
 * @attr {boolean} [disabled] - When present, the button is non-interactive.
 *
 * @example
 * <ns-button variant="mag" id="start">Empezar</ns-button>
 * document.getElementById('start').addEventListener('ns-click', e => start());
 */
class NsButton extends HTMLElement {
  /**
   * Observed attributes; changing any triggers a render.
   * @returns {string[]}
   */
  static get observedAttributes() {
    return ['variant', 'label', 'pressed', 'disabled'];
  }

  /** Create the shadow root and bind the click handler. */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        :host([hidden]) { display: none; }
        button {
          font: 700 clamp(14px, 1.6vw, 18px)/1 var(--font-display, 'Orbitron', sans-serif);
          letter-spacing: .28em;
          padding: 14px 28px;
          color: #04060e;
          background: linear-gradient(180deg, var(--color-cyan, #00f6ff), #18b8ff);
          border: 1px solid var(--color-cyan, #00f6ff);
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          text-transform: uppercase;
          box-shadow: 0 0 14px rgba(0, 246, 255, .6), inset 0 0 18px rgba(255, 255, 255, .2);
          cursor: pointer;
          transition: transform .12s ease, box-shadow .2s ease, filter .2s ease;
          animation: btnpulse 1.6s ease-in-out infinite;
        }
        button:hover { filter: brightness(1.15); box-shadow: 0 0 22px rgba(0, 246, 255, .9), inset 0 0 22px rgba(255, 255, 255, .3); }
        button:active { transform: scale(.97); }
        button:focus-visible { outline: 2px solid var(--color-cyan, #00f6ff); outline-offset: 3px; }
        :host([variant="mag"]) button {
          background: linear-gradient(180deg, var(--color-magenta, #ff2bd6), #b81e9a);
          border-color: var(--color-magenta);
          box-shadow: 0 0 14px rgba(255, 43, 214, .6), inset 0 0 18px rgba(255, 255, 255, .2);
        }
        :host([variant="mag"]) button:hover { box-shadow: 0 0 22px rgba(255, 43, 214, .9), inset 0 0 22px rgba(255, 255, 255, .3); }
        :host([variant="ghost"]) button {
          background: transparent;
          color: var(--color-cyan);
          box-shadow: none;
          border-color: var(--color-panel-edge, rgba(0, 246, 255, .45));
        }
        :host([variant="ghost"]) button:hover {
          background: rgba(0, 246, 255, .08);
          box-shadow: 0 0 14px rgba(0, 246, 255, .4);
        }
        :host([variant="gold"]) button {
          background: linear-gradient(180deg, var(--color-gold, #ffc857), #d49a1f);
          border-color: var(--color-gold);
          box-shadow: 0 0 14px rgba(255, 200, 87, .6), inset 0 0 18px rgba(255, 255, 255, .2);
          color: #1a0f00;
        }
        :host([variant="ghost"]) button,
        :host([variant="mag"]) button,
        :host([variant="gold"]) button { color: inherit; }
        :host([pressed]) button[aria-pressed="true"] { background: rgba(0, 246, 255, .18); }
        :host([disabled]) button { opacity: .5; cursor: not-allowed; animation: none; }
        @keyframes btnpulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.18); }
        }
        @media (prefers-reduced-motion: reduce) {
          button { animation: none; }
        }
      </style>
      <button type="button"><slot></slot></button>
    `;
    /** @private */
    this._btn = this.shadowRoot.querySelector('button');
    this._onClick = this._onClick.bind(this);
  }

  /** Mount: set ARIA defaults, attach the click listener, sync state. */
  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    this._btn.addEventListener('click', this._onClick);
    this._syncPressed();
    this._syncDisabled();
  }

  /** Unmount: detach the click listener. */
  disconnectedCallback() {
    this._btn.removeEventListener('click', this._onClick);
  }

  /**
   * React to attribute changes. Only `pressed` and `disabled` need sync.
   * @param {string} name
   * @returns {void}
   */
  attributeChangedCallback(name) {
    if (name === 'pressed') this._syncPressed();
    if (name === 'disabled') this._syncDisabled();
  }

  /**
   * Mirror the `pressed` attribute to the internal button's `aria-pressed`.
   * @private
   * @returns {void}
   */
  _syncPressed() {
    if (!this._btn) return;
    if (this.hasAttribute('pressed')) {
      this._btn.setAttribute('aria-pressed', this.getAttribute('pressed'));
    } else {
      this._btn.removeAttribute('aria-pressed');
    }
  }

  /**
   * Mirror the `disabled` attribute to the internal button's `disabled` property.
   * @private
   * @returns {void}
   */
  _syncDisabled() {
    if (!this._btn) return;
    if (this.hasAttribute('disabled')) {
      this._btn.setAttribute('disabled', '');
    } else {
      this._btn.removeAttribute('disabled');
    }
  }

  /**
   * Internal click handler. When disabled, swallows the event and emits
   * nothing. Otherwise dispatches an `ns-click` `CustomEvent` with the
   * original `MouseEvent` in `detail.originalEvent`.
   * @private
   * @param {MouseEvent} e
   * @returns {void}
   */
  _onClick(e) {
    if (this.hasAttribute('disabled')) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    this.dispatchEvent(
      new CustomEvent('ns-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      })
    );
  }
}

customElements.define('ns-button', NsButton);
