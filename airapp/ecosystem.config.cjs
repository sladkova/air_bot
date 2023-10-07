module.exports = {
  apps: [
    {
      name: 'air_bot_server',
      port: '3001',
      exec_mode: 'cluster',
      instances: '1',
      script: './server.js'
    }
  ]
}
