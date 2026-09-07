import { execFileSync } from 'node:child_process';
import { copyFile, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Export current files, respecting each project's .gitignore, without old Git
// history or changes to the original repositories' indexes/configuration.
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const projects = ['vo1d-blog', 'vo1d-blog-api', 'vo1d-blog-admin'];
const destination = resolve(
  process.argv[2] ??
    join(workspace, `gitee-upload-${new Date().toISOString().replace(/[:.]/g, '-')}`),
);

for (const project of projects) {
  const source = join(workspace, project);
  if (destination === source || destination.startsWith(`${source}${sep}`)) {
    throw new Error('Export destination must be outside all source projects.');
  }
  await readFile(join(source, '.gitignore'));
}

// Refuse existing destinations: never mix stale/private files into a new export.
await mkdir(destination);
const scratch = await mkdtemp(join(tmpdir(), 'vo1d-source-export-'));
try {
  const emptyExcludes = join(scratch, 'no-global-excludes');
  await writeFile(emptyExcludes, '');
  execFileSync('git', ['init', '--quiet', scratch], { stdio: 'pipe' });
  for (const project of projects) {
    const source = join(workspace, project);
    const output = execFileSync(
      'git',
      [
        '-c',
        `core.excludesFile=${emptyExcludes}`,
        `--git-dir=${join(scratch, '.git')}`,
        `--work-tree=${source}`,
        'ls-files',
        '--others',
        '--exclude-standard',
        '-z',
      ],
      { cwd: source, maxBuffer: 10 * 1024 * 1024 },
    ).toString('utf8');
    const files = output.split('\0').filter(Boolean);
    let copied = 0;
    for (const relative of files) {
      if (relative.split('/').includes('.git')) continue;
      const file = resolve(source, relative);
      if (!file.startsWith(`${source}${sep}`) || !(await lstat(file)).isFile()) {
        throw new Error(`Unsupported export entry: ${project}/${relative}`);
      }
      const target = join(destination, project, relative);
      await mkdir(dirname(target), { recursive: true });
      await copyFile(file, target);
      copied += 1;
    }
    console.log(`${project}: ${copied} files`);
  }
  console.log(`Source export: ${destination}`);
  console.log(
    'Only ignored-file filtering was performed. Review new source changes for secrets before every upload.',
  );
} finally {
  // Only remove the temporary directory created by mkdtemp in this invocation.
  if (
    dirname(scratch) === resolve(tmpdir()) &&
    scratch.startsWith(join(tmpdir(), 'vo1d-source-export-'))
  ) {
    await rm(scratch, { recursive: true, force: true });
  }
}
