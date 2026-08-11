const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow, ipcMain, Menu, nativeTheme, screen } = require("electron");

const MODE_SIZES = {
  standard: { width: 360, height: 500 },
  scientific: { width: 690, height: 560 },
  graphing: { width: 760, height: 600 },
  programmer: { width: 720, height: 620 },
  date: { width: 460, height: 560 },
  currency: { width: 360, height: 650 },
};
const CONVERTER_SIZE = { width: 460, height: 540 };
const HISTORY_EXTRA_WIDTH = 254;

app.setAppUserModelId("com.yabosen.moscoviumcalculator");
app.disableHardwareAcceleration();
nativeTheme.themeSource = "system";

function getWindowIcon() {
  const packagedIcon = path.join(
    process.resourcesPath,
    process.platform === "win32" ? "Calc.ico" : "Calc.png",
  );
  const developmentIcon = path.join(
    __dirname,
    process.platform === "win32" ? "Calc.ico" : "build/icons/256x256.png",
  );

  return fs.existsSync(packagedIcon) ? packagedIcon : developmentIcon;
}

function createWindow() {
  const window = new BrowserWindow({
    width: MODE_SIZES.standard.width,
    height: MODE_SIZES.standard.height,
    minWidth: 344,
    minHeight: 460,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#131217" : "#f6f3fa",
    icon: getWindowIcon(),
    title: "Calculator",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true,
    },
  });

  window.loadFile(path.join(__dirname, "app-dist", "index.html"));
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("did-fail-load", (_event, code, description) => {
    console.error("Renderer failed to load", { code, description });
  });
  window.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process ended", details);
  });
  window.once("ready-to-show", () => window.show());
}

Menu.setApplicationMenu(null);

ipcMain.on("window:set-layout", (event, layout) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  const size = MODE_SIZES[layout?.mode] ?? CONVERTER_SIZE;
  const current = window.getBounds();
  const workArea = screen.getDisplayMatching(current).workArea;
  const width = Math.min(workArea.width, size.width + (layout?.historyOpen ? HISTORY_EXTRA_WIDTH : 0));
  const height = Math.min(workArea.height, size.height);
  const x = Math.max(workArea.x, Math.min(current.x, workArea.x + workArea.width - width));
  const y = Math.max(workArea.y, Math.min(current.y, workArea.y + workArea.height - height));
  window.setBounds({ ...current, x, y, width, height }, true);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
