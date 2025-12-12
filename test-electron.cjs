const { app, ipcMain, BrowserWindow } = require('electron');
console.log('app:', typeof app);
console.log('ipcMain:', typeof ipcMain);
console.log('BrowserWindow:', typeof BrowserWindow);
if (app) {
  app.on('ready', () => {
    console.log('App is ready!');
    app.quit();
  });
} else {
  console.log('app is undefined - not running in main process');
  process.exit(1);
}
