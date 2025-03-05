# RSHN

An open embedded platform, for multi-modal management of studio lights.

[![License: Unlicense](https://img.shields.io/badge/License-Unlicense-red.svg)](https://opensource.org/licenses/MIT) [![Module: XIAO ESP32C6](https://img.shields.io/badge/Module-XIAO_ESP32C6-brightgreen)](https://www.espressif.com/) [![Platform: Arduino IDE](https://img.shields.io/badge/Platform-Arduino_IDE-blue)](https://www.arduino.cc/)

## Overview

RSHN allows for precise control of studio lighting through multiple networked (ESP32 based) satellite modules from a central control hub. Each satellite unit can control multiple LED channels (RGB + Cold/Warm White) and can be independently (or as a group) addressed via a REST API.

The system is designed for:
- Savvy content creators on a budget
- Stage lighting without wiring mess
- Photography and videography studios
- Multi-zone ambient lighting systems
- Smart home custom lighting solutions

## Current Capabilities

The repository currently contains test implementations demonstrating:

1. **Multi-channel Control:** Independent blinks 5 LED channels (R, G, B, C, W)
2. **Sinusoidal LED Fading:** Smooth LED brightness transitions using PWM

## Hardware Requirements

- RSHN satellite module (based on XIAO ESP32C6)
- RGB + CCT LED modules, strips or fixtures
- Appropriate power supplies for the LEDs
- WiFi network for communication

## Installation

### Firmware Installation

1. Install the Arduino IDE (version 2.0 or later recommended)
2. Add ESP32 board support via Boards Manager
3. Install required libraries:
   - ArduinoJson
   - WebServer
4. Clone this repository:
   ```
   git clone https://github.com/yourusername/rshn.git
   cd rshn
   ```
5. Open `firmware/generic/generic.ino` in Arduino IDE
6. Configure your WiFi credentials in the sketch
7. Select your ESP32 board and port
8. Upload the firmware

## Usage

### REST API

The satellite modules expose a simple REST API:

#### Setting LED Colors

Send a POST request to `/config` with a JSON body specifying RGB and White channel values:

```json
{
  "red": 255,
  "green": 128,
  "blue": 64,
  "cold": 200,
  "warm": 150
}
```

Example using curl:
```bash
curl -X POST http://satellite-ip-address/config \
  -H "Content-Type: application/json" \
  -d '{"red": 255, "green": 128, "blue": 64, "cold": 200, "warm": 150}'
```

All values should be integers between 0-255.

## Implementation Details

### Satellite Modules

- Are custom modules with multi-channel LED driver
- Use Seeed Studio XIAO ESP32C6 modules as its brain (for now)
- Control 5 independent channels: Red, Green, Blue, Cold White, Warm White
- Run a REST API server, and receives commands over WiFi from controller hub
- Are extensible with input sensors and output peripherals, for bespoke applications

These Satellite modules can be organized into functional groups based on their lighting purpose:

- Non-addressable, Illuminating LEDs
  - **SPOT**: Key lights and primary directional lighting
  - **Aura**: Fill lights for ambient illumination and shadow reduction
  - **halo**: Hair/rim lights for subject separation and highlighting
- Addressable, Decorative or Indicative LEDs
  - **accent**: Background or set piece illumination
  - **BUZZER**: Visual alarm/indicator, with traffic light code
  - **Effect**: Special purpose lighting for creative applications

Each group can be controlled independently or as part of coordinated lighting scenes.

### Control Hub

All satellite modules connect to a central control hub ("CTRL"), which can take the form of:
- Dedicated hardware controllers, with touch or tactile interfaces
- Next-gen software controllers, as native or web apps with rapid iterative releases
- Extended voice, gesture or conditional controllers, seamlessly integrated with smart home network

The CTRL hub provides unified management, scene coordination, and serves as the integration point for various user interfaces.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is released to the public domain under the Unlicense. See the [LICENSE](LICENSE) file for details.
