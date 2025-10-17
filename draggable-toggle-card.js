import { LitElement, html, css } from 'https://cdn.skypack.dev/lit';

// Define size presets outside the class for cleanliness
const SIZES = {
  xsmall: {
    container_w: 40,
    container_h: 80,
    thumb_size: 40,
    padding: 5,
    icon_size: 16,
  },  
  small: {
    container_w: 60,
    container_h: 120,
    thumb_size: 60,
    padding: 5,
    icon_size: 20,
  },
  medium: {
    container_w: 80,
    container_h: 160,
    thumb_size: 80,
    padding: 5,
    icon_size: 24,
  },
  large: {
    container_w: 100,
    container_h: 200,
    thumb_size: 100,
    padding: 5,
    icon_size: 28,
  }
};

class DraggableToggleCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      _dragging: { state: true },
    };
  }

  constructor() {
    super();
    this._dragging = false;
    this._startPos = { x: 0, y: 0 };
    this._initialPos = { x: 0, y: 0 };
  }

  // Define the card's configuration in the UI
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity");
    }
    this.config = {
      orientation: 'vertical',
      size: 'large',
      center_card: true,
      hide_icons: false, // New option to hide all icons
      color_bg: 'var(--card-background-color, #2b2b2b)',
      color_icon: 'var(--secondary-text-color, #a9a9a9)',
      color_active: 'linear-gradient(145deg, #e66465, #9198e5)',
      color_icon_active: 'white',
      ...config,
    };
  }

  // The main render method which creates the HTML structure
  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const state = this.hass.states[this.config.entity];
    const isOn = state && state.state === 'on';
    const orientation = this.config.orientation || 'vertical';
    const size = SIZES[this.config.size] || SIZES.large;
    
    const offset_off_v = (size.container_h + size.padding) - size.thumb_size;
    const offset_off_h = (size.container_h + size.padding) - size.thumb_size;

    const cardStyles = `
      --toggle-bg-color: ${this.config.color_bg};
      --toggle-active-color: ${this.config.color_active};
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

    const renderIcon = (iconName) => {
        if (this.config.hide_icons) {
            return html``;
        }
        return html`<ha-icon .icon="${iconName}"></ha-icon>`;
    };

    return html`
      <ha-card style="${cardStyles}">
        <div 
          class="toggle-container ${orientation}"
          style="${containerStyle}"
        >
          ${!this.config.hide_icons ? html`
            <div class="icon-a">
              <ha-icon icon="${this.config.icon_on || 'mdi:lock'}"></ha-icon>
            </div>
            <div class="icon-b">
              <ha-icon icon="${this.config.icon_off || 'mdi:lock-open-variant'}"></ha-icon>
            </div>
          ` : ''}
          <div class="track">
            <div 
              class="thumb ${isOn ? 'on' : 'off'}" 
              @mousedown="${this._handleDragStart}" 
              @touchstart="${this._handleDragStart}"
            >
              ${!this.config.hide_icons ? html`
                <ha-icon .icon="${isOn ? (this.config.icon_on || 'mdi:lock') : (this.config.icon_off || 'mdi:lock-open-variant')}"></ha-icon>
              ` : ''}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  _handleDragStart(e) { if (e.type === 'touchstart') { this._startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } else { this._startPos = { x: e.clientX, y: e.clientY }; } const thumb = this.shadowRoot.querySelector('.thumb'); this._initialPos = { x: thumb.offsetLeft, y: thumb.offsetTop }; this._dragging = true; window.addEventListener('mousemove', this._handleDragMove); window.addEventListener('touchmove', this._handleDragMove); window.addEventListener('mouseup', this._handleDragEnd); window.addEventListener('touchend', this._handleDragEnd); }
  _handleDragMove = (e) => { if (!this._dragging) return; e.preventDefault(); let currentPos = {}; if (e.type === 'touchmove') { currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } else { currentPos = { x: e.clientX, y: e.clientY }; } const diff = { x: currentPos.x - this._startPos.x, y: currentPos.y - this._startPos.y }; const thumb = this.shadowRoot.querySelector('.thumb'); const track = this.shadowRoot.querySelector('.track'); if (this.config.orientation === 'vertical') { const newTop = this._initialPos.y + diff.y; const maxTop = track.offsetHeight - thumb.offsetHeight; thumb.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`; } else { const newLeft = this._initialPos.x + diff.x; const maxLeft = track.offsetWidth - thumb.offsetWidth; thumb.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`; } }
  _handleDragEnd = (e) => { if (!this._dragging) return; this._dragging = false; window.removeEventListener('mousemove', this._handleDragMove); window.removeEventListener('touchmove', this._handleDragMove); window.removeEventListener('mouseup', this._handleDragEnd); window.removeEventListener('touchend', this._handleDragEnd); const thumb = this.shadowRoot.querySelector('.thumb'); const track = this.shadowRoot.querySelector('.track'); let isNowOn; if (this.config.orientation === 'vertical') { const center = track.offsetHeight / 2; isNowOn = thumb.offsetTop < center; thumb.style.top = ''; } else { const center = track.offsetWidth / 2; isNowOn = thumb.offsetLeft < center; thumb.style.left = ''; } const currentState = this.hass.states[this.config.entity].state === 'on'; if (isNowOn !== currentState) { this.hass.callService('homeassistant', 'toggle', { entity_id: this.config.entity, }); } }

  // The CSS styles for the card
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