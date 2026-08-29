---
name: skill-template
# 一句话说明这个 skill 做什么，以及什么时候用它。必须包含触发条件，例如「当用户要求 X 或提到 Y 时使用」。这一行决定 skill 能否被自动召回，是整个 skill 最关键的一行。
description:
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
