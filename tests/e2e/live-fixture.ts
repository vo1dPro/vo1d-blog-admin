import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { z } from 'zod';
import { expect, test, type Page } from '@playwright/test';

// Live suites share the real IP quota. Honor a rejected login's cooldown without
// clearing throttle records or weakening the backend's security settings.
export async function loginLiveAdmin(page: Page, admin: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('邮箱', { exact: true }).fill(admin.email);
  await page.getByLabel('密码', { exact: true }).fill(admin.password);
  for (let attempt = 0; attempt < 2; attempt++) {
    const pending = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/auth/login' &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '进入工作台' }).click();
    const response = await pending;
    if (response.status() === 429 && attempt === 0) {
      const { retryAfter } = z
        .object({ retryAfter: z.number().int().min(1).max(3600) })
        .parse(await response.json());
      const delay = retryAfter * 1000 + 250;
      test.setTimeout(test.info().timeout + delay + 5000);
      await page.waitForTimeout(delay);
      continue;
    }
    expect(response.status()).toBe(200);
    await expect(page).not.toHaveURL(/login/);
    return;
  }
}

// Test provisioning only. Runs INSIDE the existing local backend container.
// No .env file, database URL or Steam key is read into the Admin project.
// No fixture secrets are written to disk, process arguments, traces or logs.
const container = process.env.E2E_BACKEND_CONTAINER ?? 'vo1d-blog-api-api-1';
function provision(input: {
  action: 'create' | 'expire' | 'delete' | 'cleanupContent';
  email: string;
  password?: string;
  id?: number;
  records?: { resource: string; id: number }[];
  mediaIds?: number[];
  siteProfile?: Record<string, unknown>;
}): unknown {
  if (!/^admin-e2e-[a-f0-9]{32}@example\.test$/.test(input.email))
    throw new Error('Refusing non-test administrator');
  const script = `
    import { PrismaPg } from '@prisma/adapter-pg';
    import { PrismaClient } from './dist/generated/prisma/client.js';
    import { hash, argon2id } from 'argon2';
    import { randomBytes, createHash } from 'node:crypto';
    const input = ${JSON.stringify(input)};
    if (process.env.NODE_ENV === 'production') throw new Error('Local development backend required');
    const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
    try {
      if (input.action === 'create') {
        const user = await prisma.adminUser.create({data:{email:input.email,passwordHash:await hash(input.password,{type:argon2id})}});
        console.log(JSON.stringify({id:user.id}));
      } else {
        const user=await prisma.adminUser.findFirst({where:{id:input.id,email:input.email}});
        if (!user) throw new Error('Test identity does not match');
        if(input.action==='expire') await prisma.adminSession.deleteMany({where:{adminUserId:user.id}});
        else if(input.action==='cleanupContent') {
          const token=randomBytes(32).toString('base64url');
          const session=await prisma.adminSession.create({data:{adminUserId:user.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+120000),lastUsedAt:new Date()}});
          try {
            if(input.siteProfile) {
              const response=await fetch('http://localhost:3000/admin/site-profile',{method:'PATCH',headers:{'Content-Type':'application/json',Origin:'http://localhost:5174',Cookie:(process.env.SESSION_COOKIE_NAME??'vo1d_admin_session')+'='+token},body:JSON.stringify(input.siteProfile)});
              if(response.status!==200)throw new Error('Site profile restoration failed');
            }
            const allowed=new Set(['articles','photos','books','games','skills','social-links','tags','categories','media']);
            for(const item of [...input.records,...input.mediaIds.map(id=>({resource:'media',id}))]) {
              if(!allowed.has(item.resource)||!Number.isInteger(item.id)||item.id<1) throw new Error('Invalid cleanup target');
              const response=await fetch('http://localhost:3000/admin/'+item.resource+'/'+item.id,{method:'DELETE',headers:{Origin:'http://localhost:5174',Cookie:(process.env.SESSION_COOKIE_NAME??'vo1d_admin_session')+'='+token}});
              if(![204,404].includes(response.status))throw new Error('Temporary content cleanup failed');
            }
          } finally { await prisma.adminSession.deleteMany({where:{id:session.id}}); }
        } else await prisma.adminUser.delete({where:{id:user.id}});
        console.log(JSON.stringify({ok:true}));
      }
    } finally { await prisma.$disconnect(); }
  `;
  const result = spawnSync(
    'docker',
    ['exec', '-i', '-w', '/app', container, 'node', '--input-type=module'],
    { input: script, encoding: 'utf8', windowsHide: true, timeout: 30000 },
  );
  if (result.status !== 0)
    throw new Error(
      `Local test administrator provisioning failed (${input.action}). Verify the development backend container is running; credentials are intentionally omitted.`,
    );
  return JSON.parse(result.stdout.trim()) as unknown;
}
export function createLiveAdmin() {
  const email = `admin-e2e-${randomBytes(16).toString('hex')}@example.test`;
  const password = randomBytes(36).toString('base64url');
  const { id } = z
    .object({ id: z.number().int().positive() })
    .parse(provision({ action: 'create', email, password }));
  return {
    email,
    password,
    expire: () => {
      provision({ action: 'expire', email, id });
    },
    cleanup: () => {
      provision({ action: 'delete', email, id });
    },
    cleanupContent: (
      records: { resource: string; id: number }[],
      mediaIds: number[],
      siteProfile?: Record<string, unknown>,
    ) => {
      provision({ action: 'cleanupContent', email, id, records, mediaIds, siteProfile });
    },
  };
}
