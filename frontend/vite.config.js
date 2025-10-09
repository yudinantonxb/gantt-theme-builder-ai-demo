import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const socketUrl = env.VITE_SOCKET_URL || 'http://localhost:3001';

  return {
    server: {
      port: 3000,
      strictPort: true,
      // proxy: {
      //   "/socket.io": socketUrl,
      // },
      host: true,
      origin: 'http://0.0.0.0:3000',
      watch: {
        usePolling: true,
      },
    },
  };
});
