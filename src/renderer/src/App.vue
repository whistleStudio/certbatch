<!-- 问题 
1 input 校验 
-->
<template>
  <a-alert class="alert" :message="alertInfo.msg" :type="alertInfo.tp" show-icon v-if="alertInfo.isShow"/>

  <span class="sp-required">*</span>图片路径： 
  <a-input class="ip-url" v-model:value="ipImgUrl" placeholder="填写图片路径(~/tupian.png)">
    <template #suffix><span class="sp-file-open" @click="spOpenFileClick('img')">🗁</span></template>
  </a-input>
  <span class="sp-required">*</span>表格路径： 
  <a-input class="ip-url" v-model:value="ipExcelUrl" placeholder="填写表格路径(~/biaoge.xlsx)">
    <template #suffix><span class="sp-file-open" @click="spOpenFileClick('excel')">🗁</span></template>
  </a-input>  
  <span>字体路径： </span>
  <a-input class="ip-url" v-model:value="ipFontUrl" placeholder="填写字体路径(~/msyhl.ttc)">
    <template #suffix><span class="sp-file-open" @click="spOpenFileClick('font')">🗁</span></template>
  </a-input>
  <div class="div-sub-head">
    表单： <a-select v-model:value="worksheetName" size="middle" placeholder="请选择表单" :style="{width: '200px'}" :options="sheetNameOpts"></a-select>
    从第<a-input class="ip-mid" v-model:value="row1" />行
    到第<a-input class="ip-mid" v-model:value="row2" />行
    <span class="sp-desc">ℹ️默认设置: 字体微软雅黑Light, 黑色;  生成文件以时间戳命名</span>
  </div>

  <ul class="ul-sub">
    <li v-for="(v, i) in subList">
      ⭐<a-checkbox v-model:checked="v.checked" style="margin-right: 10px;"></a-checkbox>
      第<a-input class="ip-short" v-model:value="v.col" :disabled="!v.checked"
      />列数据重绘至图像x:<a-input class="ip-mid" v-model:value="v.x" :disabled="!v.checked"/>,&nbsp; 
      y:<a-input class="ip-mid" v-model:value="v.y" :disabled="!v.checked"/>,&nbsp;
      标准字号:<a-input class="ip-mid" v-model:value="v.fz" :disabled="!v.checked"/>,&nbsp;
      小字号:<a-input class="ip-mid" v-model:value="v.smfz" :disabled="!v.checked"/>,&nbsp;
      字数阈值:<a-input class="ip-short" v-model:value="v.flimit" :disabled="!v.checked"/>,&nbsp;
      颜色:<a-input class="ip-mid" v-model:value="v.color" placeholder="" :disabled="!v.checked"/>,&nbsp;
      文件名是否包含: <a-checkbox v-model:checked="v.fnamechecked" :disabled="!v.checked">&nbsp;&nbsp;</a-checkbox>
    </li>
  </ul>

  <div>
    <span class="sp-required">*</span>输出文件夹路径: 
    <a-input class="ip-url" v-model:value="outUrl" placeholder="填写输出路径">
      <template #suffix><span class="sp-file-open" @click="spOpenFileClick('out')">🗁</span></template>
    </a-input>
  </div>

  <a-button class="btn-batch" type="primary" @click="btnBatchClick" :loading="solveSta==1">批量处理</a-button>

  <hr>
  <div style="margin-top: 20px;">
    <a-button class="btn-cfg" type="primary" @click="btnCfgOpenClick" :loading="solveSta==1">导入配置</a-button>
    <a-button class="btn-cfg" type="primary" @click="btnCfgSaveClick" :loading="solveSta==1">保存配置</a-button>
  </div>

  <div class="app-info">小汪套打v{{ packageVersion }}</div>
  <img class="cartoon" src="./assets/images/cartoon.png" alt="" @click="imgCartoonClick" />
</template>

<script setup>
// import Versions from './components/Versions.vue'

// const ipcHandle = () => window.electron.ipcRenderer.send('ping')

import { reactive, ref, watch } from "vue"

const packageVersion = window.package.version

const ipImgUrl = ref(""), ipExcelUrl = ref(""), ipFontUrl = ref(""),
worksheetName = ref(""), outUrl = ref(""), row1 = ref(0), row2 = ref(0), solveSta = ref(0),
ipCfgOpenUrl = ref(""), ipCfgSaveUrl = ref("")

let sheetNameOpts = reactive([]) // 表单名称列表

const subList = reactive([
  {checked: true, col: "A", x: 0, y: 0, fz: 50, smfz: 30, flimit: 11, color: "black", fnamechecked: true},
  {checked: false, col: "A", x: 0, y: 0, fz: 50, smfz: 30, flimit: 11, color: "black", fnamechecked: true},
  {checked: false, col: "A", x: 0, y: 0, fz: 50, smfz: 30, flimit: 11, color: "black", fnamechecked: false},
  {checked: false, col: "A", x: 0, y: 0, fz: 50, smfz: 30, flimit: 11, color: "black", fnamechecked: false},
  {checked: false, col: "A", x: 0, y: 0, fz: 50, smfz: 30, flimit: 11, color: "black", fnamechecked: false}
])
const alertInfo = reactive({
  isShow: false,
  msg: "",
  tp: "info", //success info warning error
})

/* 🗁打开文件夹 */
async function spOpenFileClick(params) {
  const res = await window.electron.ipcRenderer.invoke('r:openFileDialog', params)
  if (res) {
    if (res.errMsg) changeAlertInfo(res.errMsg, "warning")
    switch (params) {
      case "img":
        ipImgUrl.value = res.fileUrl
        break
      case "excel":
        ipExcelUrl.value = res.fileUrl
        upDateSheetNameOpts(res.fileUrl, undefined)
        break
      case "font":
        ipFontUrl.value = res.fileUrl
        break
      case "out":
        outUrl.value = res.fileUrl
        break
      case "cfgopen":
        ipCfgOpenUrl.value = res.fileUrl
        break
      case "cfgsave":
        ipCfgSaveUrl.value = res.fileUrl
        break
    }
  }

}

/* 批量生成 */
async function btnBatchClick () {
  if (!ipImgUrl.value || !ipExcelUrl.value || !outUrl.value) {
    changeAlertInfo("图片、表格、输出文件夹路径不能为空", "warning", 1200)
    return
  }
  if (!worksheetName.value) {
    changeAlertInfo("表单不能为空", "warning")
    return
  }
  switch (solveSta.value) {
    case 0:
      let payload
      try {
        payload = JSON.stringify({
          imgUrl: solveUrl(ipImgUrl.value), excelUrl: solveUrl(ipExcelUrl.value), fontUrl: solveUrl(ipFontUrl.value), outUrl: solveUrl(outUrl.value),
          worksheetName: worksheetName.value, row1: row1.value+'', row2: row2.value+'', subList
        })
      } catch (e) {console.log(e);changeAlertInfo("数据填写异常", "error");break}
      solveSta.value = 1
      var res = await window.electron.ipcRenderer.invoke('r:batch', payload)
      if (res) changeAlertInfo(`表单${res[0]}处理完成, 共生成${res[1]}张图片, 用时${res[2]}s`, "success", 1500)
      else changeAlertInfo("批处理异常", "error")
      console.log("res", res)
      solveSta.value = 0
      console.log(solveUrl(ipExcelUrl.value))
      break
    case 1:
      var res = await window.electron.ipcRenderer.invoke('r:stop')
      solveSta.value = 0
      changeAlertInfo("已暂停", "info")
      break
  }
}

/* 导入配置 */
async function btnCfgOpenClick () {
  await spOpenFileClick('cfgopen')
  if (!ipCfgOpenUrl.value) return
  const res = await window.electron.ipcRenderer.invoke('r:cfgOpen', solveUrl(ipCfgOpenUrl.value))
  if (res) {
    const cfg = JSON.parse(res)
    ipImgUrl.value = cfg.ipImgUrl; ipExcelUrl.value = cfg.ipExcelUrl; ipFontUrl.value = cfg.ipFontUrl;
    row1.value = cfg.row1; row2.value = cfg.row2; outUrl.value = ""
    sheetNameOpts = [], worksheetName.value = ""
    // 如果表格路径存在，则更新表单名称列表
    if (cfg.ipExcelUrl) upDateSheetNameOpts(cfg.ipExcelUrl, cfg.worksheetName)
    subList.forEach((v, i) => {
      for (const key in v) {
        if (v.hasOwnProperty(key) && cfg.subList[i].hasOwnProperty(key)) {
          v[key] = cfg.subList[i][key]
        }
      }
    })
    changeAlertInfo("导入成功", "success")
  }
  else changeAlertInfo("导入失败", "error")
}

/* 保存配置 */
async function btnCfgSaveClick () {
  await spOpenFileClick('cfgsave')
  if (!ipCfgSaveUrl.value) return
  const cfg = {
    ipImgUrl: ipImgUrl.value, ipExcelUrl: ipExcelUrl.value, ipFontUrl: ipFontUrl.value, 
    worksheetName: worksheetName.value, row1: row1.value, row2: row2.value,
    subList
  }
  const res = await window.electron.ipcRenderer.invoke('r:cfgSave', JSON.stringify({cfg: JSON.stringify(cfg), cfgSaveUrl: solveUrl(ipCfgSaveUrl.value)}))
  if (!res) changeAlertInfo("保存成功", "success")
  else changeAlertInfo("保存失败", "error")
}

/* 打开文件夹&导入配置 - 更新表单选项 */
async function upDateSheetNameOpts (excelUrl, sheetName) {
  const res = await window.electron.ipcRenderer.invoke("r:updateSheetName", solveUrl(excelUrl))
  if (res.errMsg) changeAlertInfo(res.errMsg, "warning")
  sheetNameOpts = res.sheetNameOpts.map((v) => ({value: v}))
  if (sheetNameOpts.length) {
    if (!(sheetName || sheetName?.indexOf(res.sheetNameOpts)>-1)) worksheetName.value = res.sheetNameOpts[0]
    else worksheetName.value = sheetName
  } else { worksheetName.value = "" }
}

/* 消息提示 */
let timer_alert = 0
function changeAlertInfo(msg="", tp="info", delay=1000, isShow=true) {
  clearTimeout(timer_alert)
  console.log("changeAlertInfo")
  if (isShow) {
    alertInfo.isShow = true; alertInfo.msg = msg; alertInfo.tp = tp;
    setTimeout(() => {alertInfo.isShow=false}, delay)
  } else alertInfo.isShow = false
}

// "C:\Users\whistle\Desktop\2024-2025青少年人工智能竞赛-智能机器人项目获奖名单（宿迁、常州、无锡、南京、泰州市赛）.xlsx"
// 处理左右"及\
function solveUrl (url) {return url.replace(/\"/g, "").replace(/\\/g, "\/").trim()}

// 网页跳转
function imgCartoonClick () {
  window.electron.ipcRenderer.send("r:openHomepage", "https://whistlestudio.cn/#/home")
}


watch(subList, (newVal) => {
  console.log("newVal", newVal)
  if (!subList[0].checked) {
    changeAlertInfo("请至少勾选一行编辑项", "warning")
    setTimeout(() => subList[0].checked = true, 150)
  }
})


</script>

<style lang="scss">
.alert {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  top: 10px;
  z-index: 2;
}
.ip-url {
  width: 280px;
  margin-right: 20px;
  &:nth-of-type(3) {
    margin-right: 0;
  }
  .sp-file-open {
    font-weight: bold;
    cursor: pointer;
  }
  .ip-file {
    display: none;
  }
}

.ip-short {width: 40px; margin: 0 3px;}
.ip-mid {width: 60px;margin: 0 3px;}

.div-sub-head {
  margin: 20px 0;
  .sp-desc {
    margin-left: 30px;
    font-size: 14px;
    color: #999;
  }
}

.ul-sub {
  li {
    margin-bottom: 20px;
  }
}

.btn-batch {
  margin-top: 30px;
  margin-bottom: 20px;
}
.btn-cfg {
  background-color: #71a71c;
  margin-right: 10px;
  &:hover {
    background-color: #88c722 !important;
  }
}
.app-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  font-size: 17px;
  color: #999;
}
.cartoon {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 130px;
  cursor: pointer;
}
.sp-required {
  color: rgb(230, 104, 20);
  font-size: 14px;
  font-weight: bold;
  margin-right: 3px;
}
</style>