import { createApp } from 'vue'
import { Quasar, Notify } from 'quasar'
import router from './router/router.js'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar } from '@quasar/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    quasar({
      sassVariables: 'src/quasar-variables.sass' // <-- AQUÍ SE LLAMA EL ARCHIVO
    })
  ]
})

// Import Quasar css
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import App from './App.vue'

const app = createApp(App)

app.use(router)
app.use(Quasar, {
  plugins: {
    Notify
  }
})

app.mount('#app')
