/**
 * @fileoverview `<ns-chip>` — small label/value chip with optional icon
 * and tone. Slides in from the right when the `show` attribute is set.
 *
 * Observed attributes: `tone`, `label`, `value`, `icon`. Also reads
 * `show` (boolean) and `position` (CSS value) to control layout.
 */

/**
 * Custom element: `<ns-chip>`. Hidden by default; call `.show()` to
 * reveal.
 *
 * @element ns-chip
 * @attr {string} [tone] - Visual tone: `gold` | `speed` | `slow` | `cyan` | `magenta`.
 * @attr {string} [label] - Left-side label text.
 * @attr {string} [value] - Right-side value text.
 * @attr {string} [icon] - Inline icon character (single emoji or symbol).
 * @attr {boolean} [show] - When present, the chip is visible.
 * @attr {string} [position] - CSS `position` value to apply to the chip.
 *
 * @example
 * const chip = document.createElement('ns-chip');
 * chip.setAttribute('tone', 'gold');
 * chip.setAttribute('label', 'SCORE');
 * chip.setAttribute('value', '1250');
 * document.body.appendChild(chip);
 * chip.show();
 */
class NsChip extends HTMLElement {
  /**
   * @returns {string[]} Attributes that trigger a re-render.
   */
  static get observedAttributes() {
    return ['tone', 'label', 'value', 'icon'];
  }

  /** Create the shadow root and cache element references. */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: none; }
        :host([show]) { display: inline-flex; }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: clamp(11px, 1.2vw, 13px);
          letter-spacing: .18em;
          background: rgba(0, 0, 0, .45);
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
          text-shadow: 0 0 10px currentColor;
          transition: transform .35s cubic-bezier(.2, 1.4, .4, 1), opacity .25s ease;
          transform: translateX(160%);
          opacity: 0;
        }
        :host([show]) .chip { transform: translateX(0); opacity: 1; }
        :host([tone="gold"]) .chip {
          color: #ffc857;
          background: rgba(40, 28, 0, .45);
          border: 1px solid rgba(255, 200, 87, .5);
          box-shadow: 0 0 10px rgba(255, 200, 87, .3);
          animation: chipPulse 1s ease-in-out infinite;
        }
        :host([tone="speed"]) .chip {
          color: #39ff14;
          border: 1px solid #39ff14;
          box-shadow: 0 0 10px rgba(57, 255, 20, .35);
        }
        :host([tone="slow"]) .chip {
          color: #b026ff;
          border: 1px solid #b026ff;
          box-shadow: 0 0 10px rgba(176, 38, 255, .35);
        }
        :host([tone="cyan"]) .chip {
          color: #00f6ff;
          border: 1px solid rgba(0, 246, 255, .5);
          box-shadow: 0 0 10px rgba(0, 246, 255, .3);
        }
        :host([tone="magenta"]) .chip {
          color: #ff2bd6;
          border: 1px solid rgba(255, 43, 214, .5);
          box-shadow: 0 0 10px rgba(255, 43, 214, .3);
        }
        .ic { font-size: 14px; line-height: 1; filter: drop-shadow(0 0 4px currentColor); }
        .lb { opacity: .85; }
        .val { font-variant-numeric: tabular-nums; margin-left: auto; }
        .bar {
          position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
          background: currentColor; box-shadow: 0 0 6px currentColor;
          transform-origin: left center; transform: scaleX(1);
        }
        :host([position="absolute"]) .chip { position: fixed; }
        @keyframes chipPulse {
          50% { box-shadow: 0 0 22px rgba(255, 200, 87, .55); }
        }
        @media (prefers-reduced-motion: reduce) {
          :host([tone="gold"]) .chip { animation: none; }
        }
      </style>
      <span class="chip" role="status" aria-live="polite">
        <span class="ic" aria-hidden="true"></span>
        <span class="lb"></span>
        <span class="val"></span>
      </span>
    `;
    /** @private */
    this._icEl = this.shadowRoot.querySelector('.ic');
    /** @private */
    this._lbEl = this.shadowRoot.querySelector('.lb');
    /** @private */
    this._valEl = this.shadowRoot.querySelector('.val');
  }

  /** Mount: render initial state. */
  connectedCallback() {
    this._render();
  }

  /** Re-render when any observed attribute changes. */
  attributeChangedCallback() {
    this._render();
  }

  /**
   * Push the current `icon`, `label`, and `value` attribute values into
   * the shadow DOM. Idempotent.
   * @private
   * @returns {void}
   */
  _render() {
    if (!this._icEl) return;
    this._icEl.textContent = this.getAttribute('icon') || '';
    this._lbEl.textContent = this.getAttribute('label') || '';
    this._valEl.textContent = this.getAttribute('value') || '';
  }

  /** Reveal the chip. Triggers the slide-in transition. */
  show() {
    this.setAttribute('show', '');
  }

  /** Hide the chip. */
  hide() {
    this.removeAttribute('show');
  }
}

customElements.define('ns-chip', NsChip);
