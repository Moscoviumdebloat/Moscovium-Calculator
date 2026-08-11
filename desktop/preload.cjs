const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  setWindowLayout(layout) {
    ipcRenderer.send("window:set-layout", {
      mode: String(layout?.mode ?? "standard"),
      historyOpen: Boolean(layout?.historyOpen),
    });
  },
});
