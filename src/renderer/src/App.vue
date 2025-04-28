<!-- 问题 
1 input 校验 
-->
<template>
  <a-alert class="alert" :message="alertInfo.msg" :type="alertInfo.tp" show-icon v-if="alertInfo.isShow"/>

  <span>图片路径： </span>
  <a-input class="ip-url" v-model:value="ipImgUrl" placeholder="填写图片路径(~/tupian.png)">
    <template #suffix><span class="sp-file-open" @click="spOpenFileClick('img')">🗁</span></template>
  </a-input>
  <span>表格路径： </span><a-input class="ip-url" v-model:value="ipExcelUrl" placeholder="填写表格路径(~/biaoge.xlsx)" />
  <span>字体路径： </span><a-input class="ip-url" v-model:value="ipFontUrl" placeholder="填写字体路径(~/msyhl.ttc)" />

  <div class="div-sub-head">
    表单：<a-input class="ip-url" v-model:value="worksheetName" placeholder="填写表单名称" />
    从第<a-input class="ip-mid" v-model:value="row1" />行
    到第<a-input class="ip-mid" v-model:value="row2" />行
  </div>

  <ul class="ul-sub">
    <li v-for="(v, i) in subList">
      ⭐<a-checkbox v-model:checked="v.checked">&nbsp;&nbsp;</a-checkbox>
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
    输出文件夹路径: <a-input class="ip-url" v-model:value="outUrl" placeholder="填写输出路径" />
  </div>

  <a-button class="btn-batch" type="primary" @click="btnBatchClick" :loading="solveSta==1">批量处理</a-button>

  <hr>
  <div style="margin-top: 20px;">
    <a-button class="btn-cfg" type="primary" @click="btnCfgOpenClick" :loading="solveSta==1">导入配置</a-button>
    <a-input class="ip-url" v-model:value="ipCfgOpenUrl" placeholder="填写导入路径(~/cfg1.json)" />&nbsp;&nbsp;
    <a-button class="btn-cfg" type="primary" @click="btnCfgSaveClick" :loading="solveSta==1">保存配置</a-button>
    <a-input class="ip-url" v-model:value="ipCfgSaveUrl" placeholder="填写保存路径(~/cfg2.json)" />
  </div>
</template>

<script setup>
// import Versions from './components/Versions.vue'

// const ipcHandle = () => window.electron.ipcRenderer.send('ping')

import { reactive, ref } from "vue"

const ipImgUrl = ref(""), 
ipExcelUrl = ref(""), 
ipFontUrl = ref(""),
worksheetName = ref(""), outUrl = ref(""), row1 = ref(0), row2 = ref(0), solveSta = ref(0),
ipCfgOpenUrl = ref(""), ipCfgSaveUrl = ref("")

const subList = reactive([
  {checked: false, col: "A", x: 0, y: 0, fz: 50, smfz: 30, flimit: 11, color: "black", fnamechecked: true},
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
  
}

async function btnBatchClick () {
  switch (solveSta.value) {
    case 0:
      let payload
      try {
        payload = JSON.stringify({
          imgUrl: solveUrl(ipImgUrl.value), excelUrl: solveUrl(ipExcelUrl.value), fontUrl: solveUrl(ipFontUrl.value), outUrl: solveUrl(outUrl.value),
          worksheetName: worksheetName.value, row1: parseInt(row1.value), row2: parseInt(row2.value), subList
        })
      } catch (e) {console.log(e);changeAlertInfo("数据填写异常", "error");break}
      solveSta.value = 1
      var res = await window.electron.ipcRenderer.invoke('r:batch', payload)
      if (res) changeAlertInfo(`表单${res[0]}处理完成, 共生成${res[1]}张图片, 用时${res[2]}s`, "success")
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


/* 消息提示 */
let timer_alert = 0
function changeAlertInfo(msg="", tp="info", isShow=true) {
  clearTimeout(timer_alert)
  console.log("changeAlertInfo")
  if (isShow) {
    alertInfo.isShow = true; alertInfo.msg = msg; alertInfo.tp = tp;
    setTimeout(() => {alertInfo.isShow=false}, 1000)
  } else alertInfo.isShow = false
}

/* 导入配置 */
async function btnCfgOpenClick () {
  const res = await window.electron.ipcRenderer.invoke('r:cfgOpen', solveUrl(ipCfgOpenUrl.value))
  if (res) {
    const cfg = JSON.parse(res)
    ipImgUrl.value = cfg.ipImgUrl; ipExcelUrl.value = cfg.ipExcelUrl; ipFontUrl.value = cfg.ipFontUrl;
    worksheetName.value = cfg.worksheetName; row1.value = cfg.row1; row2.value = cfg.row2;
    subList.forEach((v, i) => {
      for (const key in v) {
        if (v.hasOwnProperty(key) && cfg.subList[i].hasOwnProperty(key)) {
          v[key] = cfg.subList[i][key]
        }
      }
    })
    changeAlertInfo("保存成功", "success")
  }
  else changeAlertInfo("导入失败", "error")
}

/* 保存配置 */
async function btnCfgSaveClick () {
  const cfg = {
    ipImgUrl: ipImgUrl.value, ipExcelUrl: ipExcelUrl.value, ipFontUrl: ipFontUrl.value, 
    worksheetName: worksheetName.value, row1: row1.value, row2: row2.value,
    subList
  }
  const res = await window.electron.ipcRenderer.invoke('r:cfgSave', JSON.stringify({cfg: JSON.stringify(cfg), cfgSaveUrl: solveUrl(ipCfgSaveUrl.value)}))
  if (!res) changeAlertInfo("保存成功", "success")
  else changeAlertInfo("保存失败", "error")
}


// "C:\Users\whistle\Desktop\2024-2025青少年人工智能竞赛-智能机器人项目获奖名单（宿迁、常州、无锡、南京、泰州市赛）.xlsx"
// 处理左右"及\
function solveUrl (url) {return url.replace(/\"/g, "").replace(/\\/g, "\/").trim()}

// const ipImgUrl = ref("C:/Users/whistle/Desktop/微信图片_20250424105922.png"), 
// ipExcelUrl = ref("C:/Users/whistle/Desktop/2024-2025青少年人工智能竞赛-智能机器人项目获奖名单（宿迁、常州、无锡、南京、泰州市赛）.xlsx"), 
// ipFontUrl = ref("C:/Users/whistle/Desktop/ttt/font/msyhl.ttc"),
// worksheetName = ref("选手小低-2238"), outUrl = ref("C:/Users/whistle/Desktop/ttt"), row1 = ref(5), row2 = ref(10), solveSta = ref(0)


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
}

.ip-short {width: 40px;}
.ip-mid {width: 60px;}

.div-sub-head {
  margin: 20px 0;
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
</style>