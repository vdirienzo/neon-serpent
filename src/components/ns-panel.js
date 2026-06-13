/**
 * @fileoverview `<ns-panel>` — translucent clip-path panel with a label,
 * body, and accent variants.
 *
 * Observed attributes: `tone`, `label`. Slots: `slot="label"` (heading),
 * default (body).
 */

/**
 * Custom element: `<ns-panel>`. Pure presentation; no event API.
 *
 * @element ns-panel
 * @attr {string} [tone] - Accent color: `magenta` or `gold` (default cyan).
 * @attr {string} [label] - Reserved for future label projection.
 *
 * @example
 * <ns-panel tone="magenta">
 *   <span slot="label">Estadísticas</span>
 *   <p>High score: 1250</p>
 * </ns-panel>
 */
class NsPanel extends HTMLElement {
  /**
   * @returns {string[]} Attributes that trigger a re-render.
   */
  static get observedAttributes() {
    return ['tone', 'label'];
  }

  /** Create the shadow root with the static template. */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .panel {
          position: relative;
          background: rgba(7, 11, 26, .78);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 246, 255, .45);
          clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
          padding: 18px 22px;
        }
        .panel::before {
          content: "";
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg, rgba(0, 246, 255, .06), transparent 30%, transparent 70%, rgba(255, 43, 214, .06));
        }
        :host([tone="magenta"]) .panel { border-color: rgba(255, 43, 214, .45); }
        :host([tone="gold"]) .panel { border-color: rgba(255, 200, 87, .55); }
        .label {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: .4em;
          color: var(--color-cyan, #00f6ff);
          text-shadow: 0 0 6px rgba(0, 246, 255, .4);
          text-transform: uppercase;
          margin-bottom: 12px;
          position: relative;
        }
        .body { position: relative; }
      </style>
      <div class="panel" part="panel">
        <div class="label" part="label"><slot name="label"></slot></div>
        <div class="body" part="body"><slot></slot></div>
      </div>
    `;
  }
}

customElements.define('ns-panel', NsPanel);
