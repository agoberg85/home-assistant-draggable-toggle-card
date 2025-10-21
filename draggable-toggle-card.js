import { LitElement, html, css } from 'https://cdn.skypack.dev/lit';

// Define size presets outside the class for cleanliness
const SIZES = {
  small: { container_w: 60, container_h: 120, thumb_size: 60, padding: 5, icon_size: 20 },
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
      _interimState: { state: true }, // For optimistic UI updates
    };
  }

  constructor() {
    super();
    this._dragging = false;
    this._interimState = null; // null means we follow the actual HA state
    this._startPos = { x: 0, y: 0 };
    this._initialPos = { x: 0, y: 0 };
  }

  // Lit lifecycle method: called when properties change.
  // We use this to clear our optimistic state once a real update from Home Assistant arrives.
  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('hass')) {
      this._interimState = null;
    }
  }
  
  setConfig(config) { /* ... (no changes in this block) ... */
    if (!config.entity) { throw new Error("You need to define an entity"); }
    this.config = { orientation: 'vertical', size: 'large', center_card: true, color_bg: 'var(--card-background-color, #2b2b2b)', color_icon: 'var(--secondary-text-color, #a9a9a9)', color_active: 'linear-gradient(145deg, #e66465, #9198e5)', color_icon_active: 'white', ...config };
  }

  render() {
    if (!this.hass || !this.config) { return html``; }

    const realState = this.hass.states[this.config.entity];
    // FIX: Prioritize the optimistic state for rendering, otherwise use the real state from HA
    const stateToRender = this._interimState !== null ? this._interimState : (realState ? realState.state : 'off');
    const isOn = stateToRender === 'on';

    const orientation = this.config.orientation || 'vertical';
    const size = SIZES[this.config.size] || SIZES.large;
    const offset_off_v = (size.container_h + size.padding) - size.thumb_size;
    const offset_off_h = (size.container_h + size.padding) - size.thumb_size;
    const cardStyles = `
      --toggle-bg-color: ${this.config.color_bg}; --toggle-active-color: ${this.config.color_active}; --toggle-icon-color: ${this.config.color_icon}; --toggle-icon-active-color: ${this.config.color_icon_active}; --container-w-v: ${size.container_w}px; --container-h-v: ${size.container_h}px; --container-w-h: ${size.container_h}px; --container-h-h: ${size.container_w}px; --thumb-size: ${size.thumb_size}px; --padding: ${size.padding}px; --icon-size: ${size.icon_size}px; --offset-on: ${size.padding}px; --offset-off-v: ${offset_off_v}px; --offset-off-h: ${offset_off_h}px;
    `;
    const containerStyle = this.config.center_card ? 'margin: 0 auto;' : '';

    return html`
      <ha-card style="${cardStyles}">
        <div 
          class="toggle-container ${orientation}"
          style="${containerStyle}"
          @click="${this._handleTap}"
        >
          <div class="icon-a"><ha-icon icon="${this.config.icon_on || 'mdi:lock'}"></ha-icon></div>
          <div class="icon-b"><ha-icon icon="${this.config.icon_off || 'mdi:lock-open-variant'}"></ha-icon></div>
          <div class="track">
            <div 
              class="thumb ${isOn ? 'on' : 'off'}" 
              @mousedown="${this._handleDragStart}" 
              @touchstart="${this._handleDragStart}"
            >
              <ha-icon .icon="${isOn ? (this.config.icon_on || 'mdi:lock') : (this.config.icon_off || 'mdi:lock-open-variant')}"></ha-icon>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  // NEW: Handles tapping on the track area to toggle
  _handleTap(e) {
    // Prevent this from firing if the user is clicking the thumb to start a drag
    if (e.target.classList.contains('thumb')) {
      return;
    }
    const currentState = this.hass.states[this.config.entity].state;
    // Optimistically set the state to the opposite of the current state
    this._interimState = (currentState === 'on') ? 'off' : 'on';

    this.hass.callService('homeassistant', 'toggle', {
      entity_id: this.config.entity,
    });
  }

  _handleDragStart(e) { /* ... (no changes in this block) ... */
    if (e.type === 'touchstart') { this._startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } else { this._startPos = { x: e.clientX, y: e.clientY }; }
    const thumb = this.shadowRoot.querySelector('.thumb'); this._initialPos = { x: thumb.offsetLeft, y: thumb.offsetTop }; this._dragging = true;
    window.addEventListener('mousemove', this._handleDragMove); window.addEventListener('touchmove', this._handleDragMove); window.addEventListener('mouseup', this._handleDragEnd); window.addEventListener('touchend', this._handleDragEnd);
  }

  _handleDragMove = (e) => { /* ... (no changes in this block) ... */
    if (!this._dragging) return; e.preventDefault(); let currentPos = {};
    if (e.type === 'touchmove') { currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } else { currentPos = { x: e.clientX, y: e.clientY }; }
    const diff = { x: currentPos.x - this._startPos.x, y: currentPos.y - this._startPos.y }; const thumb = this.shadowRoot.querySelector('.thumb'); const track = this.shadowRoot.querySelector('.track');
    if (this.config.orientation === 'vertical') { const newTop = this._initialPos.y + diff.y; const maxTop = track.offsetHeight - thumb.offsetHeight; thumb.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`; } else { const newLeft = this._initialPos.x + diff.x; const maxLeft = track.offsetWidth - thumb.offsetWidth; thumb.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`; }
  }

  _handleDragEnd = (e) => {
    if (!this._dragging) return;
    this._dragging = false;
    window.removeEventListener('mousemove', this._handleDragMove); window.removeEventListener('touchmove', this._handleDragMove); window.removeEventListener('mouseup', this._handleDragEnd); window.removeEventListener('touchend', this._handleDragEnd);

    const thumb = this.shadowRoot.querySelector('.thumb');
    const track = this.shadowRoot.querySelector('.track');
    let isNowOn;
    
    if (this.config.orientation === 'vertical') {
      const center = track.offsetHeight / 2;
      isNowOn = thumb.offsetTop < center;
    } else {
      const center = track.offsetWidth / 2;
      isNowOn = thumb.offsetLeft < center;
    }
    
    // Clear inline styles so CSS transitions take over smoothly
    thumb.style.top = '';
    thumb.style.left = '';
    
    const currentState = this.hass.states[this.config.entity].state === 'on';
    
    // If the new state is different from the old state...
    if (isNowOn !== currentState) {
      // FIX: Set the optimistic state before calling the service
      this._interimState = isNowOn ? 'on' : 'off';
      this.hass.callService('homeassistant', 'toggle', {
        entity_id: this.config.entity,
      });
    }
  }

  static get styles() {
    return css`
      :host {
        --ha-card-background: transparent;
        --ha-card-border-width: 0;
        --ha-card-box-shadow: none;
      }
      .toggle-container {
        position: relative;
        background-color: var(--toggle-bg-color);
        border-radius: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--padding);
        cursor: pointer;
      }
      .toggle-container.vertical {
        width: var(--container-w-v);
        height: var(--container-h-v);
        flex-direction: column;
      }
      .toggle-container.horizontal {
        width: var(--container-w-h);
        height: var(--container-h-h);
        flex-direction: row;
      }
      .track {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        border-radius: inherit;
      }
      .thumb {
        position: absolute;
        width: var(--thumb-size);
        height: var(--thumb-size);
        border-radius: 50%;
        background: var(--toggle-active-color);
        color: var(--toggle-icon-active-color);
        cursor: grab;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.3s ease-in-out;
      }
      /* FIX: This new rule targets the icon inside the thumb */
      .thumb ha-icon {
        --mdc-icon-size: var(--icon-size);
      }
      .thumb:active {
        cursor: grabbing;
        transform: scale(1.05);
      }
      .vertical .thumb.on { top: var(--offset-on); left: var(--offset-on); }
      .vertical .thumb.off { top: var(--offset-off-v); left: var(--offset-on); } 
      .horizontal .thumb.on { left: var(--offset-on); top: var(--offset-on); }
      .horizontal .thumb.off { left: var(--offset-off-h); top: var(--offset-on); }
      .icon-a, .icon-b {
        color: var(--toggle-icon-color);
        --mdc-icon-size: var(--icon-size);
        z-index: 0;
      }
      .vertical { justify-content: space-around; }
      .horizontal { justify-content: space-around; }
    `;
  }
  static getStubConfig() { return { entity: "input_boolean.example_boolean", orientation: "vertical", size: "large", center_card: true, color_bg: '#333333', color_active: '#ff9800', }; }
}

customElements.define('draggable-toggle-card', DraggableToggleCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "draggable-toggle-card",
  name: "Draggable Toggle Card",
  preview: true,
  description: "A clickable and draggable toggle switch card."
});