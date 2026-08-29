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
 * skipSkillsDir 为 true 时完全不建 skills/ 目录。
 * emptySkillsDir 为 true 时建 skills/ 目录但不建任何 skill 子目录。
 * pluginJsonRaw 非空时原样写入 plugin.json（用于构造损坏 JSON），忽略 pluginVersion。
 * extraFiles 是相对于 skills/<skillName>/ 的 “相对路径 -> 内容” 映射，用于补齐链接目标。
 */
function makeFixture({
  skillName = 'demo',
  frontmatterName = 'demo',
  description = '演示用 skill，当需要演示时使用。',
  body = '# Demo\n\n正文。\n',
  skipSkillMd = false,
  pluginVersion = '1.0.0',
  marketVersion = '1.0.0',
  skipSkillsDir = false,
  emptySkillsDir = false,
  pluginJsonRaw = null,
  extraFiles = {},
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'skills-fixture-'));
  if (!skipSkillsDir) {
    if (emptySkillsDir) {
      mkdirSync(join(root, 'skills'), { recursive: true });
    } else {
      const skillDir = join(root, 'skills', skillName);
      mkdirSync(skillDir, { recursive: true });
      if (!skipSkillMd) {
        const fm = `---\nname: ${frontmatterName}\ndescription: ${description}\nlicense: MIT\n---\n\n`;
        writeFileSync(join(skillDir, 'SKILL.md'), fm + body);
      }
      for (const [relPath, content] of Object.entries(extraFiles)) {
        const target = join(skillDir, relPath);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, content);
      }
    }
  }
  mkdirSync(join(root, '.claude-plugin'), { recursive: true });
  writeFileSync(
    join(root, '.claude-plugin', 'plugin.json'),
    pluginJsonRaw ?? JSON.stringify({ name: 'jogiter-skills', version: pluginVersion }),
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
  const body =
    '见 [官网](https://example.com)，[下文](#core)，以及 [规则](references/rules.md#section)。\n';
  const extraFiles = { 'references/rules.md': '# Rules\n\n## Section\n' };
  const { errors } = validateRepo(fixture(t, { body, extraFiles }));
  assert.deepEqual(errors, []);
});

test('真实仓库通过校验', () => {
  const { errors } = validateRepo(repoRoot);
  assert.deepEqual(errors, []);
});

test('skills/ 目录不存在时报错', (t) => {
  const { errors } = validateRepo(fixture(t, { skipSkillsDir: true }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /skills\/.*不存在/);
});

test('skills/ 为空目录时报错', (t) => {
  const { errors } = validateRepo(fixture(t, { emptySkillsDir: true }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /没有任何 skill 目录/);
});

test('manifest JSON 损坏时返回错误而非抛异常', (t) => {
  const root = fixture(t, { pluginJsonRaw: '{ "name": "jogiter-skills",' });
  let result;
  assert.doesNotThrow(() => {
    result = validateRepo(root);
  });
  assert.ok(result.errors.some((e) => /plugin\.json.*JSON 解析失败/.test(e)));
});
