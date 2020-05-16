import Gedstream = require("gedstream");
import Database from "./database/database";
import { createReadStream } from "fs";
import { Individual, GedcomIndividual } from "./parsing/individual";
import { GedcomTag } from "./parsing/parsing-functions";
import { Family, GedcomFamily } from "./parsing/family";

type KnownGedcomTag = GedcomIndividual | GedcomFamily;

export function importToDatabase(from: string, to: string) {
  return new Promise((resolve, reject) => {
    try {
      const parser = new Gedstream();
      parser.on("data", handleData);
      parser.on("end", resolve);

      const db = new Database(to);
      db.clear().then(() => {
        createReadStream(from, "utf-8").pipe(parser);
      });
    } catch (e) {
      reject(e);
    }
  });

  function handleData(data: KnownGedcomTag) {
    switch (data.tag) {
      case "INDI":
        console.log(new Individual(data).toString());
        break;
      case "FAM":
        console.log(new Family(data).toString());
        break;
      default:
        console.log(`Unknown tag ${(data as GedcomTag).tag}`);
    }
  }
}
