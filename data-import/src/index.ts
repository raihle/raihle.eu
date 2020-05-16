import yargs = require("yargs");
import { importToDatabase } from "./main";

const argv: { from: string; to: string } = yargs.argv as any;

if (argv.from && argv.to) {
  importToDatabase(argv.from, argv.to)
    .then(() => console.log("DONE"))
    .catch((e) => console.error("FAILED:", e));
}
