# claude-skills

Jogiter 的个人 skill market。通过 Claude Code 一条命令安装全部 skills。

- marketplace 名：`jogiter`
- plugin 名：`jogiter-skills`

## 安装

### 方式一 · 交互式安装（推荐）

在 Claude Code 会话中执行：

```
/plugin marketplace add Jogiter/claude-skills
/plugin install jogiter-skills@jogiter
```

### 方式二 · 命令行非交互安装

适合写进脚本或新机器初始化：

```bash
claude plugin marketplace add Jogiter/claude-skills
claude plugin install jogiter-skills@jogiter --yes
```

默认安装到用户级。只想对当前项目生效时追加 `--scope project`：

```bash
claude plugin install jogiter-skills@jogiter --yes --scope project
```

### 方式三 · 单 skill 按需拷贝

只想要其中某一个 skill，不装整个 plugin：

```bash
git clone https://github.com/Jogiter/claude-skills.git
mkdir -p ~/.claude/skills
cp -r claude-skills/skills/integrated-writing-style ~/.claude/skills/
```

拷贝到项目内的 `.claude/skills/` 则只对该项目生效，同样先 `mkdir -p .claude/skills` 再拷贝。

安装后需重启 Claude Code 会话才能加载。

## Skill 清单

| 名称 | 用途 | 触发时机 |
|---|---|---|
| [integrated-writing-style](skills/integrated-writing-style/SKILL.md) | 中英文写作与改稿方法论，整合 Strunk & White、Pinker、Williams、Thomas & Turner 四家 | 写作、改稿、润色、精简文字、检查文风时 |

## 更新与卸载

```bash
claude plugin marketplace update jogiter   # 拉取市场最新索引
claude plugin update jogiter-skills        # 更新插件，需重启会话生效
claude plugin uninstall jogiter-skills     # 卸载
```

## 贡献

新增 skill 见 [CONTRIBUTING.md](CONTRIBUTING.md)，编写规范见 [docs/skill-authoring.md](docs/skill-authoring.md)。

## License

MIT
