import Gedstream from "gedstream";
import Database from "./database";
import { createReadStream } from "fs";

interface GedstreamEvent {
  DATE?: Gedstream<string>;
  PLAC?: Gedstream<string>;
  SOUR?: Gedstream<string>;
}

type GedstreamId = string;

interface GedstreamPointer {
  data: GedstreamId;
}

interface Gedstream<X> {
  data: X;
}

interface GedstreamSex {
  data: "M" | "F";
}

interface GedstreamMultilineString {
  data: string;
  CONC?: Array<Gedstream<string>>;
}

interface GedstreamIndividual {
  tag: "INDI";
  /* Unique Disgen ID */
  pointer: GedstreamId;
  /* Id, generation, and name all in one */
  /* The format is particular to this data set */
  NAME: Gedstream<string>;
  /* Sex of the individual, if known */
  SEX?: GedstreamSex;
  /* Birth place and date, if known */
  BIRT?: GedstreamEvent;
  /* Death place and date, if known */
  DEAT?: GedstreamEvent;
  /* Optional notes */
  NOTE?: GedstreamMultilineString;
  /* The family in which this individual is a child */
  FAMC?: GedstreamPointer;
  /* The families in which this individual is a spouse or parent */
  FAMS?: Array<GedstreamPointer>;
}

interface GedstreamFamily {
  tag: "FAM";
  /* Unique Disgen ID */
  pointer: GedstreamId;
  /* The marriage, if any */
  /* Persons married multiple times are modeled by multiple families */
  MARR?: GedstreamEvent;
  /* Children, if any */
  CHIL?: Array<GedstreamPointer>;
  /* Spouse / parent */
  HUSB?: GedstreamPointer;
  /* Other spouse / parent */
  WIFE?: GedstreamPointer;
}

interface ParsedName {
  generation?: string;
  id?: string;
  name?: string;
}

interface ParsedEvent {
  date?: string;
  place?: string;
  source?: string;
}

function get<X>(data: Gedstream<X>, fallback?: X): X;
function get<X>(data: Gedstream<X> | undefined, fallback: X): X;
function get<X>(
  data: Gedstream<X> | undefined,
  fallback?: X | undefined
): X | undefined;
function get<X>(data?: Gedstream<X>, fallback?: X) {
  return data?.data || fallback;
}

function getAll(datas) {
  return datas?.map(get) || [];
}

function parseEvent(event?: GedstreamEvent): ParsedEvent {
  return {
    date: get(event?.DATE),
    place: get(event?.PLAC),
    source: get(event?.SOUR)
  };
}

function parseMultilineString(
  multilineString?: GedstreamMultilineString
): string {
  const first = get(multilineString, "");
  const rest = getAll(multilineString?.CONC);
  return [first, rest.join("\n")].join("\n");
}

const DISGEN_NAME_REGEX = /^(?:(?<generation>[^:]+):)?(?<id>\d{2,}(?:\.\d{2,})*)?\/(?<name>[^\/]+)\/$/;
class Individual {
  pointer: GedstreamId;
  generation?: string;
  id?: string;
  name?: string;
  sex?: "M" | "F";
  birth: ParsedEvent;
  death: ParsedEvent;
  note: string;
  childOf?: GedstreamId;
  spouseOf: Array<GedstreamId>;

  constructor(data: GedstreamIndividual) {
    this.pointer = data.pointer;
    const { generation, id, name } = Individual.parseName(data.NAME);
    this.generation = generation;
    this.id = id;
    this.name = name;
    this.sex = get(data.SEX);
    this.birth = parseEvent(data.BIRT);
    this.death = parseEvent(data.DEAT);
    this.note = parseMultilineString(data.NOTE);
    this.childOf = get(data.FAMC);
    this.spouseOf = getAll(data.FAMS);
  }

  static parseName(disgenName: Gedstream<string>): ParsedName {
    const matches = get(disgenName).match(DISGEN_NAME_REGEX);
    return {
      generation: matches?.groups?.generation,
      id: matches?.groups?.id,
      name: matches?.groups?.name
    };
  }
}

class Family {
  pointer: GedstreamId;
  marriage: ParsedEvent;
  children: Array<GedstreamId>;
  husband?: GedstreamId;
  wife?: GedstreamId;

  constructor(data: GedstreamFamily) {
    this.pointer = data.pointer;
    this.marriage = parseEvent(data.MARR);
    this.children = getAll(data.CHIL);
    this.husband = get(data.HUSB);
    this.wife = get(data.WIFE);
  }
}

type GedstreamData = GedstreamIndividual | GedstreamFamily;

export default function main(from: string, to: string) {
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

  function handleData(data: GedstreamData) {
    switch (data.tag) {
      case "INDI":
        console.log(new Individual(data));
        break;
      case "FAM":
        console.log(new Family(data));
        break;
      default:
        console.log(`Unknown tag ${(data as any).tag}`);
    }
  }
}

module.exports = main;
