import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: isProd ? 'terser' : false, // 告诉 vite 用 terser 来压缩
      terserOptions: isProd ? {
        compress: {
          drop_console: true, // 删除 console
          drop_debugger: true, // 删除 debugger
          pure_funcs: ['console.log'], // 彻底优化掉 console.log 调用
        },
        format: {
          comments: false, // 移除注释
        }
      } : undefined
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: isProd ? 'terser' : false
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()],
    build: {
      minify: isProd ? 'terser' : 'esbuild',
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      } : undefined
    }
  }
})
