import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: "Christin's Blog",
  description: '一个前端开发者的技术与生活记录',
  srcDir: '.',
  srcExclude: ['README.md', 'node_modules/**', '.vitepress/**'],
  cleanUrls: true,
  ignoreDeadLinks: true,
  vite: {
    assetsInclude: ['**/*.PNG'],
  },
  themeConfig: {
    logo: '/img.png',
    nav: [
      { text: '首页', link: '/' },
      { text: 'AI 实践', link: '/AI 实践/Claude code 多模型协作' },
      { text: '前端技术', link: '/浏览器渲染原理' },
      { text: '关于', link: '/LIFE/亲身经历了一次裁员' },
    ],
    sidebar: [
      {
        text: 'AI 实践',
        collapsed: false,
        items: [
          { text: 'Claude code 多模型协作', link: '/AI 实践/Claude code 多模型协作' },
          { text: 'IDE AI Assistant 使用 claude code', link: '/AI 实践/IDE AI Assistant 使用 claude code' },
          { text: 'Antigravity 做本地 API 中转', link: '/AI 实践/Antigravity 做本地 API 中转' },
          { text: 'Claude code status line', link: '/AI 实践/Claude code status line' },
          { text: 'dev-browser skills 连接浏览器', link: '/AI 实践/dev-browser skills 连接浏览器' },
          { text: 'AI 素养：框架与基础', link: '/AI 实践/AI 素养：框架与基础' },
          { text: 'Claude Code not right', link: '/AI 实践/Claude Code not right' },
          { text: 'claude code 添加任务完成提醒', link: '/AI 实践/claude code 添加任务完成提醒' },
          { text: 'AI 工程化经验记录', link: '/AI 实践/AI 工程化经验记录' },
          { text: 'AI coding better practice', link: '/AI 实践/AI coding better practice' },
        ],
      },
      {
        text: '前端技术',
        collapsed: false,
        items: [
          { text: '浏览器渲染原理', link: '/浏览器渲染原理' },
          { text: 'WebRTC 基础实践', link: '/WebRTC 基础实践' },
          { text: 'Agora web 观看直播开发实践', link: '/Agora web 观看直播开发实践' },
          { text: 'ahooks 简介 + 部分源码分析', link: '/ahooks 简介 + 部分源码分析' },
          { text: '想好再用 useEffect', link: '/想好再用 useEffect' },
          { text: 'async await 原理', link: '/async await 原理' },
          { text: 'macOS 安装 React Native 环境', link: '/macOS 安装 React Native 环境' },
        ],
      },
      {
        text: 'Node.js',
        collapsed: false,
        items: [
          { text: 'Node.js 模块化', link: '/Node.js 模块化' },
          { text: 'Node.js 流', link: '/Node.js 流' },
          { text: '使用 node 中间件统一处理站内信', link: '/使用 node 中间件统一处理站内信' },
        ],
      },
      {
        text: '省钱指南',
        collapsed: false,
        items: [
          { text: '土区及美区 Google one 开通方式', link: '/土区及美区 Google one 开通方式' },
          { text: '借用维基百科开通美区 PayPal', link: '/借用维基百科使用 Google Voice 开通美区 PayPal' },
          { text: '9 块钱申请一个新西兰手机号', link: '/9 块钱申请一个新西兰手机号' },
          { text: '借用 Google Workspace 低价购买域名', link: '/domain' },
        ],
      },
      {
        text: '代码之外',
        collapsed: false,
        items: [
          { text: '亲身经历了一次裁员', link: '/LIFE/亲身经历了一次裁员' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/cy-christin/cy-christin-blog' },
    ],
    search: { provider: 'local' },
    outline: { label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
  },
})
