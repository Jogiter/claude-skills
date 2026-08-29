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
   node --test scripts/*.test.mjs
   node scripts/validate-skills.mjs
   claude plugin validate . --strict
   claude plugin validate .claude-plugin/plugin.json --strict
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
