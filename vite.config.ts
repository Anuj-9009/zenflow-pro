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
                            // Externalize packages that can't be bundled (dynamic requires)
                            external: [
                                'electron',
                                'ytdl-core',
                                'yt-search',
                                'cheerio',
                                'miniget',
                                'm3u8stream',
                                'sax',
                                'htmlparser2',
                                'domutils',
                                'domhandler',
                                'dom-serializer',
                                'css-select',
                                'css-what',
                                'entities',
                                'parse5',
                                'parse5-htmlparser2-tree-adapter'
                            ],
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
