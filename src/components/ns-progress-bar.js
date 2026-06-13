/**
 * @fileoverview `<ns-progress-bar>` — accessible progress bar with label
 * and an indeterminate mode.
 *
 * Observed attributes: `value`, `tone`, `label`, `indeterminate`.
 *
 * Usage:
 *   <ns-progress-bar value="0.4" tone="cyan" label="Carga"></ns-progress-bar>
 */

/**
 * Custom element: `<ns-progress-bar>`.
 *
 * @element ns-progress-bar
 * @attr {number|string} [value] - Normalized value in `[0, 1]`. Out-of-range
 *   values are clamped. Mirrored to `aria-valuenow`.
 * @attr {string} [tone] - Accent color: `cyan` (default) | `gold` | `magenta`.
 * @attr {string} [label] - Caption above the bar. Hidden when empty.
 * @attr {boolean} [indeterminate] - When present, the fill slides left → right
 *   on a 1.4 s loop, ignoring `value`.
 *
 * @example
 * <ns-progress-bar value="0.65" label="Cargando"></ns-progress-bar>
 */
class NsProgressBar extends HTMLElement {
  /**
   * @returns {string[]} Attributes that trigger a re-render.
   */
  static get observedAttributes() {
    return ['value', 'tone', 'label', 'indeterminate'];
  }

  /** Create the shadow root, cache element references. */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; position: relative; }
        .track {
          position: relative;
          width: 100%;
          height: 8px;
          background: rgba(0, 246, 255, .08);
          border: 1px solid rgba(0, 246, 255, .35);
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          overflow: hidden;
        }
        .fill {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, var(--color-cyan, #00f6ff), transparent);
          transform-origin: left center;
          transform: scaleX(0);
          transition: transform .2s linear;
        }
        :host([tone="gold"]) .track { background: rgba(255, 200, 87, .08); border-color: rgba(255, 200, 87, .35); }
        :host([tone="gold"]) .fill { background: linear-gradient(90deg, transparent, var(--color-gold, #ffc857), transparent); }
        :host([tone="magenta"]) .track { background: rgba(255, 43, 214, .08); border-color: rgba(255, 43, 214, .35); }
        :host([tone="magenta"]) .fill { background: linear-gradient(90deg, transparent, var(--color-magenta, #ff2bd6), transparent); }
        :host([indeterminate]) .fill {
          width: 40%;
          animation: indet 1.4s linear infinite;
        }
        .label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: .25em;
          color: var(--color-text-dim, #7a8aa3);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        @keyframes indet {
          0% { left: -40%; }
          100% { left: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          :host([indeterminate]) .fill { animation: none; }
        }
      </style>
      <div class="label" aria-hidden="true"></div>
      <div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="1">
        <div class="fill"></div>
      </div>
    `;
    /** @private */
    this._labelEl = this.shadowRoot.querySelector('.label');
    /** @private */
    this._track = this.shadowRoot.querySelector('.track');
    /** @private */
    this._fill = this.shadowRoot.querySelector('.fill');
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
   * Read the current `value` and `label`, clamp the value to `[0, 1]`,
   * and write them to the shadow DOM. Mirrors `aria-valuenow` for screen
   * readers.
   * @private
   * @returns {void}
   */
  _render() {
    const value = Number(this.getAttribute('value') || 0);
    const clamped = Math.max(0, Math.min(1, value));
    this._fill.style.transform = `scaleX(${clamped})`;
    this._track.setAttribute('aria-valuenow', String(clamped));
    const label = this.getAttribute('label') || '';
    this._labelEl.textContent = label;
    this._labelEl.style.display = label ? 'block' : 'none';
  }
}

customElements.define('ns-progress-bar', NsProgressBar);
