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
