module.exports = {
  apps: [
    {
      name: 'air_bot',
      port: '8080',
      exec_mode: 'cluster',
      instances: '1',
      script: './index.js'
    }
  ]
}

