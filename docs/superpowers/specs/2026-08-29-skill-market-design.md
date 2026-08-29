# 个人 Skill Market 设计方案

- 日期：2026-08-29
- 仓库：https://github.com/Jogiter/claude-skills
- 状态：已批准，待实现

## 1. 背景与目标

### 现状

仓库当前只有两次提交，结构如下：

```
claude-skills/
├── README.md                       # 仅两行
└── integrated-writing-style/       # 15 个 md 文件，无 SKILL.md
    ├── examples/
    ├── prompts/
    └── references/
```

存在三个问题：

1. **skill 不可用**：`integrated-writing-style` 缺少 `SKILL.md`，Claude Code 不会加载它，目前只是一堆散落的 markdown。
2. **无分发能力**：没有 `.claude-plugin/` 目录，无法通过 `/plugin` 安装。
3. **无扩展约定**：新增 skill 时没有既定结构、校验和发布流程。

### 目标

把仓库整理成个人 skill market：

- 统一管理个人 skills，新增 skill 有固定起手式。
- 通过 Claude Code 一条命令安装，README 给出完整安装指南。
- 有自动校验兜底，避免结构错误被推上去才发现。
- 有明确的版本与发布约定。

### 非目标

- 不做多 plugin 拆包（当前只有一个 skill，YAGNI）。
- 不做 skill 内容本身的重写（`references/`、`prompts/`、`examples/` 原样迁移）。
- 不支持 Codex、Cursor 等其他 agent 的适配格式。

## 2. 关键决策

| 决策项 | 选择 | 理由 |
|---|---|---|
| 打包粒度 | 单 plugin 聚合全部 skills | 用户一条命令装全部；新增 skill 自动同步；维护成本最低 |
| 仓库布局 | 仓库根即 plugin（`source: "./"`） | 无冗余嵌套；将来拆包改动约 10 行 |
| marketplace 名 | `jogiter` | 命名空间语义，将来可在其下挂多个 plugin |
| plugin 名 | `jogiter-skills` | 安装命令为 `jogiter-skills@jogiter`，短且清晰 |
| skills 声明方式 | `plugin.json` 不写 `skills` 字段 | 靠 `skills/` 目录约定自动发现，新增 skill 零配置 |
| 校验器 | 官方 `claude plugin validate --strict` + 补充脚本 | 官方规则兜底，补充脚本只查项目自有约定 |
| 打标签 | 官方 `claude plugin tag` | 自动校验 plugin.json 与 marketplace 条目版本一致 |

### 已验证的技术前提

以下结论来自对本机已安装 marketplace 的实际检查，不是推测：

- **`skills/` 目录自动发现**：官方插件 `claude-code-setup` 的 `plugin.json` 完全没有 `skills` 字段
  （只有 `name`/`description`/`version`/`author`），但其 `skills/claude-automation-recommender/`
  照常被加载。因此本方案省略该字段。
- **`source: "./"` 可用**：`karpathy-skills` marketplace 即以仓库根作为 plugin 源。
- **官方 CLI 具备校验与打标签能力**：`claude plugin validate <path> --strict`
  与 `claude plugin tag [path] --push` 均存在于当前版本。

### 备选方案及淘汰理由

- **B. plugin 放子目录**（`source: "./plugins/jogiter-skills"`）：为将来可能的拆包多付一层嵌套，
  而拆包需求当前不存在。淘汰。
- **C. marketplace 与 skills 分仓**：每个 skill 独立仓库，marketplace 仅作索引。
  对单人维护的个位数 skill 而言成本远超收益。淘汰。

## 3. 目标目录结构

```
claude-skills/
├── .claude-plugin/
│   ├── marketplace.json          # 市场索引：name=jogiter，声明 1 个 plugin
│   └── plugin.json               # 插件清单：name=jogiter-skills，不写 skills 字段
├── skills/
│   └── integrated-writing-style/
│       ├── SKILL.md              # 新增（当前缺失）
│       ├── references/           # 由根目录 git mv 迁入
│       ├── prompts/
│       └── examples/
├── templates/
│   └── skill-template/
│       ├── SKILL.md              # 带占位符的骨架
│       └── references/.gitkeep
├── docs/
│   ├── superpowers/specs/2026-08-29-skill-market-design.md   # 本文档
│   └── skill-authoring.md        # 写 skill 的规范
├── scripts/
│   └── validate-skills.mjs       # 补充校验脚本
├── .github/
│   └── workflows/validate.yml
├── LICENSE                       # plugin.json 声明 MIT，需有对应文件
├── CONTRIBUTING.md
├── CHANGELOG.md
└── README.md
```

## 4. 清单文件

### `.claude-plugin/marketplace.json`

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "jogiter",
  "owner": {
    "name": "Jogiter",
    "email": "jogiter.g@gmail.com"
  },
  "metadata": {
    "description": "Jogiter 的个人 skill market",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "jogiter-skills",
      "source": "./",
      "description": "写作、研究与工程实践类个人 skills 集合",
      "version": "1.0.0",
      "author": { "name": "Jogiter" },
      "keywords": ["writing", "skills", "productivity"],
      "category": "workflow"
    }
  ]
}
```

### `.claude-plugin/plugin.json`

```json
{
  "name": "jogiter-skills",
  "description": "写作、研究与工程实践类个人 skills 集合",
  "version": "1.0.0",
  "author": {
    "name": "Jogiter",
    "url": "https://github.com/Jogiter"
  },
  "homepage": "https://github.com/Jogiter/claude-skills",
  "repository": "https://github.com/Jogiter/claude-skills",
  "license": "MIT",
  "keywords": ["writing", "skills", "productivity"]
}
```

两个文件的 `name` 与 `version` 必须一致，由 CI 强制校验。

## 5. 迁移 integrated-writing-style

### 迁移动作

```bash
mkdir -p skills
git mv integrated-writing-style skills/integrated-writing-style
```

`references/`、`prompts/`、`examples/` 下的 15 个文件内容不改，仅移动位置。

### 新增 SKILL.md

路径：`skills/integrated-writing-style/SKILL.md`

frontmatter 要求：

- `name`：必须等于目录名 `integrated-writing-style`。
- `description`：一句话说明用途，并包含触发条件（"当…时使用"）。这决定 skill 能否被自动召回，
  是整个 skill 最关键的一行。
- `license`：`MIT`。

正文遵循渐进式披露，**不把现有 1500 行内容搬进 SKILL.md**：

- 何时使用 / 何时不用
- 核心写作流程（步骤级，简洁）
- 按需跳转表：说明什么情况下去读 `references/rules.md`、`references/checklist.md`、
  `prompts/blog.md` 等具体文件

目标：SKILL.md 控制在 100 行以内，细节留在子文件按需加载。

## 6. README 安装指南

README 需包含以下四部分。

### 6.1 三种安装方式

**方式一 · 交互式安装（推荐）**

在 Claude Code 会话中执行：

```
/plugin marketplace add Jogiter/claude-skills
/plugin install jogiter-skills@jogiter
```

**方式二 · 命令行非交互安装**

适合写进脚本或新机器初始化：

```bash
claude plugin marketplace add Jogiter/claude-skills
claude plugin install jogiter-skills@jogiter --yes
```

安装到项目级而非用户级时追加 `--scope project`。

**方式三 · 单 skill 按需拷贝**

只想要其中某一个 skill 时：

```bash
git clone https://github.com/Jogiter/claude-skills.git
cp -r claude-skills/skills/integrated-writing-style ~/.claude/skills/
```

拷贝到项目内的 `.claude/skills/` 则只对该项目生效。

### 6.2 Skill 清单

表格三列：名称 / 用途 / 触发时机。每新增一个 skill 补一行。

### 6.3 更新与卸载

```bash
claude plugin marketplace update jogiter   # 拉取市场最新索引
claude plugin update jogiter-skills        # 更新插件，需重启会话生效
claude plugin uninstall jogiter-skills     # 卸载
```

### 6.4 贡献

指向 `CONTRIBUTING.md` 与 `docs/skill-authoring.md`。

## 7. CI 校验

### 触发条件

`.github/workflows/validate.yml`，在 push 到 main 与所有 PR 上运行。

### 校验内容

第一层，官方校验器：

```bash
claude plugin validate . --strict
```

`--strict` 会把未识别字段、缺失元数据等运行时容忍的问题升级为错误。

第二层，`scripts/validate-skills.mjs`（约 40 行 Node 脚本，零依赖），检查官方不覆盖的项目约定：

1. 每个 `skills/*/` 下必须存在 `SKILL.md`。
2. `SKILL.md` frontmatter 的 `name` 与所在目录名一致。
3. frontmatter 必须有非空 `description`。
4. `marketplace.json` 中 plugin 条目的 `name`、`version` 与 `plugin.json` 一致。
5. `SKILL.md` 内的相对链接指向的文件真实存在（断链检查）。

脚本以非零退出码表示失败，并打印具体的文件与行号。

### 关于 CI 中的 claude CLI

官方校验器需要 CI 环境中有 `claude` 可执行文件。若安装成本过高或不稳定，
第一层降级为仅运行第二层脚本，并在 `CONTRIBUTING.md` 中要求本地提交前手动跑一次
`claude plugin validate . --strict`。实现时先尝试第一层，失败则降级。

## 8. 版本与发布约定

### semver 规则

| 变更类型 | 版本位 |
|---|---|
| 新增 skill | minor |
| 修改已有 skill 内容、修文档 | patch |
| 删除或重命名 skill、改变 plugin/marketplace 名 | major |

### 发布流程

1. 同步修改 `plugin.json` 与 `marketplace.json` 的 `version`。
2. 在 `CHANGELOG.md` 顶部追加本次条目（遵循 Keep a Changelog 格式）。
3. 提交后打标签并推送：

```bash
claude plugin tag --push -m "release v%s"
```

该命令会创建 `jogiter-skills--v<version>` 标签，并在创建前校验 `plugin.json`
与 marketplace 条目的版本一致，不一致则拒绝打标签。

## 9. 新增 skill 的流程

写入 `CONTRIBUTING.md`，五步：

1. `cp -r templates/skill-template skills/<new-skill-name>`
2. 填写 `SKILL.md` 的 frontmatter，`name` 必须等于目录名。
3. 写正文，遵循渐进式披露；长内容放 `references/` 按需加载。
4. 本地跑校验：`node scripts/validate-skills.mjs` 与 `claude plugin validate . --strict`。
5. 按第 8 节 bump minor 版本，更新 README 的 skill 清单表，提交发布。

无需改动任何 JSON 文件 —— `skills/` 目录自动发现。

## 10. 实现顺序

1. 建 `.claude-plugin/`，写 `marketplace.json` 与 `plugin.json`。
2. `git mv` 迁移 `integrated-writing-style` 到 `skills/` 下。
3. 为其编写 `SKILL.md`。
4. 建 `templates/skill-template/`。
5. 写 `scripts/validate-skills.mjs` 与 `.github/workflows/validate.yml`。
6. 重写 `README.md`，补 `CONTRIBUTING.md`、`CHANGELOG.md`、`LICENSE`、`docs/skill-authoring.md`。
7. 本地验证：跑校验器；用 `claude plugin marketplace add <本地路径>` 实测安装链路。
8. 打 v1.0.0 标签发布。

## 11. 验收标准

- `claude plugin validate . --strict` 通过。
- `node scripts/validate-skills.mjs` 通过。
- 从本地路径添加 marketplace 后，`claude plugin install jogiter-skills@jogiter` 成功，
  且新会话中 `integrated-writing-style` 出现在可用 skills 列表里。
- README 中的三种安装方式命令均可原样复制执行。
- 仓库根目录不再有散落的 skill 内容文件。
