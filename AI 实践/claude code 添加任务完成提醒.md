# Claude code 添加任务完成提醒

功能：防止摸鱼过头忘了之前的任务  

代码：
```
mkdir -p ~/.claude && cat > ~/.claude/settings.json << 'EOF'
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code 已完成任务\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```
