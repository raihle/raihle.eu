import yargs = require("yargs");
import importData from "./data-import";

const argv = yargs.argv;

if (argv.from && argv.to) {
  importData(argv.from, argv.to);
}
