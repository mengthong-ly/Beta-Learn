import type { CapacitorConfig } from "@capacitor/cli"

// The app is a remote shell: it loads the running Next.js server (server
// routes and SSR can't be bundled). Set CAP_SERVER_URL to the deployed URL for
// release builds, then run `npx cap sync`. The default is the dev server; on
// Android run `adb reverse tcp:3000 tcp:3000` so localhost reaches your Mac.
const url = process.env.CAP_SERVER_URL ?? "http://localhost:3000"

const config: CapacitorConfig = {
  appId: "com.thonglearn.app",
  appName: "ThongLearn",
  webDir: "native-shell",
  server: { url, cleartext: url.startsWith("http:") },
  // Keep pages clear of the notch and status bar without touching app CSS.
  ios: { contentInset: "always" },
}

export default config
