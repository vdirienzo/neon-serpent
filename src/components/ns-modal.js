/**
 * @fileoverview `<ns-modal>` — accessible modal with title / body / actions
 * slots. Backdrop click and `Escape` both close the modal when the
 * `dismissible` attribute is set.
 *
 * Observed attributes: `open`, `title`, `dismissible`.
 */

/**
 * Custom element: `<ns-modal>`. Renders into a Shadow DOM with named slots:
 *
 * - `slot="title"` — heading text (replaces the default `Modal`).
 * - default slot — modal body.
 * - `slot="actions"` — buttons / controls at the bottom.
 *
 * @element ns-modal
 * @attr {boolean} [open] - When present, the modal is shown.
 * @attr {string} [title] - Reserved for future title projection.
 * @attr {boolean} [dismissible] - When present, backdrop / Escape close it.
 *
 * @fires open When the modal becomes visible.
 * @fires close When the modal is dismissed.
 *
 * @example
 * const m = document.getElementById('confirm');
 * m.addEventListener('close', () => onCancel());
 * m.open();
 */
class NsModal extends HTMLElement {
  /**
   * @returns {string[]} Attributes that trigger a re-render.
   */
  static get observedAttributes() {
    return ['open', 'title', 'dismissible'];
  }

  /** Create the shadow root, cache element references, bind handlers. */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: none; }
        :host([open]) { display: block; }
        .backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(2, 4, 12, .55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadein .3s ease;
        }
        .panel {
          position: relative;
          background: rgba(7, 11, 26, .78);
          border: 1px solid rgba(0, 246, 255, .45);
          clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
          padding: 18px 22px;
          max-width: 520px;
          width: min(420px, 90vw);
          max-height: 90vh;
          overflow: auto;
        }
        .panel::before {
          content: "";
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg, rgba(0, 246, 255, .06), transparent 30%, transparent 70%, rgba(255, 43, 214, .06));
        }
        .title {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: clamp(26px, 4.4vw, 42px);
          letter-spacing: .2em;
          color: #fff;
          text-shadow: 0 0 14px var(--color-cyan, #00f6ff), 0 0 30px rgba(0, 246, 255, .5);
          text-align: center;
          margin-bottom: 14px;
        }
        .body { color: #cfeaff; }
        .actions {
          display: flex; gap: 10px; flex-wrap: wrap;
          justify-content: center; margin-top: 16px;
        }
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
      </style>
      <div class="backdrop" part="backdrop">
        <div class="panel" part="panel" role="dialog" aria-modal="true">
          <h2 class="title" part="title"><slot name="title">Modal</slot></h2>
          <div class="body" part="body"><slot></slot></div>
          <div class="actions" part="actions"><slot name="actions"></slot></div>
        </div>
      </div>
    `;
    /** @private */
    this._backdrop = this.shadowRoot.querySelector('.backdrop');
    this._onBackdropClick = this._onBackdropClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  /** Mount: set ARIA defaults, attach listeners. */
  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'dialog');
    this._backdrop.addEventListener('click', this._onBackdropClick);
    window.addEventListener('keydown', this._onKeyDown);
  }

  /** Unmount: detach listeners. */
  disconnectedCallback() {
    this._backdrop.removeEventListener('click', this._onBackdropClick);
    window.removeEventListener('keydown', this._onKeyDown);
  }

  /**
   * React to attribute changes. Only `open` toggles the body-overflow lock
   * and fires the open/close events.
   * @param {string} name
   * @returns {void}
   */
  attributeChangedCallback(name) {
    if (name === 'open') {
      if (this.hasAttribute('open')) {
        document.body.style.overflow = 'hidden';
        this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
      } else {
        document.body.style.overflow = '';
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
      }
    }
  }

  /**
   * Backdrop click — close only when the click was directly on the
   * backdrop and the modal is `dismissible`.
   * @private
   * @param {MouseEvent} e
   * @returns {void}
   */
  _onBackdropClick(e) {
    if (e.target === this._backdrop && this.hasAttribute('dismissible')) {
      this.close();
    }
  }

  /**
   * `Escape` key handler — close when open + dismissible.
   * @private
   * @param {KeyboardEvent} e
   * @returns {void}
   */
  _onKeyDown(e) {
    if (this.hasAttribute('open') && e.key === 'Escape' && this.hasAttribute('dismissible')) {
      this.close();
    }
  }

  /** Show the modal. */
  open() {
    this.setAttribute('open', '');
  }

  /** Hide the modal. */
  close() {
    this.removeAttribute('open');
  }

  /** Flip the open state. */
  toggle() {
    this.hasAttribute('open') ? this.close() : this.open();
  }
}

customElements.define('ns-modal', NsModal);
