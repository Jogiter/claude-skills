# 个人 Skill Market 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `claude-skills` 仓库重构为可通过 Claude Code 一条命令安装的个人 skill market。

**Architecture:** 仓库根即 plugin（marketplace.json 中 `source: "./"`）。`.claude-plugin/` 放两个清单文件，所有 skill 放 `skills/<name>/`，由 Claude Code 约定自动发现，plugin.json 不写 `skills` 字段。一个零依赖 Node 脚本 + GitHub Actions 守住项目自有约定，官方 `claude plugin validate --strict` 守住格式规范。

**Tech Stack:** JSON 清单、Markdown、Node.js 22（ESM + 内置 `node:test`，零第三方依赖）、GitHub Actions、`claude plugin` CLI。

**Spec:** `docs/superpowers/specs/2026-08-29-skill-market-design.md`

## Global Constraints

- marketplace 名固定为 `jogiter`；plugin 名固定为 `jogiter-skills`；安装命令为 `jogiter-skills@jogiter`。
- GitHub 仓库名保持 `claude-skills` 不变，remote 为 `git@github.com:Jogiter/claude-skills.git`。
- `.claude-plugin/plugin.json` 与 `.claude-plugin/marketplace.json` 中对应条目的 `name` 与 `version` 必须完全一致。
- 初始版本号为 `1.0.0`，两个 JSON 文件同步。
- `plugin.json` 不得包含 `skills` 字段 —— 依赖 `skills/` 目录自动发现。
- 作者信息：`Jogiter`，邮箱 `jogiter.g@gmail.com`，主页 `https://github.com/Jogiter`。
- License 为 MIT，仓库根必须有对应的 `LICENSE` 实体文件。
- 脚本零第三方依赖，仅用 Node 内置模块；不引入 `package.json` 之外的构建步骤。
- `integrated-writing-style` 现有 15 个内容文件**只移动不修改**，一个字都不改。
- 所有面向用户的文档用中文书写。
- 每个任务结束时提交，提交信息用中文，遵循 Conventional Commits 前缀（`feat:`/`docs:`/`chore:`）。

---

### Task 1: Plugin 清单与许可证

建立 plugin 的身份文件。完成后 `claude plugin validate` 能识别出这是一个合法 plugin 与 marketplace。

**Files:**
- Create: `.claude-plugin/marketplace.json`
- Create: `.claude-plugin/plugin.json`
- Create: `LICENSE`

**Interfaces:**
- Consumes: 无（首个任务）
- Produces: plugin 名 `jogiter-skills`、marketplace 名 `jogiter`、version `1.0.0`。后续任务的校验脚本读取这两个 JSON；README 的安装命令引用这两个名字。

- [ ] **Step 1: 先跑校验器，确认当前是失败状态**

```bash
claude plugin validate . --strict
```

Expected: 失败或报告找不到 plugin/marketplace 清单。把输出记下来作为对照。

- [ ] **Step 2: 创建 marketplace.json**

```bash
mkdir -p .claude-plugin
cat > .claude-plugin/marketplace.json <<'EOF'
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
EOF
```

- [ ] **Step 3: 创建 plugin.json**

注意：**不要**加 `skills` 字段。Claude Code 会自动扫描 `skills/` 目录，加了反而在新增 skill 时需要同步维护。

```bash
cat > .claude-plugin/plugin.json <<'EOF'
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
EOF
```

- [ ] **Step 4: 创建 LICENSE**

`plugin.json` 声明了 `"license": "MIT"`，仓库必须有对应实体文件，否则声明是空头支票。

```bash
cat > LICENSE <<'EOF'
MIT License

Copyright (c) 2026 Jogiter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

- [ ] **Step 5: 再跑校验器，确认清单本身合法**

```bash
claude plugin validate . --strict
```

Expected: 关于 plugin.json / marketplace.json 格式的报错全部消失。此时可能仍会因为 `skills/` 目录不存在而有告警 —— 那是 Task 2 要解决的，不要在本任务里处理。若报错内容涉及 JSON 语法或字段非法，修到干净为止。

- [ ] **Step 6: 提交**

```bash
git add .claude-plugin/marketplace.json .claude-plugin/plugin.json LICENSE
git commit -m "feat: 添加 plugin 与 marketplace 清单及 MIT 许可证"
```

---

### Task 2: 迁移 integrated-writing-style 并补齐 SKILL.md

把散落在仓库根的写作 skill 移进 `skills/`，并补上让 Claude Code 能加载它的 `SKILL.md`。这是整个重构里唯一影响 skill 可用性的任务。

**Files:**
- Move: `integrated-writing-style/` → `skills/integrated-writing-style/`（15 个 md 文件，内容不改）
- Create: `skills/integrated-writing-style/SKILL.md`

**Interfaces:**
- Consumes: Task 1 的 `.claude-plugin/plugin.json`（决定了 skill 归属哪个 plugin）
- Produces: 目录 `skills/integrated-writing-style/`，其 `SKILL.md` frontmatter 的 `name` 值为 `integrated-writing-style`。Task 3 的校验脚本会断言这个目录存在且 name 与目录名一致；Task 5 的 README skill 清单表会引用它。

- [ ] **Step 1: 用 git mv 迁移，保留文件历史**

```bash
mkdir -p skills
git mv integrated-writing-style skills/integrated-writing-style
```

- [ ] **Step 2: 确认迁移完整且内容未变**

```bash
git status --short
find skills -type f -name '*.md' | sort
```

Expected: `git status` 全部显示为 `R`（rename），没有任何 `M`（modified）。`find` 输出 15 个文件，分布在 `examples/`(3)、`prompts/`(5)、`references/`(8)。仓库根目录不再有 `integrated-writing-style/`。

- [ ] **Step 3: 写 SKILL.md**

设计要点：走渐进式披露。1563 行内容留在子文件里按需加载，SKILL.md 只负责「什么时候用」和「该去读哪个文件」。`description` 是最关键的一行 —— 它决定 skill 能否被自动召回，必须包含触发条件。

```bash
cat > skills/integrated-writing-style/SKILL.md <<'EOF'
---
name: integrated-writing-style
description: 中英文写作与改稿的完整方法论，整合 Strunk & White、Pinker、Williams、Thomas & Turner 四家。当用户要求写作、改稿、润色、精简文字、检查文风，或问「这段话怎么写更清楚」时使用。覆盖学术论文、博客、商务报告、邮件、科普五类文体。
license: MIT
---

# 整合写作风格

一套可执行的写作与改稿方法。核心主张：**写作是把你看见的东西指给读者看**，不是证明自己聪明。

## 何时使用

- 写新文本：论文、博客、报告、邮件、科普。
- 改已有文本：润色、精简、提升清晰度与连贯性。
- 诊断问题文本：读着别扭，但说不清哪里有问题。

## 何时不用

- 纯代码、纯数据、纯配置文件。
- 用户明确要求保留原文风格，如引用原文、法律条文。
- 诗歌、歌词等以形式本身为目的的文本。

## 核心流程

改稿走五阶段，按顺序执行，不要跳步：

| 阶段 | 目标 |
|---|---|
| 0 姿态 | 确认是在「展示」，而非自辩、卖弄、堆术语 |
| 1 清晰 | 角色作主语，动作作动词 |
| 2 连贯 | 旧信息在前，新信息在后；主题串一致 |
| 3 简洁 | 删冗余、空词、僵尸名词 |
| 4 优雅 | 平衡、节奏、强调位 |

五阶段的完整诊断问题与修订动作见 [references/diagnostics.md](references/diagnostics.md)。

写新文本时，先读对应文体的提示文件（见下），再按五阶段自查。

## 按需跳转

| 情况 | 读这个 |
|---|---|
| 不知从哪下手改 | [references/diagnostics.md](references/diagnostics.md) |
| 要查具体规则和中英示例 | [references/rules.md](references/rules.md) |
| 交付前最后检查 | [references/checklist.md](references/checklist.md) |
| 两条规则打架，不知听谁的 | [references/conflicts.md](references/conflicts.md) |
| 想知道规则背后的认知原理 | [references/principles.md](references/principles.md) |
| 拿不准用词，或怀疑某条「写作规则」是伪规则 | [references/usage.md](references/usage.md) |
| 遇到不懂的术语 | [references/glossary.md](references/glossary.md) |
| 需要英文改写对照 | [examples/before-after-en.md](examples/before-after-en.md) |
| 需要中文改写对照 | [examples/before-after-zh.md](examples/before-after-zh.md) |
| 想看整篇文章的完整诊断过程 | [examples/full-text-demos.md](examples/full-text-demos.md) |

## 文体提示

按目标文体加载对应文件，它给出该文体的姿态、结构与禁忌：

| 文体 | 文件 |
|---|---|
| 学术论文、研究报告、学位论文 | [prompts/academic.md](prompts/academic.md) |
| 博客、公众号、评论、随笔 | [prompts/blog.md](prompts/blog.md) |
| 商务报告、提案、备忘录 | [prompts/business.md](prompts/business.md) |
| 工作邮件、通知、公文 | [prompts/email.md](prompts/email.md) |
| 科学论文、科普、技术文档 | [prompts/science.md](prompts/science.md) |

## 30 秒自查

来不及细读时，至少过一遍：

- 主要角色是否作主语？主要动作是否是动词？
- 每句开头是读者已知的信息吗？句尾是重要的新信息吗？
- 有没有僵尸名词（「做出确认」「进行分析」）？
- 长句是否从短到长组织？
- 是在帮助读者，还是在操纵读者？

完整清单见 [references/checklist.md](references/checklist.md)。
EOF
```

- [ ] **Step 4: 人工验证 SKILL.md 里的每个链接都指向真实文件**

```bash
cd skills/integrated-writing-style && \
  grep -o '](\([^)]*\))' SKILL.md | sed 's/](\(.*\))/\1/' | while read -r f; do
    [ -f "$f" ] && echo "OK   $f" || echo "FAIL $f"
  done; cd -
```

Expected: 每一行都是 `OK`，一个 `FAIL` 都没有。（Task 3 会把这项检查自动化，这里先手工确认一次。）

- [ ] **Step 5: 提交**

```bash
git add -A skills
git commit -m "feat: 迁移 integrated-writing-style 到 skills/ 并补齐 SKILL.md"
```

---

### Task 3: 校验脚本与 CI

自动守住官方校验器不管的项目约定。脚本先写测试再写实现，测试用临时 fixture 目录构造缺陷仓库。

**Files:**
- Create: `scripts/validate-skills.mjs`
- Test: `scripts/validate-skills.test.mjs`
- Create: `.github/workflows/validate.yml`

**Interfaces:**
- Consumes: Task 1 的 `.claude-plugin/*.json`、Task 2 的 `skills/integrated-writing-style/SKILL.md`
- Produces:
  - `export function validateRepo(root: string): { errors: string[] }` —— 传入仓库根的绝对路径，返回错误消息数组；数组为空表示通过。不抛异常、不打印、不退出，副作用全在 CLI 入口里。
  - CLI 用法 `node scripts/validate-skills.mjs [root]`，`root` 省略时取脚本所在目录的父目录。通过打印 `✓ skills 校验通过` 并退出 0，失败逐条打印并退出 1。
  - Task 4 的 `CONTRIBUTING.md`、Task 6 的验收都调用这个 CLI。

**校验的 5 项约定：**

1. 每个 `skills/*/` 下存在 `SKILL.md`
2. `SKILL.md` frontmatter 的 `name` 等于所在目录名
3. frontmatter 有非空 `description`
4. `marketplace.json` 中对应条目的 `name`、`version` 与 `plugin.json` 一致
5. `SKILL.md` 里的相对链接目标真实存在

- [ ] **Step 1: 写失败的测试**

创建 `scripts/validate-skills.test.mjs`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRepo } from './validate-skills.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 造一个最小可用的 fixture 仓库；参数用来注入单点缺陷。
 * skipSkillMd 为 true 时只建目录不写 SKILL.md。
 */
function makeFixture({
  skillName = 'demo',
  frontmatterName = 'demo',
  description = '演示用 skill，当需要演示时使用。',
  body = '# Demo\n\n正文。\n',
  skipSkillMd = false,
  pluginVersion = '1.0.0',
  marketVersion = '1.0.0',
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'skills-fixture-'));
  mkdirSync(join(root, 'skills', skillName), { recursive: true });
  if (!skipSkillMd) {
    const fm = `---\nname: ${frontmatterName}\ndescription: ${description}\nlicense: MIT\n---\n\n`;
    writeFileSync(join(root, 'skills', skillName, 'SKILL.md'), fm + body);
  }
  mkdirSync(join(root, '.claude-plugin'), { recursive: true });
  writeFileSync(
    join(root, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'jogiter-skills', version: pluginVersion }),
  );
  writeFileSync(
    join(root, '.claude-plugin', 'marketplace.json'),
    JSON.stringify({
      name: 'jogiter',
      plugins: [{ name: 'jogiter-skills', source: './', version: marketVersion }],
    }),
  );
  return root;
}

/** 注册临时目录在测试结束后清理 */
function fixture(t, options) {
  const root = makeFixture(options);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('结构完整的仓库没有错误', (t) => {
  const { errors } = validateRepo(fixture(t));
  assert.deepEqual(errors, []);
});

test('缺少 SKILL.md 时报错', (t) => {
  const { errors } = validateRepo(fixture(t, { skipSkillMd: true }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /skills\/demo\/SKILL\.md.*缺失/);
});

test('frontmatter name 与目录名不一致时报错', (t) => {
  const { errors } = validateRepo(fixture(t, { frontmatterName: 'wrong-name' }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /wrong-name.*demo/);
});

test('description 为空时报错', (t) => {
  const { errors } = validateRepo(fixture(t, { description: '' }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /description/);
});

test('plugin.json 与 marketplace.json 版本不一致时报错', (t) => {
  const { errors } = validateRepo(fixture(t, { marketVersion: '2.0.0' }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /1\.0\.0.*2\.0\.0/);
});

test('SKILL.md 中的相对链接断链时报错', (t) => {
  const body = '见 [规则](references/rules.md)。\n';
  const { errors } = validateRepo(fixture(t, { body }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /references\/rules\.md/);
});

test('外部链接与纯锚点不参与断链检查', (t) => {
  const body = '见 [官网](https://example.com) 和 [下文](#core)。\n';
  const { errors } = validateRepo(fixture(t, { body }));
  assert.deepEqual(errors, []);
});

test('真实仓库通过校验', () => {
  const { errors } = validateRepo(repoRoot);
  assert.deepEqual(errors, []);
});
```

- [ ] **Step 2: 跑测试，确认它失败**

```bash
node --test scripts/
```

Expected: FAIL，报错类似 `Cannot find module '.../scripts/validate-skills.mjs'`。

- [ ] **Step 3: 写实现**

创建 `scripts/validate-skills.mjs`：

```js
#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** 解析 SKILL.md 顶部的 frontmatter。只支持单层 `key: value`，够用即可。 */
function parseFrontmatter(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---/);
  if (!block) return null;
  const fields = {};
  for (const line of block[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

/** 取出 markdown 中的相对链接目标，跳过外链（含协议）与纯锚点。 */
function relativeLinks(text) {
  const targets = [];
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    targets.push(target);
  }
  return targets;
}

/** 校验一个 skill market 仓库，返回 { errors }；errors 为空表示通过。 */
export function validateRepo(root) {
  const errors = [];
  const skillsDir = join(root, 'skills');

  if (!existsSync(skillsDir)) {
    errors.push('skills/: 目录不存在');
  } else {
    const names = readdirSync(skillsDir).filter((n) =>
      statSync(join(skillsDir, n)).isDirectory(),
    );
    if (names.length === 0) errors.push('skills/: 没有任何 skill 目录');

    for (const name of names) {
      const skillMd = join(skillsDir, name, 'SKILL.md');
      if (!existsSync(skillMd)) {
        errors.push(`skills/${name}/SKILL.md: 文件缺失`);
        continue;
      }
      const text = readFileSync(skillMd, 'utf8');
      const fm = parseFrontmatter(text);
      if (!fm) {
        errors.push(`skills/${name}/SKILL.md: 缺少 frontmatter`);
        continue;
      }
      if (fm.name !== name) {
        errors.push(
          `skills/${name}/SKILL.md: frontmatter name "${fm.name ?? ''}" 与目录名 "${name}" 不一致`,
        );
      }
      if (!fm.description) {
        errors.push(`skills/${name}/SKILL.md: frontmatter 缺少非空 description`);
      }
      for (const link of relativeLinks(text)) {
        if (!existsSync(resolve(dirname(skillMd), link))) {
          errors.push(`skills/${name}/SKILL.md: 链接目标不存在 -> ${link}`);
        }
      }
    }
  }

  const pluginPath = join(root, '.claude-plugin', 'plugin.json');
  const marketPath = join(root, '.claude-plugin', 'marketplace.json');
  if (!existsSync(pluginPath)) errors.push('.claude-plugin/plugin.json: 文件缺失');
  if (!existsSync(marketPath)) errors.push('.claude-plugin/marketplace.json: 文件缺失');

  if (existsSync(pluginPath) && existsSync(marketPath)) {
    const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'));
    const market = JSON.parse(readFileSync(marketPath, 'utf8'));
    const entry = (market.plugins ?? []).find((p) => p.name === plugin.name);
    if (!entry) {
      errors.push(`marketplace.json: 找不到 name 为 "${plugin.name}" 的 plugin 条目`);
    } else if (entry.version !== plugin.version) {
      errors.push(
        `版本不一致: plugin.json=${plugin.version}, marketplace.json=${entry.version}`,
      );
    }
  }

  return { errors };
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const root =
    process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { errors } = validateRepo(root);
  if (errors.length > 0) {
    console.error('校验失败：');
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log('✓ skills 校验通过');
}
```

- [ ] **Step 4: 跑测试，确认全绿**

```bash
node --test scripts/
```

Expected: PASS，8 个测试全通过。若「真实仓库通过校验」这条失败，说明 Task 1 或 Task 2 有遗漏 —— 按报错修真实文件，不要改测试。

- [ ] **Step 5: 跑 CLI 入口，确认输出与退出码正确**

```bash
node scripts/validate-skills.mjs && echo "exit=$?"
```

Expected: 打印 `✓ skills 校验通过`，然后 `exit=0`。

- [ ] **Step 6: 写 GitHub Actions workflow**

设计取舍：官方校验器需要 CI 里有 `claude` 可执行文件，安装依赖外部脚本，不够稳。因此把它放进独立 step 并标 `continue-on-error: true` —— 结果在日志里可见，但安装失败不会卡住 CI。项目自有约定的校验（本任务的脚本）是硬性的。

```bash
mkdir -p .github/workflows
cat > .github/workflows/validate.yml <<'EOF'
name: validate

on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: 单元测试
        run: node --test scripts/

      - name: 项目约定校验
        run: node scripts/validate-skills.mjs

      # 官方校验器需要 claude CLI，安装依赖外部脚本；失败不阻塞 CI，结果看日志。
      - name: 官方校验器（尽力而为）
        continue-on-error: true
        run: |
          curl -fsSL https://claude.ai/install.sh | bash
          "$HOME/.local/bin/claude" plugin validate . --strict
EOF
```

- [ ] **Step 7: 提交**

```bash
git add scripts/validate-skills.mjs scripts/validate-skills.test.mjs .github/workflows/validate.yml
git commit -m "feat: 添加 skills 校验脚本与 GitHub Actions 校验流水线"
```

---

### Task 4: Skill 模板与创作文档

给新增 skill 一个固定起手式，并把「怎么写好一个 skill」和「怎么提交」写清楚。

**Files:**
- Create: `templates/skill-template/SKILL.md`
- Create: `templates/skill-template/references/.gitkeep`
- Create: `docs/skill-authoring.md`
- Create: `CONTRIBUTING.md`

**Interfaces:**
- Consumes: Task 3 的 `node scripts/validate-skills.mjs`（CONTRIBUTING 的校验步骤引用它）
- Produces: 模板路径 `templates/skill-template/`，供 `cp -r templates/skill-template skills/<new-name>` 使用。Task 5 的 README 会链接到 `CONTRIBUTING.md` 与 `docs/skill-authoring.md`。

**注意：** `templates/` 不在 `skills/` 下，校验脚本不会扫描它。因此模板里的跳转表用反引号包路径而非 markdown 链接 —— 这样从模板复制出来的新 skill 不会一上来就断链。

- [ ] **Step 1: 建模板骨架**

```bash
mkdir -p templates/skill-template/references
touch templates/skill-template/references/.gitkeep
cat > templates/skill-template/SKILL.md <<'EOF'
---
name: skill-template
description: 一句话说明这个 skill 做什么，以及什么时候用它。必须包含触发条件，例如「当用户要求 X 或提到 Y 时使用」。这一行决定 skill 能否被自动召回，是整个 skill 最关键的一行。
license: MIT
---

# Skill 名称

一两句话说明这个 skill 解决什么问题，核心主张是什么。

## 何时使用

- 场景一
- 场景二

## 何时不用

- 反例一（划清边界，避免误触发）

## 核心流程

1. 第一步
2. 第二步
3. 第三步

## 按需跳转

长内容放 `references/` 下按需加载，不要塞进本文件。把下面的路径改成真实文件后，用 markdown 链接写法。

| 情况 | 读这个 |
|---|---|
| 需要详细规则 | `references/rules.md` |
| 交付前检查 | `references/checklist.md` |
EOF
```

- [ ] **Step 2: 写 skill 创作规范**

````bash
cat > docs/skill-authoring.md <<'EOF'
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
node --test scripts/
node scripts/validate-skills.mjs
claude plugin validate . --strict
```

前两条是硬性的；第三条需要本机装了 `claude` CLI，CI 里是尽力而为，所以本地这一步更重要。
EOF
````

- [ ] **Step 3: 写贡献指南**

````bash
cat > CONTRIBUTING.md <<'EOF'
# 贡献指南

## 新增一个 skill

1. 从模板复制：

   ```bash
   cp -r templates/skill-template skills/<new-skill-name>
   ```

2. 填写 `SKILL.md` 的 frontmatter。`name` 必须等于目录名。

3. 写正文，遵循渐进式披露 —— 详见 [docs/skill-authoring.md](docs/skill-authoring.md)。长内容放 `references/` 按需加载。

4. 本地校验：

   ```bash
   node --test scripts/
   node scripts/validate-skills.mjs
   claude plugin validate . --strict
   ```

5. 按下面的版本约定 bump 版本，更新 README 的 skill 清单表，提交并发布。

**不需要改任何 JSON 文件** —— `skills/` 目录由 Claude Code 自动发现。

## 版本约定

遵循 semver。`.claude-plugin/plugin.json` 与 `.claude-plugin/marketplace.json` 的 `version` 必须同步修改，不一致会被校验脚本拦下。

| 变更类型 | 版本位 |
|---|---|
| 新增 skill | minor |
| 修改已有 skill 内容、修文档 | patch |
| 删除或重命名 skill、改变 plugin/marketplace 名 | major |

## 发布流程

1. 同步修改两个 JSON 的 `version`。
2. 在 `CHANGELOG.md` 顶部追加本次条目。
3. 提交后打标签并推送：

   ```bash
   claude plugin tag --push -m "release v%s"
   ```

   该命令会创建 `jogiter-skills--v<version>` 标签，并在创建前校验 `plugin.json` 与 marketplace 条目版本一致 —— 不一致直接拒绝打标签。加 `--dry-run` 可以先看它打算做什么。

## 提交信息

用中文，遵循 Conventional Commits 前缀：`feat:` 新增 skill 或能力，`fix:` 修错，`docs:` 改文档，`chore:` 杂务。
EOF
````

- [ ] **Step 4: 确认模板不会污染校验**

```bash
node scripts/validate-skills.mjs && echo "exit=$?"
```

Expected: `✓ skills 校验通过`，`exit=0`。模板在 `templates/` 下，不应被扫描到。若脚本报了 `skill-template` 相关的错，说明扫描范围写错了 —— 回到 Task 3 修脚本。

- [ ] **Step 5: 实测模板可用**

```bash
cp -r templates/skill-template /tmp/probe-skill && \
  head -5 /tmp/probe-skill/SKILL.md && rm -rf /tmp/probe-skill
```

Expected: 打印出完整的 frontmatter 三个字段。确认复制出来的目录结构完好。

- [ ] **Step 6: 提交**

```bash
git add templates CONTRIBUTING.md docs/skill-authoring.md
git commit -m "docs: 添加 skill 模板、创作规范与贡献指南"
```

---

### Task 5: README 与 CHANGELOG

README 是这个 market 的门面，核心是让人复制粘贴就能装上。

**Files:**
- Modify: `README.md`（当前只有两行，整体重写）
- Create: `CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1 的 plugin/marketplace 名、Task 2 的 skill 名、Task 4 的 `CONTRIBUTING.md` 与 `docs/skill-authoring.md`
- Produces: 面向用户的安装入口。Task 6 会逐条实测 README 里的命令。

- [ ] **Step 1: 重写 README**

````bash
cat > README.md <<'EOF'
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
cp -r claude-skills/skills/integrated-writing-style ~/.claude/skills/
```

拷贝到项目内的 `.claude/skills/` 则只对该项目生效。

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
EOF
````

- [ ] **Step 2: 写 CHANGELOG**

```bash
cat > CHANGELOG.md <<'EOF'
# 更新日志

本文件记录本项目的所有重要变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-08-29

### 新增

- 建立 skill market 结构：`.claude-plugin/marketplace.json` 与 `plugin.json`，支持通过 `jogiter-skills@jogiter` 安装。
- `integrated-writing-style` skill：中英文写作与改稿方法论，补齐 `SKILL.md` 使其可被 Claude Code 加载。
- `scripts/validate-skills.mjs` 校验脚本与 GitHub Actions 校验流水线。
- `templates/skill-template/` 新 skill 模板，`CONTRIBUTING.md` 与 `docs/skill-authoring.md`。

### 变更

- `integrated-writing-style/` 由仓库根迁移至 `skills/integrated-writing-style/`，内容未改动。
- 重写 `README.md`，补充三种安装方式与 skill 清单。
EOF
```

- [ ] **Step 3: 检查 README 里的相对链接不断链**

```bash
grep -oh '](\([^)]*\))' README.md CONTRIBUTING.md \
  | sed 's/](\(.*\))/\1/' | grep -v '^http' | sort -u | while read -r f; do
    [ -e "$f" ] && echo "OK   $f" || echo "FAIL $f"
  done
```

Expected: 全部 `OK`。涉及 `skills/integrated-writing-style/SKILL.md`、`CONTRIBUTING.md`、`docs/skill-authoring.md`。

- [ ] **Step 4: 提交**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: 重写 README 补充安装指南，添加 CHANGELOG"
```

---

### Task 6: 端到端安装验证与 v1.0.0 发布

前五个任务各自验证了自己的产物。这个任务验证它们组合起来真的能装上，然后发布。

**Files:**
- 不改代码；仅验证与打标签
- Modify（仅在验证暴露问题时）：前序任务产出的对应文件

**Interfaces:**
- Consumes: 全部前序产物
- Produces: git tag `jogiter-skills--v1.0.0`，推送到 `origin`

- [ ] **Step 1: 跑全部校验**

```bash
node --test scripts/
node scripts/validate-skills.mjs
claude plugin validate . --strict
```

Expected: 三条全部通过，退出码均为 0。任何一条失败都回到对应任务修复，不要跳过。

- [ ] **Step 2: 确认工作区干净、结构符合预期**

```bash
git status --short
find . -path ./.git -prune -o -type f -print | sort
```

Expected: `git status` 无输出。文件清单里仓库根**没有**散落的 skill 内容文件 —— `integrated-writing-style/` 不应再出现在根目录。

- [ ] **Step 3: 从本地路径添加 marketplace，实测安装链路**

```bash
claude plugin marketplace add "$(pwd)"
claude plugin install jogiter-skills@jogiter --yes
```

Expected: marketplace 添加成功并显示名字 `jogiter`；install 报告安装成功。

若 install 报找不到 `jogiter-skills@jogiter`，检查 `marketplace.json` 里 `source: "./"` 是否写对。

- [ ] **Step 4: 确认插件与 skill 真的落地了**

```bash
claude plugin list
find ~/.claude/plugins -type d -name 'integrated-writing-style' 2>/dev/null
```

Expected: `plugin list` 里出现 `jogiter-skills`；`find` 至少输出一个路径，且该目录下有 `SKILL.md`。

- [ ] **Step 5: 在新会话中确认 skill 可被发现**

```bash
claude -p "你现在可用的 skills 里，有没有名字包含 writing 的？只回答名字。"
```

Expected: 回答中出现 `integrated-writing-style`。这是验收标准里「新会话中出现在可用 skills 列表里」的直接验证。若没出现，检查 `SKILL.md` 的 frontmatter 是否被正确解析（`name` 拼写、`---` 分隔符位置）。

- [ ] **Step 6: 清理本地测试安装**

本地 marketplace 名为 `jogiter`，与将来从 GitHub 添加的同名，留着会冲突。

```bash
claude plugin uninstall jogiter-skills
claude plugin marketplace remove jogiter
claude plugin list
```

Expected: `plugin list` 里不再有 `jogiter-skills`。

- [ ] **Step 7: 逐条核对 README 命令**

对着 `README.md` 通读三种安装方式，确认：

- 方式一的两条斜杠命令拼写与 `marketplace.json` 的 `name`、`plugin.json` 的 `name` 一致。
- 方式二的 `claude plugin marketplace add Jogiter/claude-skills` 中仓库路径与 `git remote -v` 一致。
- 方式三的 `cp -r` 源路径 `claude-skills/skills/integrated-writing-style` 真实存在。

发现不一致就改 README 并单独提交。

- [ ] **Step 8: 推送分支（需先确认）**

推送前向用户确认。确认后：

```bash
git push origin main
```

- [ ] **Step 9: 打标签发布（需先确认）**

先看它打算做什么：

```bash
claude plugin tag --dry-run
```

Expected: 打印将创建 `jogiter-skills--v1.0.0`。若报版本不一致，说明两个 JSON 的 `version` 没同步 —— 修好再来。

确认无误且用户同意后：

```bash
claude plugin tag --push -m "release v%s"
```

- [ ] **Step 10: 验证发布结果**

```bash
git tag -l 'jogiter-skills--*'
git ls-remote --tags origin | grep jogiter-skills
```

Expected: 本地与远程都有 `jogiter-skills--v1.0.0`。

- [ ] **Step 11: 从 GitHub 实测一次真实安装路径**

这是用户会走的路径，与 Step 3 的本地路径不同，必须单独验一次。

```bash
claude plugin marketplace add Jogiter/claude-skills
claude plugin install jogiter-skills@jogiter --yes
claude plugin list
```

Expected: 安装成功，`jogiter-skills` 出现在列表里。这次**保留**安装 —— 这就是用户想要的最终状态。
