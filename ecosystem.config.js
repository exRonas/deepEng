module.exports = {
  apps: [
    {
      name: "deepeng-app",
      script: "./backend/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
        HOST: "0.0.0.0"
      },
      watch: false
    }
  ]
};
