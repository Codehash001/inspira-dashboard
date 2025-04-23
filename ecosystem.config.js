module.exports = {
  apps: [
    {
      name: 'inspira-dashboard',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
      kill_timeout: 600000, // 10 minutes
      wait_ready: true,
      listen_timeout: 600000,
      max_memory_restart: '1G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      time: true
    },
  ],
}
