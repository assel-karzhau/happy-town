import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("group context preserves an existing current period and reports conflicts accurately", () => {
  const output = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
    process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/test';
    const { resolveGroupContext, createGroupWithTeacher } = await import('./lib/services/management.service.ts');
    const { prisma } = await import('./lib/db/prisma.ts');
    const { apiError } = await import('./lib/http/api-response.ts');
    const { Prisma } = await import('./generated/prisma/client.ts');
    const { apiErrorMessage } = await import('./lib/i18n/api-errors.ts');
    const periodWrites = [];
    let lookup = 0;
    const tx = {
      book: { findFirst: async () => ({id:'book'}) },
      course: { findFirst: async () => ({id:'course'}) },
      academicPeriod: {
        findFirst: async () => (++lookup % 2 ? null : {id:'old-current'}),
        findUnique: async () => null,
        upsert: async (args) => { periodWrites.push(args); return {id:'new-period'}; }
      },
      group: { findFirst: async () => ({id:'existing'}), create: async () => { throw new Error('unexpected group creation'); } }
    };
    await resolveGroupContext(tx,'book',new Date('2026-11-01T00:00:00Z'));
    prisma.$transaction = async fn => fn(tx);
    let conflict;
    try {
      await createGroupWithTeacher({name:'Group-1',level:'Starter',capacity:10,bookId:'11111111-1111-4111-8111-111111111111'}, {userId:'22222222-2222-4222-8222-222222222222',role:'ADMIN'});
    } catch (error) { conflict = await (await apiError(error)).json(); }
    tx.academicPeriod.findUnique = async () => ({id:'planned-period',archivedAt:null});
    const reused = await resolveGroupContext(tx,'book',new Date('2026-11-01T00:00:00Z'));
    tx.academicPeriod.findUnique = async () => null;
    tx.academicPeriod.findFirst = async () => null;
    await resolveGroupContext(tx,'book',new Date('2026-11-01T00:00:00Z'));
    const firstPeriod = periodWrites.at(-1).create;
    tx.group.findFirst = async () => null;
    tx.group.create = async ({data}) => ({id:'new-group',name:data.name});
    tx.auditLog = {create:async () => ({})};
    const created = await createGroupWithTeacher({name:'New group',level:'Starter',capacity:10,bookId:'11111111-1111-4111-8111-111111111111'}, {userId:'22222222-2222-4222-8222-222222222222',role:'ADMIN'});
    const unique = new Prisma.PrismaClientKnownRequestError('unique', {code:'P2002',clientVersion:'test'});
    const generic = await (await apiError(unique)).json();
    console.log(JSON.stringify({period:periodWrites[0].create,firstPeriod,reused,created,conflict,generic,english:apiErrorMessage('en',conflict,'fallback')}));
    await prisma.$disconnect();
  `], { encoding: "utf8" });
  const result = JSON.parse(output);
  assert.equal(result.period.status, "PLANNED");
  assert.equal(result.period.isCurrent, false);
  assert.equal(result.firstPeriod.status, "CURRENT");
  assert.equal(result.firstPeriod.isCurrent, true);
  assert.equal(result.reused.academicPeriodId, "planned-period");
  assert.equal(result.created.name, "New group");
  assert.equal(result.conflict.code, "CONFLICT");
  assert.match(result.conflict.error, /Группа с таким названием/);
  assert.match(result.english, /group with this name/i);
  assert.equal(result.generic.code, "CONFLICT");
  assert.doesNotMatch(result.generic.error, /Email|телефон/i);
});
