import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fontUrl from "../../resources/font/msyhl.ttc?asset"

const gm = require('gm').subClass({ imageMagick: '7+' });
const Excel = require('exceljs');
const fs = require('fs');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  let invTim
  ipcMain.handle("r:batch", (ev, payload) => {
    console.log("ssss", decodeURI(payload, "utf-8"))
    payload = JSON.parse(decodeURI(payload, "utf-8"))
    console.log(payload)
    
    const workbook = new Excel.Workbook()
    ;(async() => {
      try {
        await workbook.xlsx.readFile(payload.excelUrl)
        invTim = new Date()
        solveSheet(payload)
      } catch(e) {console.log(e)}
    })()
    return 0
  })

  /* 表单处理 */
  function solveSheet (payload) {
    const {imgUrl, excelUrl, worksheetName, outUrl, row1, row2, subList} = payload
    const worksheet = workbook.getWorksheet(worksheetName)
    if (!worksheet) {console.log("no sheet");return}
    // 遍历每一行
    for (let i = row1; i <= row2; i++) {
      const perRow = worksheet.getRow(i)
      console.log(perRow)
      // perRow.eachCell((cell, colNumber) => {
      //   rowData[`Column ${colNumber}`] = cell.value;
      // });
    }
    console.log(`${groups[sheetIdx]} done. used ${(new Date() - invTim)/1000} s`)
  }


  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
