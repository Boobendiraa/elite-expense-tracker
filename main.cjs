const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800
  });

  const indexPath = path.join(__dirname, "dist", "index.html");

  win.loadFile(indexPath);

  
}

function clearExpenses() {
    localStorage.removeItem("expenses");
    location.reload();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});