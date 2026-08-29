# Skill 编写规范

## 目录结构

```
skills/<skill-name>/
├── SKILL.md          # 入口，必需
├── references/       # 按需加载的详细内容
├── prompts/          # 可选：分场景的提示文件
└── examples/         # 可选：示例语料
```

目录名即 skill 名，用小写连字符（kebab-case）。

## frontmatter

```yaml
---
name: <必须等于目录名>
description: <一句话用途 + 触发条件>
license: MIT
---
```

三个字段都是必需的，由 `scripts/validate-skills.mjs` 强制校验。

### description 怎么写

这是整个 skill 最关键的一行 —— Claude 靠它决定要不要加载这个 skill。

- 写清楚**做什么**和**什么时候用**，两者缺一不可。
- 触发条件用具体动词和名词，不要写「用于提升效率」这类空话。
- 好：`中英文写作与改稿的完整方法论……当用户要求写作、改稿、润色、检查文风时使用。`
- 坏：`一个写作辅助工具。`

## 渐进式披露

SKILL.md 是索引，不是全文。

- SKILL.md 控制在 100 行以内。
- 长内容放 `references/`，在 SKILL.md 里用表格说明「什么情况下读哪个文件」。
- 每个 reference 文件开头写一段「使用场景」，让人知道什么时候该打开它。

反例：把 1500 行规则全塞进 SKILL.md。这会让每次加载都吃掉大量上下文，而其中绝大部分用不上。

## 链接

SKILL.md 里的相对链接必须指向真实存在的文件，校验脚本会做断链检查。外链和纯锚点不受检查。

## 本地校验

提交前跑：

```bash
node --test scripts/*.test.mjs
node scripts/validate-skills.mjs
claude plugin validate . --strict
claude plugin validate .claude-plugin/plugin.json --strict
```

前两条是硬性的，也是真正在为 skill 把关：第一条跑校验脚本自身的测试用例，第二条对仓库里每个 skill 的 SKILL.md 做 frontmatter 完整性和断链检查。后两条 `claude plugin validate` 各自只校验一个清单文件——不带路径时只看 `marketplace.json`，给出显式路径时看对应的 `plugin.json`——它们不会读取任何一个 SKILL.md，所以只是清单检查，不能替代前两条对 skill 内容本身的校验。
