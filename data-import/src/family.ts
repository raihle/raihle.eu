import { one, event, GedcomTag, allData } from "./disgen-parsing";

export interface GedcomFamily extends GedcomTag {
  tag: "FAM";
}

export class Family {
  private data;
  constructor(data: GedcomFamily) {
    this.data = data;
  }

  get pointer() {
    return this.data.pointer;
  }

  get marriage() {
    return event(one(this.data, "MARR"));
  }

  get children() {
    return allData(this.data, "CHIL");
  }

  get husband() {
    return one(this.data, "HUSB").data;
  }

  get wife() {
    return one(this.data, "WIFE").data;
  }

  toString() {
    return `FAMILY ${this.pointer}
${this.husband} and ${this.wife} on the ${this.marriage?.date}
Had: ${this.children}
`;
  }
}
