<template>
  <!-- <img alt="logo" class="logo" src="./assets/electron.svg" />
  <div class="creator">Powered by electron-vite</div>
  <div class="text">
    Build an Electron app with
    <span class="vue">Vue</span>
  </div>
  <p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
  <div class="actions">
    <div class="action">
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="ipcHandle">Send IPC</a>
    </div>
  </div>
  <Versions /> -->
  <!-- <a-space direction="vertical" style="width: 100%" size="large">
    <a-upload v-model:file-list="imgList" list-type="picture" :max-count="1" action="//jsonplaceholder.typicode.com/posts/"
    @change="imgUploadEv">
      <a-button>
        <upload-outlined></upload-outlined>
        Upload (Max: 1)
      </a-button>
    </a-upload>
  </a-space> -->

  <span>图片： </span><a-input class="ip-url" v-model:value="ipImgUrl" placeholder="填写图片路径" />
  <span>表格： </span><a-input class="ip-url" v-model:value="ipExcelUrl" placeholder="填写表格路径" />

  <div class="div-sub-head">
    表单：<a-input class="ip-url" v-model:value="worksheetName" placeholder="填写表单名称" />
    从第<a-input class="ip-short" v-model:value="row1" placeholder="几" />行
    到第<a-input class="ip-short" v-model:value="row2" placeholder="几" />行
  </div>

  <ul class="ul-sub">
    <li v-for="(v, i) in subList">
      ⭐<a-checkbox v-model:checked="v.checked">&nbsp;&nbsp;</a-checkbox>
      第<a-input class="ip-short" v-model:value="v.col" placeholder="几" />列数据重绘至图像x:<a-input class="ip-short" v-model:value="v.x" placeholder="几" />,&nbsp; 
      y:<a-input class="ip-short" v-model:value="v.y" placeholder="几" />,&nbsp;
      字号:<a-input class="ip-short" v-model:value="v.fz" placeholder="几" />,&nbsp;
      颜色:<a-input class="ip-short" v-model:value="v.color" placeholder="" />
    </li>
  </ul>

  <div>
    输出文件夹路径: <a-input class="ip-url" v-model:value="outUrl" placeholder="填写输出路径" />
  </div>

  <a-button class="btn-batch" type="primary" @click="btnBatchClick">批量处理</a-button>
</template>

<script setup>
// import Versions from './components/Versions.vue'

// const ipcHandle = () => window.electron.ipcRenderer.send('ping')

import { reactive, ref } from "vue"

const ipImgUrl = ref(""), ipExcelUrl = ref(""), worksheetName = ref(""), outUrl = ref(""), row1 = ref(0), row2 = ref(0)

const subList = reactive([
  {checked: false, col: 0, x: 0, y: 0, fz: 14, color: "black"},
  {checked: false, col: 0, x: 0, y: 0, fz: 14, color: "black"},
  {checked: false, col: 0, x: 0, y: 0, fz: 14, color: "black"},
  {checked: false, col: 0, x: 0, y: 0, fz: 14, color: "black"},
  {checked: false, col: 0, x: 0, y: 0, fz: 14, color: "black"}
])

async function btnBatchClick () {
  const res = await window.electron.ipcRenderer.invoke('r:batch', encodeURI(JSON.stringify(
  {
    imgUrl: solveUrl(ipImgUrl.value), excelUrl: solveUrl(ipExcelUrl.value), worksheetName: worksheetName.value, outUrl: solveUrl(outUrl.value),
    row1: row1.value, row2: row2.value,
    subList
  }), "utf-8"))
}

function solveUrl (url) {
  return url.replace(/\"/, "").trim()
}

</script>

<style lang="scss">
.ip-url {
  width: 300px;
  margin-right: 30px;
}

.ip-short {
  width: 80px;
}

.div-sub-head {
  margin: 20px 0;
}

.ul-sub {
  li {
    margin-bottom: 20px;
  }
}

.btn-batch {
  margin-top: 50px;
}
</style>