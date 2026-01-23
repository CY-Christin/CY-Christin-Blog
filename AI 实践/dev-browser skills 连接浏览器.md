# dev-browser skills 连接浏览器

🔗：https://github.com/SawyerHood/dev-browser

作用：

1. 真实浏览器环境
   - 连接你已登录的 Chrome，无需重新登录
   - 对于测试需要认证的应用（如你的 Rela 游戏页面）非常有价值
   - 保留了所有 Cookie、会话和扩展状态 

2. 持久化会话
   - 页面状态保持，不会每次重启
   - 适合多步骤的自动化任务

安装方式：

1. claude code 添加 skills
2. 下载浏览器插件，解压安装到 chrome
3. claude code 启动服务
4. 浏览器启动插件
5. 让 AI 连接浏览器，可能需要重启浏览器插件

实用性：

可以让 AI 直接读取需要登录的页面内容，但是 AI 默认使用截图的方式读取页面，这种方式慢而且浪费 token，需要 AI 识图；可以要求 AI 使用 ARIA Snapshot，但是这种方式似乎是读取页面结构，页面较长时读取性能存疑。但是可以指定类名让 AI 直接搜索指定的内容，实用性代使用后确认。