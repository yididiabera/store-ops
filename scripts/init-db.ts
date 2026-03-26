import { getDatabasePath, initializeDatabase } from "../src/server/db";

const force = process.argv.includes("--force");

initializeDatabase(force);

console.log(`Database ready at ${getDatabasePath()}`);
