import { defineConfig } from 'vite'
import process from "node:process";
import { loadEnv } from "vite";
import vue from '@vitejs/plugin-vue'
import postcsspxtoviewport from "postcss-px-to-viewport";
import AutoImport from "unplugin-auto-import/vite";
import path from "path";
import VueRouter from "unplugin-vue-router/vite";
import { VueRouterAutoImports } from "unplugin-vue-router";
import Components from "unplugin-vue-components/vite";
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig((modeObj) => {
  const root = process.cwd();
  const env = loadEnv(modeObj.mode, root);
  const { VITE_APP_API_BASE_URL } = env;
  return {
    plugins: [
      vue(),
      VueRouter({
        extensions: [".vue"],
        routesFolder: "src/views",
        dts: "src/types/typed-router.d.ts",
        exclude: ["**/components/*.vue"], // 排除页面级文件夹 components 目录下的 .vue 文件
      }),
      VueDevTools(),
      Components({
        extensions: ["vue"],
        include: [/\.vue$/, /\.vue\?vue/],
        dts: "src/types/components.d.ts",
      }),
      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue$/,
          /\.vue\?vue/, // .vue
          /\.md$/, // .md
        ],
        imports: ["vue", "@vueuse/core", "vue-router", VueRouterAutoImports], // 自动导入
        //这个一定要配置，会多出一个auto-import.d.ts文件，
        dts: "src/types/auto-imports.d.ts",
      })
    ],
    base: modeObj.mode == 'app' ? './' : '/',
    server: {
      host: true,
      port: 3000,
      proxy: {
        "/member": {
          target: VITE_APP_API_BASE_URL,
          ws: false,
          changeOrigin: true,
        },
      },
      hmr: {
        overlay: false
      }
    },
    resolve: {
      alias: {
        "~@": path.join(__dirname, "./src/"),
        "@": path.join(__dirname, "./src/"),
        "~": path.join(__dirname, "./src/assets"),
      },
    },
    css: {
      postcss: {
        plugins: [
          postcsspxtoviewport({
            unitToConvert: "px", // 要转化的单位
            viewportWidth: 1920, // UI设计稿的宽度
            unitPrecision: 6, // 转换后的精度，即小数点位数
            propList: ["*"], // 指定转换的css属性的单位，*代表全部css属性的单位都进行转换
            viewportUnit: "vw", // 指定需要转换成的视窗单位，默认vw
            fontViewportUnit: "vw", // 指定字体需要转换成的视窗单位，默认vw
            selectorBlackList: ["ignore-"], // 指定不转换为视窗单位的类名，
            minPixelValue: 1, // 默认值1，小于或等于1px则不进行转换
            mediaQuery: true, // 是否在媒体查询的css代码中也进行转换，默认false
            replace: true, // 是否转换后直接更换属性值
            landscape: false, // 是否处理横屏情况
          })
        ]
      },
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["legacy-js-api"],
          additionalData: `
        @use "@/assets/styles/mixin.scss" as *;
        @use "@/assets/styles/var.scss" as *;
    `,
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: "static", // 静态资源目录
      chunkSizeWarningLimit: 1500,
      emptyOutDir: true, // 每次构建时清空目录
      rollupOptions: {
        output: {
          // 最小化拆分包
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id.toString().split("node_modules/")[1].split("/")[0].toString()
            }
          },
          // 用于从入口点创建的块的打包输出格式[name]表示文件名,[hash]表示该文件内容hash值
          entryFileNames: '[name].js',
          // 用于命名代码拆分时创建的共享块的输出命名
          // 　　chunkFileNames: 'js/[name].[hash].js',
          // 用于输出静态资源的命名，[ext]表示文件扩展名
          assetFileNames: 'static/[ext]/[name].[hash].[ext]',
          // 拆分js到模块文件夹
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/') : [];
            const fileName = facadeModuleId[facadeModuleId.length - 2] || '[name]';
            return `static/js/${fileName}/[name].[hash].js`;
          },
        }
      }
    }
  }
})
