import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@app': resolve(__dirname, 'src/app'),
            '@entities': resolve(__dirname, 'src/entities'),
            '@features': resolve(__dirname, 'src/features'),
            '@shared': resolve(__dirname, 'src/shared'),
            '@pages': resolve(__dirname, 'src/pages'),
            '@widgets': resolve(__dirname, 'src/widgets'),
            '@processes': resolve(__dirname, 'src/processes'),
            '@type': resolve(__dirname, 'src/types'),
            '@assets': resolve(__dirname, 'src/assets'),
        },
    },
});
