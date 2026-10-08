import { existsSync, readFileSync } from "node:fs";

const file = "inbox/reviews.json";
const reviews = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
if (reviews.length === 0) process.exit(1);
console.log(`${reviews.length} new reviews`);
