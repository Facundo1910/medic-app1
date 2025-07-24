const { defineConfig } = require('@vue/cli-service')
module.exports = {
  pwa: {
    name: 'MedicApp',
    themeColor: '#1976d2',
    msTileColor: '#1976d2',
    manifestOptions: {
      short_name: 'MedicApp',
      start_url: '.',
      display: 'standalone',
      background_color: '#ffffff',
      icons: [
        {
          src: './img/97781016-343c-424b-b302-ea7d26d795b0.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: './img/97781016-343c-424b-b302-ea7d26d795b0.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  },
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_FIRMAS || 'https://medic-app1.vercel.app/api/firmas',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    }
  }
}
