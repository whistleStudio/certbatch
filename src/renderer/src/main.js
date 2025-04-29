import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import {Button, Alert, Input, Select, Checkbox} from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

createApp(App).use(Button).use(Alert).use(Input).use(Select).use(Checkbox).mount('#app')
