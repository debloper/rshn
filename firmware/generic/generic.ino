#include <map>
#include <string>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// Replace with your network credentials
const char* ssid = "wifi-ssid";
const char* password = "wifi-password";

// Create a web server on port 80
WebServer server(80);

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

  // Perhaps we could drop the color names in favor of channel numbers as keys
  // Will figure it out while making the values persistent over reboots
  std::map<String, LEDInfo> channels = {
    {"red",   {0,  0, 0}},
    {"green", {1,  0, 1}},
    {"blue",  {2,  0, 2}},
    {"cold",  {16, 0, 3}},
    {"warm",  {17, 0, 4}}
  };

  // Initialize all LED channels
  void begin() {
    for (auto& pair : channels) {
      LEDInfo& info = pair.second;

      // Setup the LEDC channel
      ledcAttachChannel(info.pin, LEDC_FREQUENCY, LEDC_RESOLUTION, info.channel);

      // Initialize with 0 intensity
      ledcWrite(info.channel, 0);

      Serial.print("Initialized LED channel: ");
      Serial.print(pair.first);
      Serial.print(" on pin ");
      Serial.print(info.pin);
      Serial.print(" using LEDC channel ");
      Serial.println(info.channel);
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

  // Set the intensity for a given color and update the PWM output
  void setIntensity(const String& color, int value) {
    auto it = channels.find(color);
    if (it != channels.end()) {
      // Update stored intensity value
      it->second.intensity = value;

      // Apply PWM value to the LED
      ledcWrite(it->second.pin, value);

      Serial.print("Set ");
      Serial.print(color);
      Serial.print(" intensity to ");
      Serial.print(value);
      Serial.print(" on channel ");
      Serial.println(it->second.channel);
    }
  }
};

// Instantiate LED map
LEDMap leds;

void setup() {
  Serial.begin(115200);
  // while (!Serial) { delay(10); }

  // Initialize LED channels
  leds.begin();

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("CONNECTED!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Define server routes
  server.on("/", HTTP_GET, [](){
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.on("/config", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      String body = server.arg("plain");
      Serial.println("Received POST request to /config with body:");
      Serial.println(body);

      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, body);

      if (error) {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
        server.send(400, "application/json", "{\"success\":false,\"error\":\"Invalid JSON\"}");
        return;
      }

      // Verify JSON is an object
      if (!doc.is<JsonObject>()) {
        Serial.println("JSON is not an object");
        server.send(400, "application/json", "{\"success\":false,\"error\":\"JSON must be an object\"}");
        return;
      }

      JsonObject obj = doc.as<JsonObject>();

      // Check if JSON is empty
      if (obj.size() == 0) {
        Serial.println("JSON is empty");
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
            Serial.print("Invalid value for ");
            Serial.print(channel);
            Serial.println(" - must be an integer");
            server.send(400, "application/json", 
              "{\"success\":false,\"error\":\"Values must be integers between 0-255\"}");
            return;
          }

          // Get the value
          int value = obj[channel].as<int>();
          
          // Validate range
          if (value < 0 || value > 255) {
            Serial.print("Invalid value for ");
            Serial.print(channel);
            Serial.println(" - out of range (0-255)");
            server.send(400, "application/json", 
              "{\"success\":false,\"error\":\"Values must be integers between 0-255\"}");
            return;
          }

          // Update the LED intensity for this channel
          leds.setIntensity(channel, value);
          hasValidChannel = true;

          // Log the valid value
          Serial.print(channel);
          Serial.print(": ");
          Serial.println(value);
        }
      }

      // Check if any valid channels were found
      if (!hasValidChannel) {
        Serial.println("No valid color channels found");
        server.send(400, "application/json", 
          "{\"success\":false,\"error\":\"No valid color channels provided\"}");
        return;
      }

      // All validations passed
      server.send(200, "application/json", "{\"success\":true}");
    } else {
      server.send(400, "application/json", "{\"success\":false,\"error\":\"No body provided\"}");
    }
  });

  // Start the server
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}
