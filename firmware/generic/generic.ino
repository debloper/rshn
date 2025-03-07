#include <map>
#include <string>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// Single variadic log function that handles all arguments in one go
template<typename... Args>
void log(const Args&... args) {
  // Array trick to expand the parameter pack
  int dummy[sizeof...(args)] = { (Serial.print(args), Serial.print(" "), 0)... };
  // Remove the trailing space and add a newline
  Serial.print("\b\n");
}

// Special case for a single argument - don't add a space
template<typename T>
void log(const T& arg) {
  Serial.println(arg);
}

// Special case for no arguments - just print a newline
inline void log() { Serial.println(); }

// Replace with your network credentials
const char* ssid = "wifi-ssid";
const char* password = "wifi-password";

// Create a web server on port 80
WebServer server(80);

// Device state indicator: ON by default
bool deviceStatus = true;

// PWM configuration
#define LEDC_FREQUENCY    1000
#define LEDC_RESOLUTION   8

// Define LED color channels, associate with GPIO pins
struct LEDMap {
  struct LEDInfo {
    int pin;        // GPIO pin number
    int intensity;  // Intensity value (0-255)
    int channel;    // LEDC channel
  };

  // Map of color names to LED information
  std::map<String, LEDInfo> channels = {
    {"red",   {0,  8, 0}},
    {"green", {1,  8, 1}},
    {"blue",  {2,  8, 2}},
    {"cold",  {16, 8, 3}},
    {"warm",  {17, 8, 4}}
  };

  // Initialize all LED channels
  void begin() {
    for (auto& pair : channels) {
      LEDInfo& info = pair.second;

      // Setup the LEDC channel
      ledcAttachChannel(info.pin, LEDC_FREQUENCY, LEDC_RESOLUTION, info.channel);

      // Initialize with set intensity
      ledcWrite(info.pin, info.intensity);

      log("Initialized LED channel: ", pair.first, " on pin ", info.pin, " using LEDC channel ", info.channel);
    }
  }

  // Get the GPIO pin for a given color
  int getPin(const String& color) const {
    auto it = channels.find(color);
    return (it != channels.end()) ? it->second.pin : -1;
  }

  // Get the intensity for a given color
  int getIntensity(const String& color) const {
    auto it = channels.find(color);
    return (it != channels.end()) ? it->second.intensity : 0;
  }

  // Apply the current intensity value to an LED channel
  void applyIntensity(const String& color, LEDInfo& info) {
    // Apply intensity if device is ON, otherwise set to 0
    int outputValue = deviceStatus ? info.intensity : 0;
    ledcWrite(info.pin, outputValue);
  }

  // Set the intensity for a given color and update the PWM output
  void setIntensity(const String& color, int value) {
    auto it = channels.find(color);
    if (it != channels.end()) {
      // Update stored intensity value
      it->second.intensity = value;

      // Apply the new intensity
      applyIntensity(color, it->second);
    }
  }

  // Update all LED channels based on device state
  void updateAllChannels() {
    for (auto& pair : channels) {
      const String& color = pair.first;
      LEDInfo& info = pair.second;

      // Apply current intensity to each channel
      applyIntensity(color, info);
    }
  }
};

// Instantiate LED map
LEDMap leds;

// Function to toggle the device state
void toggleDevice() {
  deviceStatus = !deviceStatus;
  digitalWrite(LED_BUILTIN, !deviceStatus); // LED seems to be active low (on this specific board)
  leds.updateAllChannels();
  log("Device toggled: ", deviceStatus ? "ON" : "OFF");
}

// Function to add CORS headers to all responses
void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void setup() {
  Serial.begin(115200);
  // while (!Serial) { delay(10); }

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println(" CONNECTED!");
  log("IP address: ", WiFi.localIP());

  // Set up the indicator LED
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, !deviceStatus); // LED seems to be active low (on this specific board)

  // Initialize LED channels
  leds.begin();

  // Define server routes

  // Handle preflight OPTIONS requests for CORS
  server.on("/", HTTP_OPTIONS, [](){
    addCorsHeaders();
    server.send(204); // No content response for OPTIONS
  });

  server.on("/config", HTTP_OPTIONS, [](){
    addCorsHeaders();
    server.send(204); // No content response for OPTIONS
  });

  // Root endpoint for device status
  server.on("/", HTTP_GET, [](){
    DynamicJsonDocument doc(1024);
    doc["status"] = deviceStatus ? "ON" : "OFF";

    // Add channel information as a nested object
    JsonObject channels = doc.createNestedObject("channels");
    for (const auto& pair : leds.channels) {
      channels[pair.first] = pair.second.intensity;
    }

    String response;
    serializeJson(doc, response);
    addCorsHeaders();
    server.send(200, "application/json", response);
  });

  server.on("/", HTTP_POST, [](){
    // Toggle device status
    toggleDevice();

    // Send response with status and channel information
    DynamicJsonDocument doc(1024);
    doc["success"] = true;
    doc["status"] = deviceStatus ? "ON" : "OFF";

    // Add channel information as a nested object
    JsonObject channels = doc.createNestedObject("channels");
    for (const auto& pair : leds.channels) {
      channels[pair.first] = pair.second.intensity;
    }

    String response;
    serializeJson(doc, response);
    addCorsHeaders();
    server.send(200, "application/json", response);
  });

  server.on("/config", HTTP_GET, []() {
    // Create a JSON document to hold our response
    DynamicJsonDocument doc(1024);

    // Add all LED channel intensities to the JSON
    for (const auto& pair : leds.channels) {
      doc[pair.first] = pair.second.intensity;
    }

    // Serialize JSON to string
    String response;
    serializeJson(doc, response);

    // Send the response
    addCorsHeaders();
    server.send(200, "application/json", response);
  });

  server.on("/config", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      String body = server.arg("plain");
      log("Received POST request to /config with body:", body);

      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, body);

      if (error) {
        log("JSON parsing failed: ", error.c_str());
        addCorsHeaders();
        server.send(400, "application/json", "{\"success\":false,\"error\":\"Invalid JSON\"}");
        return;
      }

      // Verify JSON is an object
      if (!doc.is<JsonObject>()) {
        log("JSON is not an object");
        addCorsHeaders();
        server.send(400, "application/json", "{\"success\":false,\"error\":\"JSON must be an object\"}");
        return;
      }

      JsonObject obj = doc.as<JsonObject>();

      // Check if JSON is empty
      if (obj.size() == 0) {
        log("JSON is empty");
        addCorsHeaders();
        server.send(400, "application/json", "{\"success\":false,\"error\":\"No color channels provided\"}");
        return;
      }

      bool hasValidChannel = false;

      // Directly iterate through our LED channels and check if they exist in the JSON
      for (const auto& ledPair : leds.channels) {
        const String& channel = ledPair.first;

        if (obj.containsKey(channel)) {
          // Verify value is an integer
          if (!obj[channel].is<int>()) {
            log("Invalid value for ", channel, " - must be an integer");
            addCorsHeaders();
            server.send(400, "application/json", 
              "{\"success\":false,\"error\":\"Values must be integers between 0-255\"}");
            return;
          }

          // Get the value
          int value = obj[channel].as<int>();

          // Validate range
          if (value < 0 || value > 255) {
            log("Invalid value for ", channel, " - out of range (0-255)");
            addCorsHeaders();
            server.send(400, "application/json", 
              "{\"success\":false,\"error\":\"Values must be integers between 0-255\"}");
            return;
          }

          // Update the LED intensity for this channel
          leds.setIntensity(channel, value);
          hasValidChannel = true;

          // Log the valid value
          log(channel, ": ", value);
        }
      }

      // Check if any valid channels were found
      if (!hasValidChannel) {
        log("No valid color channels found");
        addCorsHeaders();
        server.send(400, "application/json", 
          "{\"success\":false,\"error\":\"No valid color channels provided\"}");
        return;
      }

      // All validations passed
      addCorsHeaders();
      server.send(200, "application/json", "{\"success\":true}");
    } else {
      addCorsHeaders();
      server.send(400, "application/json", "{\"success\":false,\"error\":\"No body provided\"}");
    }
  });

  // Start the server
  server.begin();
  log("HTTP server started");
}

void loop() {
  server.handleClient();
}
