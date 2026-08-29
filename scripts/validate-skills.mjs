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
    let plugin, market;
    try {
      plugin = JSON.parse(readFileSync(pluginPath, 'utf8'));
    } catch (e) {
      errors.push(`.claude-plugin/plugin.json: JSON 解析失败 — ${e.message}`);
    }
    try {
      market = JSON.parse(readFileSync(marketPath, 'utf8'));
    } catch (e) {
      errors.push(`.claude-plugin/marketplace.json: JSON 解析失败 — ${e.message}`);
    }
    if (plugin && market) {
      const entry = (market.plugins ?? []).find((p) => p.name === plugin.name);
      if (!entry) {
        errors.push(`marketplace.json: 找不到 name 为 "${plugin.name}" 的 plugin 条目`);
      } else if (entry.version !== plugin.version) {
        errors.push(
          `版本不一致: plugin.json=${plugin.version}, marketplace.json=${entry.version}`,
        );
      }
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
