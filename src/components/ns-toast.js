/**
 * @fileoverview `<ns-toast>` — transient bottom-center notification chip.
 *
 * Place a single `<ns-toast>` at the bottom of `<body>`, then call its
 * `.show(text, tone, duration?)` method to display a message.
 *
 * Observed attributes: `text`, `tone`, `duration`.
 */

/**
 * Custom element: `<ns-toast>`. Always present in the DOM; just hidden
 * until `show()` is called.
 *
 * @element ns-toast
 * @attr {string} [text] - The text currently displayed.
 * @attr {string} [tone] - Accent: `cyan` (default) | `magenta` | `gold`.
 * @attr {number|string} [duration] - Default show duration in ms.
 *
 * @example
 * const toast = document.querySelector('ns-toast');
 * toast.show('Puntuación guardada', 'gold', 2000);
 */
class NsToast extends HTMLElement {
  /**
   * @returns {string[]} Attributes that trigger a re-render.
   */
  static get observedAttributes() {
    return ['text', 'tone', 'duration'];
  }

  /** Create the shadow root and cache the toast element + timer id. */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          left: 0; right: 0; bottom: 18%;
          z-index: 25;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        }
        .toast {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: clamp(12px, 1.4vw, 16px);
          letter-spacing: .32em;
          color: #fff;
          text-shadow: 0 0 10px #00f6ff, 0 0 18px rgba(0, 246, 255, .4);
          padding: 8px 18px;
          background: rgba(0, 246, 255, .06);
          border: 1px solid rgba(0, 246, 255, .4);
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
          opacity: 0;
          transform: translateY(8px) scale(.96);
          transition: opacity .25s ease, transform .25s ease;
        }
        .toast.show { opacity: 1; transform: translateY(0) scale(1); }
        :host([tone="magenta"]) .toast {
          color: #fff;
          text-shadow: 0 0 10px #ff2bd6, 0 0 18px rgba(255, 43, 214, .4);
          background: rgba(255, 43, 214, .06);
          border-color: rgba(255, 43, 214, .45);
        }
        :host([tone="gold"]) .toast {
          color: #ffc857;
          text-shadow: 0 0 10px #ffc857, 0 0 18px rgba(255, 200, 87, .4);
          background: rgba(255, 200, 87, .06);
          border-color: rgba(255, 200, 87, .45);
        }
      </style>
      <div class="toast" role="status" aria-live="polite"></div>
    `;
    /** @private */
    this._toast = this.shadowRoot.querySelector('.toast');
    /** @private */
    this._timer = 0;
  }

  /**
   * React to attribute changes. Only `text` updates the visible label.
   * @param {string} name
   * @returns {void}
   */
  attributeChangedCallback(name) {
    if (name === 'text' && this._toast) {
      this._toast.textContent = this.getAttribute('text') || '';
    }
  }

  /**
   * Show a toast. Cancels any in-flight hide timer; uses the explicit
   * `duration` argument or the `duration` attribute (default 1300 ms).
   *
   * @param {string} [text] - Text to display. Omit to keep the current text.
   * @param {string} [tone] - Optional tone (`magenta` or `gold`).
   * @param {number} [duration] - Optional override for the show duration in ms.
   * @returns {void}
   */
  show(text, tone, duration) {
    if (text != null) this.setAttribute('text', text);
    if (tone) this.setAttribute('tone', tone);
    else this.removeAttribute('tone');
    if (this._timer) clearTimeout(this._timer);
    requestAnimationFrame(() => this._toast.classList.add('show'));
    const ms = Number(duration || this.getAttribute('duration') || 1300);
    this._timer = setTimeout(() => {
      this._toast.classList.remove('show');
      this._timer = 0;
    }, ms);
  }

  /** Force-hide the toast and cancel its timer. */
  hide() {
    this._toast.classList.remove('show');
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = 0;
    }
  }
}

customElements.define('ns-toast', NsToast);
