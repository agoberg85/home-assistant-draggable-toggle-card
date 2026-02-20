import { LitElement, html, css } from 'lit';

// Define size presets outside the class for cleanliness
const SIZES = {
  xsmall: { container_w: 25, container_h: 50, thumb_size: 25, padding: 3, icon_size: 16 },
  small: { container_w: 60, container_h: 120, thumb_size: 60, padding: 3, icon_size: 20 },
  medium: { container_w: 80, container_h: 160, thumb_size: 80, padding: 4, icon_size: 24 },
  large: { container_w: 100, container_h: 200, thumb_size: 100, padding: 5, icon_size: 28 }
};

class DraggableToggleCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      _dragging: { state: true },
      _interimState: { state: true },
    };
  }

  constructor() {
    super();
    this._dragging = false;
    this._interimState = null;
    this._startPos = { x: 0, y: 0 };
    this._initialPos = { x: 0, y: 0 };
    this._thumbEl = null;
    this._trackEl = null;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._dragging) {
      this._handleDragEnd();
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (this._interimState === null) { return; }
    if (changedProperties.has('hass')) {
      const oldHass = changedProperties.get('hass');
      if (oldHass && this.hass.states[this.config.entity]) {
        const oldState = oldHass.states[this.config.entity];
        const newState = this.hass.states[this.config.entity];
        if (oldState && newState && oldState.state !== newState.state) {
          this._interimState = null;
        }
      }
    }
  }

  setConfig(config) {
    if (!config.entity) { throw new Error("You need to define an entity"); }
    this.config = {
      orientation: 'vertical',
      size: 'large',
      center_card: true,
      hide_icons: false,
      color_bg: 'var(--card-background-color, #2b2b2b)',
      color_icon: 'var(--secondary-text-color, #a9a9a9)',
      color_active: 'linear-gradient(145deg, #e66465, #9198e5)',
      color_icon_active: 'white',
      color_off: null, // NEW: Add color_off option with a null default
      ...config
    };
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const realState = this.hass.states[this.config.entity];
    const stateToRender = this._interimState !== null ? this._interimState : (realState ? realState.state : 'off');

    const isLock = this.config.entity.startsWith('lock.');
    const isOn = isLock ? stateToRender === 'unlocked' : stateToRender === 'on';

    // MODIFIED: Determine the correct color for the thumb.
    // If the state is 'off' and color_off is defined, use it. Otherwise, use color_active.
    const thumbColor = !isOn && this.config.color_off ? this.config.color_off : this.config.color_active;

    const orientation = this.config.orientation || 'vertical';
    const size = SIZES[this.config.size] || SIZES.large;
    const offset_off_v = (size.container_h + size.padding) - size.thumb_size;
    const offset_off_h = (size.container_h + size.padding) - size.thumb_size;

    const cardStyles = `
      --toggle-bg-color: ${this.config.color_bg};
      --toggle-active-color: ${thumbColor}; /* MODIFIED: Use the dynamically chosen thumbColor */
      --toggle-icon-color: ${this.config.color_icon};
      --toggle-icon-active-color: ${this.config.color_icon_active};
      --container-w-v: ${size.container_w}px;
      --container-h-v: ${size.container_h}px;
      --container-w-h: ${size.container_h}px;
      --container-h-h: ${size.container_w}px;
      --thumb-size: ${size.thumb_size}px;
      --padding: ${size.padding}px;
      --icon-size: ${size.icon_size}px;
      --offset-on: ${size.padding}px;
      --offset-off-v: ${offset_off_v}px;
      --offset-off-h: ${offset_off_h}px;
    `;
    const containerStyle = this.config.center_card ? 'margin: 0 auto;' : '';

    return html`
      <ha-card style="${cardStyles}">
        <div 
          class="toggle-container ${orientation}"
          style="${containerStyle}"
          @click="${this._handleTap}"
        >
          ${!this.config.hide_icons ? html`
            <div class="icon-a"><ha-icon icon="${this.config.icon_on || 'mdi:lock-open-variant'}"></ha-icon></div>
            <div class="icon-b"><ha-icon icon="${this.config.icon_off || 'mdi:lock'}"></ha-icon></div>
          ` : ''}
          <div class="track">
            <div 
              class="thumb ${isOn ? 'on' : 'off'}" 
              @mousedown="${this._handleDragStart}" 
              @touchstart="${this._handleDragStart}"
            >
              ${!this.config.hide_icons ? html`
                <ha-icon .icon="${isOn ? (this.config.icon_on || 'mdi:lock-open-variant') : (this.config.icon_off || 'mdi:lock')}"></ha-icon>
              ` : ''}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  _handleTap(e) { /* ... (no changes in this block) ... */ if (e.target.classList.contains('thumb') || e.target.closest('.thumb')) { return; } const isLock = this.config.entity.startsWith('lock.'); const currentState = this.hass.states[this.config.entity].state; if (isLock) { const serviceToCall = currentState === 'locked' ? 'unlock' : 'lock'; this._interimState = currentState === 'locked' ? 'unlocked' : 'locked'; this.hass.callService('lock', serviceToCall, { entity_id: this.config.entity }); } else { this._interimState = (currentState === 'on') ? 'off' : 'on'; this.hass.callService('homeassistant', 'toggle', { entity_id: this.config.entity }); } }
  _handleDragStart(e) { /* ... (no changes in this block) ... */ this._thumbEl = this.shadowRoot.querySelector('.thumb'); this._trackEl = this.shadowRoot.querySelector('.track'); if (!this._thumbEl || !this._trackEl) return; if (e.type === 'touchstart') { this._startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } else { this._startPos = { x: e.clientX, y: e.clientY }; } this._initialPos = { x: this._thumbEl.offsetLeft, y: this._thumbEl.offsetTop }; this._dragging = true; window.addEventListener('mousemove', this._handleDragMove); window.addEventListener('touchmove', this._handleDragMove); window.addEventListener('mouseup', this._handleDragEnd); window.addEventListener('touchend', this._handleDragEnd); }
  _handleDragMove = (e) => { /* ... (no changes in this block) ... */ if (!this._dragging) return; e.preventDefault(); let currentPos = {}; if (e.type === 'touchmove') { currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } else { currentPos = { x: e.clientX, y: e.clientY }; } const diff = { x: currentPos.x - this._startPos.x, y: currentPos.y - this._startPos.y }; if (this.config.orientation === 'vertical') { const newTop = this._initialPos.y + diff.y; const maxTop = this._trackEl.offsetHeight - this._thumbEl.offsetHeight; this._thumbEl.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`; } else { const newLeft = this._initialPos.x + diff.x; const maxLeft = this._trackEl.offsetWidth - this._thumbEl.offsetWidth; this._thumbEl.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`; } }
  _handleDragEnd = (e) => { /* ... (no changes in this block) ... */ if (!this._dragging) return; this._dragging = false; window.removeEventListener('mousemove', this._handleDragMove); window.removeEventListener('touchmove', this._handleDragMove); window.removeEventListener('mouseup', this._handleDragEnd); window.removeEventListener('touchend', this._handleDragEnd); if (!this._thumbEl || !this._trackEl) return; let dragEndedOn; if (this.config.orientation === 'vertical') { const center = this._trackEl.offsetHeight / 2; dragEndedOn = this._thumbEl.offsetTop < center; } else { const center = this._trackEl.offsetWidth / 2; dragEndedOn = this._thumbEl.offsetLeft < center; } this._thumbEl.style.top = ''; this._thumbEl.style.left = ''; const isLock = this.config.entity.startsWith('lock.'); const currentState = this.hass.states[this.config.entity].state; const currentStateIsOn = isLock ? currentState === 'unlocked' : currentState === 'on'; if (dragEndedOn !== currentStateIsOn) { if (isLock) { const serviceToCall = dragEndedOn ? 'unlock' : 'lock'; this._interimState = dragEndedOn ? 'unlocked' : 'locked'; this.hass.callService('lock', serviceToCall, { entity_id: this.config.entity }); } else { this._interimState = dragEndedOn ? 'on' : 'off'; this.hass.callService('homeassistant', 'toggle', { entity_id: this.config.entity }); } } this._thumbEl = null; this._trackEl = null; }

  static get styles() { /* ... (no changes in this block) ... */ return css`:host { --ha-card-background: transparent; --ha-card-border-width: 0; --ha-card-box-shadow: none; } .toggle-container { position: relative; background-color: var(--toggle-bg-color); border-radius: 100px; display: flex; justify-content: center; align-items: center; padding: var(--padding); cursor: pointer; } .toggle-container.vertical { width: var(--container-w-v); height: var(--container-h-v); flex-direction: column; } .toggle-container.horizontal { width: var(--container-w-h); height: var(--container-h-h); flex-direction: row; } .track { position: absolute; width: 100%; height: 100%; top: 0; left: 0; border-radius: inherit; } .thumb { position: absolute; width: var(--thumb-size); height: var(--thumb-size); border-radius: 50%; background: var(--toggle-active-color); color: var(--toggle-icon-active-color); cursor: grab; display: flex; justify-content: center; align-items: center; transition: all 0.3s ease-in-out; } .thumb ha-icon { --mdc-icon-size: var(--icon-size); } .thumb:active { cursor: grabbing; transform: scale(1.05); } .vertical .thumb.on { top: var(--offset-on); left: var(--offset-on); } .vertical .thumb.off { top: var(--offset-off-v); left: var(--offset-on); } .horizontal .thumb.on { left: var(--offset-on); top: var(--offset-on); } .horizontal .thumb.off { left: var(--offset-off-h); top: var(--offset-on); } .icon-a, .icon-b { color: var(--toggle-icon-color); --mdc-icon-size: var(--icon-size); z-index: 0; } .vertical { justify-content: space-around; } .horizontal { justify-content: space-around; }`; }

  static getStubConfig() {
    return {
      entity: "input_boolean.example_boolean",
      orientation: "vertical",
      size: "large",
      center_card: true,
      hide_icons: false,
      color_bg: '#333333',
      color_active: '#ff9800',
      color_off: '#666666', // NEW: Add to stub
    };
  }
}

customElements.define('mysmart-draggable-toggle', DraggableToggleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "mysmart-draggable-toggle",
  name: "MySmart Draggable Toggle",
  preview: true,
  description: "A clickable and draggable toggle switch card."
});