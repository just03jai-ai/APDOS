import { loadExternalSkills } from "./load-external-skills.js";

const result = await loadExternalSkills();

console.log(`Discovered: ${result.discovered}`);
console.log(`Registered: ${result.registered}`);
console.log(`Skipped: ${result.skipped}`);
console.log(`Errors: ${result.errors.length}`);

if (result.errors.length > 0) {
  for (const error of result.errors) {
    console.error(`${error.skillId ?? "unknown"}: ${error.message}`);
  }

  process.exitCode = 1;
}
