import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import process from 'node:process';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const tunnelHost = env.VITE_TUNNEL_HOST || env.VITE_HMR_HOST;
    const tunnelOrigin = env.VITE_TUNNEL_ORIGIN;

    const server = {
        // Bind explicitly to localhost and a fixed port so Cloudflare Tunnel can target it
        host: '127.0.0.1',
        port: 5176,
        strictPort: true,
        cors: true,
    };

    if (tunnelOrigin) {
        server.origin = tunnelOrigin;
    }

    if (tunnelHost) {
        // HMR over secure WebSocket via the same Tunnel host on port 443
        server.hmr = {
            protocol: 'wss',
            host: tunnelHost,
            clientPort: 443,
        };
    }

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: 'resources/js/ssr.jsx',
                refresh: true,
            }),
            react(),
            tailwindcss(),
        ],
        esbuild: {
            jsx: 'automatic',
        },
        server,
    };
});
