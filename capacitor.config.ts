import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yabosen.moscoviumcalculator",
  appName: "Moscovium Calculator",
  webDir: "desktop/app-dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
