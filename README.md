# Draggable Toggle Card

A highly customizable, animated, and draggable toggle switch card for Home Assistant dashboards.

![Draggable Toggle Card Screenshot](https://github.com/agoberg85/home-assistant-draggable-toggle-card/blob/main/screenshot.jpg)

## Features
- **Draggable:** Click and drag the handle to change the state.
- **Configurable:** Change orientation (vertical/horizontal), size, colors, and icons.
- **Minimalist:** Option to hide icons completely for a clean look.

## Installation

### HACS (Recommended)

1.  Go to the HACS page in your Home Assistant instance.
2.  Click the three-dot menu in the top right.
3.  Select "Custom repositories".
4.  In the "Repository" field, paste the URL of this repository (https://github.com/agoberg85/home-assistant-simple-tabs).
5.  For "Category", select "Dashboard".
6.  Click "Add".
7.  The `draggable-toggle-card` will now appear in the HACS Frontend list. Click "Install".

### Manual Installation

1.  Download the `draggable-toggle-card.js` file from the latest [release](https://github.com/agoberg85/home-assistant-simple-tabs/releases).
2.  Copy the file to the `www` directory in your Home Assistant `config` folder.
3.  In your Lovelace dashboard, go to "Manage Resources" and add a new resource:
    - URL: `/local/draggable-toggle-card.js`
    - Resource Type: `JavaScript Module`

## Configuration
Here is a full configuration example:

```yaml
type: custom:draggable-toggle-card
entity: switch.office_light
orientation: horizontal
size: medium # xsmall, small, medium, large
center_card: true
hide_icons: false
icon_on: mdi:ceiling-light
icon_off: mdi:ceiling-light-outline
color_bg: '#454545'
color_active: 'linear-gradient(145deg, #2196F3, #03A9F4)'
color_icon: '#c5c5c5'
color_icon_active: '#ffffff'
```

| Name | Type | Default | Description |
|---|---|---|---|
| `entity` | string | **Required** | The entity ID to control. |
| `orientation` | string | `vertical` | `vertical` or `horizontal`. |
| `size` | string | `large` | `xsmall`, `small`, `medium`, or `large`. |
| `center_card` | boolean | `true` | Set to `false` to left-align the card. |
| `hide_icons` | boolean | `false` | Set to `true` to hide all icons. |
| `color_bg` | string | (Theme BG) | Background color of the toggle. |
| `color_active`| string | (Pink Gradient)| Background color/gradient of the thumb. |
| `color_icon` | string | (Theme Text) | Color of the inactive icons. |
| `color_icon_active`| string | `white` | Color of the icon inside the thumb. |