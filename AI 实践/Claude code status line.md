🔗：https://github.com/Haleclipse/CCometixLine

功能：在 Claude code 下面多加一行状态展示

安装：

`npm install -g @cometix/ccline`

在 Claude 根目录的配置文件 `setting.json` 中添加

```
{
  "statusLine": {
    "type": "command", 
    "command": "~/.claude/ccline/ccline",
    "padding": 0
  }
}
```



使用：

`cclin` 即可进入配置页面
