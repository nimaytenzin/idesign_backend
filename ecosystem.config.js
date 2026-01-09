module.exports = {
  apps: [
    {
      name: 'idesign-backend',
      script: './dist/main.js',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true, // Prepend logs with timestamp
      merge_logs: true, // Merge logs from all instances
      autorestart: true, // Auto restart on crash
      max_restarts: 10, // Maximum number of restarts
      min_uptime: '10s', // Minimum uptime to consider app stable
      restart_delay: 4000, // Delay between restarts (ms)
      kill_timeout: 5000, // Time to wait before force kill
      wait_ready: true, // Wait for ready signal
      listen_timeout: 10000, // Timeout for listen event
      shutdown_with_message: true, // Graceful shutdown
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],

};

