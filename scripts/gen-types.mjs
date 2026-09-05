// Gera src/types/database.types.ts a partir do schema real do Supabase.
// Script Node em vez de shell direto no package.json porque a sintaxe
// POSIX `${VAR:?msg}` não funciona no cmd.exe, que é o shell padrão do
// npm no Windows — isso quebrava `npm run types` nesse ambiente.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error(
    "SUPABASE_PROJECT_ID não definido. Rode: SUPABASE_PROJECT_ID=<ref> npm run types",
  );
  process.exit(1);
}

const result = spawnSync(
  "npx",
  [
    "supabase",
    "gen",
    "types",
    "typescript",
    "--project-id",
    projectId,
    "--schema",
    "public",
  ],
  { encoding: "utf-8", shell: true },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

writeFileSync("src/types/database.types.ts", result.stdout);
console.log("src/types/database.types.ts atualizado a partir do schema real.");
