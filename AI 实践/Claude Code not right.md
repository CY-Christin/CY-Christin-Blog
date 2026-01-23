功能：用于防止AI敷衍/谄媚性回答，让AI检测到想要回答「你是对的」的时候再思考一下。

使用方式：

1. 把上面的文件保存为 .sh 文件，并赋权 `chmod +x xxx.sh`

2. 进入Claude code，输入/hooks，选择 UserPromptSubmit，选择 Add a new hook，输入文件所在路径保存

⚠️：原文件有问题，执行会报错，

修复 bug + 检测中文版：

```
#!/bin/bash
set -euo pipefail
trap 'echo "at line $LINENO, exit code $? from $BASH_COMMAND" >&2; exit 1' ERR

# This is a Claude Code hook to stop it saying "you are right".
#
# Installation:
# 1. Save this script and chmod +x it to make it executable.
# 2. Within Claude Code, /hooks / UserPromptSubmit > Add a new hook (this file)
#
# How it works:
# This script checks whether the assistant has recently told the user they are right.
# If so, it appends a system-reminder to the following user prompt,
# reminding the assistant not to do that, and giving it constructive
# examples of how it should respond to the user instead.

stdin=$(cat)
transcript_path=$(echo "$stdin" | jq -r ".transcript_path")

# We'll look through the last 5 items in the transcript.
# Sometimes the final item will be assistant thinking,
# and the previous one will be "you're right".
# We'll look for any triggering phrase like "You're right"
# or "you are absolutely correct".
items=$(grep '"role":"assistant"' "$transcript_path" 2>/dev/null | tail -n 5 || true)
needs_reminder=false
while IFS= read -r item; do
    [[ -z "$item" ]] && continue
    [[ "$(jq -r '.type // empty' <<< "$item")" == "assistant" ]] || continue
    [[ "$(jq -r '.message.content[0].type // empty' <<< "$item")" == "text" ]] || continue
    text=$(jq -r '.message.content[0].text' <<< "$item")
    [[ "${text:0:80}" =~ .*[Yy]ou.*(right|correct) ]] && needs_reminder=true
    [[ "${text:0:80}" =~ .*[Aa]bsolutely ]] && needs_reminder=true
    [[ "${text:0:80}" =~ .*你说得对 ]] && needs_reminder=true  # Chinese
    [[ "${text:0:80}" =~ .*你是对的 ]] && needs_reminder=true  # Chinese
    [[ "${text:0:80}" =~ .*完全正确 ]] && needs_reminder=true  # Chinese
    [[ "${text:0:80}" =~ .*没错 ]] && needs_reminder=true  # Chinese
done <<< "$items"
[[ "$needs_reminder" == "true" ]] || exit 0
"you_are_not_right.sh" 73L, 3081B
```



此版本有问题，且只会检测英语和韩语

```
#!/bin/bash
set -euo pipefail
trap 'echo "at line $LINENO, exit code $? from $BASH_COMMAND" >&2; exit 1' ERR

# This is a Claude Code hook to stop it saying "you are right".
#
# Installation:
# 1. Save this script and chmod +x it to make it executable.
# 2. Within Claude Code, /hooks / UserPromptSubmit > Add a new hook (this file)
#
# How it works:
# This script checks whether the assistant has recently told the user they are right.
# If so, it appends a system-reminder to the following user prompt,
# reminding the assistant not to do that, and giving it constructive
# examples of how it should respond to the user instead.

stdin=$(cat)
transcript_path=$(echo "$stdin" | jq -r ".transcript_path")

# We'll look through the last 5 items in the transcript.
# Sometimes the final item will be assistant thinking,
# and the previous one will be "you're right".
# We'll look for any triggering phrase like "You're right"
# or "you are absolutely correct".
items=$(grep '"role":"assistant"' "$transcript_path" | tail -n 5)
needs_reminder=false
while IFS= read -r item; do
    [[ "$(jq -r '.type // empty' <<< "$item")" == "assistant" ]] || continue
    [[ "$(jq -r '.message.content[0].type // empty' <<< "$item")" == "text" ]] || continue
    text=$(jq -r '.message.content[0].text' <<< "$item")
    [[ "${text:0:80}" =~ .*[Yy]ou.*(right|correct) ]] && needs_reminder=true
    [[ "${text:0:80}" =~ .*[Aa]bsolutely ]] && needs_reminder=true
    [[ "${text:0:80}" =~ .*사용자가.*맞다 ]] && needs_reminder=true  # Korean
    [[ "${text:0:80}" =~ .*맞습니다 ]] && needs_reminder=true  # Korean
done <<< "$items"
[[ "$needs_reminder" == "true" ]] || exit 0

# upon exit code 0, Claude Code will append stdout to the context
# and proceed.
cat <<'EOF'
<system-reminder>
You MUST NEVER use the phrase 'you are right' or similar.

Avoid reflexive agreement. Instead, provide substantive technical analysis.

You must always look for flaws, bugs, loopholes, counter-examples,
invalid assumptions in what the user writes. If you find none,
and find that the user is correct, you must state that dispassionately
and with a concrete specific reason for why you agree, before
continuing with your work.

<example>
user: It's failing on empty inputs, so we should add a null-check.
assistant: That approach seems to avoid the immediate issue.
However it's not idiomatic, and hasn't considered the edge case
of an empty string. A more general approach would be to check
for falsy values.
</example>
<example>
user: I'm concerned that we haven't handled connection failure.
assistant: [thinks hard] I do indeed spot a connection failure
edge case: if the connection attempt on line 42 fails, then
the catch handler on line 49 won't catch it.
[ultrathinks] The most elegant and rigorous solution would be
to move failure handling up to the caller.
</example>
</system-reminder>
EOF

exit 0
```

