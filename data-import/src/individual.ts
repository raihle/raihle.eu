import { one, event, multiline, GedcomTag, allData } from "./disgen-parsing";
const DISGEN_NAME_REGEX = /^(?:(?<generation>[^:]+):)?(?<id>\d{2,}(?:\.\d{2,})*)?\/(?<name>[^\/]+)\/$/;

export interface GedcomIndividual extends GedcomTag {
  tag: "INDI";
}

export class Individual {
  private data;
  private cachedName;
  constructor(data: GedcomIndividual) {
    this.data = data;
  }

  get pointer() {
    return this.data.pointer;
  }

  get name() {
    return this.parsedName().name;
  }

  get id() {
    return this.parsedName().id;
  }

  get generation() {
    return this.parsedName().generation;
  }

  get sex() {
    return one(this.data, "SEX")?.data;
  }

  get birth() {
    return event(one(this.data, "BIRT"));
  }

  get death() {
    return event(one(this.data, "DEAT"));
  }

  get note() {
    return multiline(one(this.data, "NOTE"));
  }

  get childOf() {
    return one(this.data, "FAMC")?.data;
  }

  get spouseOf() {
    return allData(this.data, "FAMS");
  }

  private parsedName() {
    if (!this.cachedName) {
      const nameMatches = one(this.data, "NAME").data.match(DISGEN_NAME_REGEX);
      this.cachedName = {
        name: nameMatches?.groups?.name,
        id: nameMatches?.groups?.id,
        generation: nameMatches?.groups?.generation,
      };
    }
    return this.cachedName;
  }

  toString() {
    return `INDIVIDUAL ${this.pointer}
${this.sex} ${this.name} (${this.id} / ${this.generation})
B: ${this.birth.date} to ${this.childOf}
D: ${this.death.date} leaving ${this.spouseOf}
${this.note}
`;
  }
}
