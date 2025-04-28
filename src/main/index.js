import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const gm = require('gm').subClass({ imageMagick: '7+' });
const Excel = require('exceljs');
const fs = require('fs');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1300,
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

  console.log("你好")
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle("r:openFile", async (_, params) => {
    const opt = {
      img: { name: '图片', extensions: ['jpg', 'jpeg', 'png'] }, 
      excel: { name: '表格', extensions: ['xlsx', 'xlsm'] },
      font: { name: '字体', extensions: ['ttf', 'otf', 'ttc'] },
      cfgopen: { name: '配置文件', extensions: ['json'] },
      cfgsave: { name: '配置文件', extensions: ['json'] },
    }
    const options = params === "out" ? {
      title: "选择输出目录",
      properties: ["openDirectory"],
      filters: [
      { name: '输出目录', extensions: ['*'] }
      ]
    } : {
      title: "选择文件",
      properties: ["openFile"],
      filters: [opt[params], { name: 'All Files', extensions: ['*'] }]
    }
    const result = await dialog.showOpenDialog(options)
    if (result.canceled) return null
    return result.filePaths
  })

  /* 批量处理 */
  let invTim
  let isWork = true
  ipcMain.handle("r:batch", async(ev, payload) => {
    payload = JSON.parse(payload)
    console.log(payload)
    const workbook = new Excel.Workbook()
    try {
      await workbook.xlsx.readFile(payload.excelUrl)
      invTim = new Date()
      return solveSheet(workbook, payload)
    } catch(e) {console.log(e); return}
  })

  /* 暂停批处理 */
  ipcMain.handle("r:stop", () => {
    isWork = false
    return 0
  })
  
  /* 导入配置 */
  ipcMain.handle("r:cfgOpen", async (ev, cfgOpenUrl) => {
    try {
      return fs.readFileSync(cfgOpenUrl, 'utf-8')
    } catch(e) {console.log(e); return}
  })


  /* 保存配置 */
  ipcMain.handle("r:cfgSave", async (ev, payload) => {
    let {cfg, cfgSaveUrl} = JSON.parse(payload)
    try {
      fs.writeFileSync(cfgSaveUrl, cfg)
      return 0
    } catch(e) {console.log(e); return -1}
  })



  /* 批量处理：提取表单，生成图片 */
  function solveSheet (workbook, payload) {
    console.log(solveSheet)
    const {imgUrl, excelUrl, fontUrl, worksheetName, outUrl, row1, row2, subList} = payload
    const worksheet = workbook.getWorksheet(worksheetName)
    if (!worksheet) {console.log("no sheet");return}
    // 遍历每一行
    let picCount = 0
    for (let i = row1; i <= row2; i++) {
      console.log(isWork)
      if (isWork) {
        console.log(i)
        const perRow = worksheet.getRow(i)
        const perRowVal = perRow.values
        const onePic = gm(imgUrl)
        let outFileName = ""
        for (let v of subList) {
          if (v.checked) {
            v.x = parseInt(v.x); v.y = parseInt(v.y); v.fz = parseInt(v.fz); v.smfz = parseInt(v.smfz); v.flimit = parseInt(v.flimit)
            let colIdx = v.col.trim().toUpperCase().charCodeAt(0)-64
            console.log(perRowVal[colIdx])
            let addText = perRowVal[colIdx]+"", curFz = addText.length<=v.flimit ? v.fz: v.smfz
            onePic.stroke(v.color).fill(v.color).font(fontUrl, curFz)
            .drawText(v.x-curFz*addText.length/2, v.y+curFz/2, addText)
            if (v.fnamechecked) {
              if (outFileName) outFileName+=`_${addText}`
              else outFileName+=addText
            }
          }
        }
        if (outFileName) {
          onePic.write(`${outUrl}/${outFileName}.jpg`, function(err) {if(err)console.log(err)})
          picCount ++
        } else throw "输出文件名为空"
      } else continue
    }
    const usedT = (new Date() - invTim)/1000
    console.log(`表单${worksheetName}处理完成, 共生成${picCount}张图片, 用时${usedT}s`)
    isWork = true
    return [worksheetName, picCount, usedT]
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
