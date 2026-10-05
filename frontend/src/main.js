import { createApp } from 'vue'
import { Quasar, Notify } from 'quasar'
import router from './router/router.js'

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
