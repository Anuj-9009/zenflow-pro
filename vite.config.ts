import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'

export default defineConfig({
    plugins: [
        react(),
        electron([
            {
                entry: 'electron/main.ts',
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['electron'],
                            output: {
                                format: 'cjs',
                                entryFileNames: 'main.js',
                                inlineDynamicImports: true
                            }
                        }
                    }
                }
            },
            {
                entry: 'electron/preload.ts',
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['electron'],
                            output: {
                                format: 'cjs',
                                entryFileNames: 'preload.js',
                                inlineDynamicImports: true
                            }
                        }
                    }
                }
            }
        ])
    ],
    server: {
        port: 3000,
        strictPort: false
    },
    base: './'
})
