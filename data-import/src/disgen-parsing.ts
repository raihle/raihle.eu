export interface GedcomTag {
  tag: string;
  pointer: string;
  data: string;
  tree: Array<GedcomTag>;
}

export function one(parent: GedcomTag, tagName: string): GedcomTag {
  return parent.tree.find((c) => c.tag === tagName) || emptyData(tagName);
}

export function all(parent: GedcomTag, tagName: string) {
  return parent.tree.filter((c) => c.tag === tagName);
}

export function allData(parent: GedcomTag, tagName: string) {
  return all(parent, tagName).map((c) => c.data);
}

export function event(tag: GedcomTag) {
  return {
    date: one(tag, "DATE").data,
    place: one(tag, "PLAC").data,
    source: one(tag, "SOUR").data,
  };
}

export function multiline(tag: GedcomTag) {
  return [
    tag.data,
    all(tag, "CONC")
      .map((c) => c.data)
      .join("\n"),
  ].join("\n");
}

const empties: Object = {};
const EMPTY_ARRAY = [];
const EMPTY_STRING = "";

function emptyData(tagName: string) {
  if (!empties.hasOwnProperty(tagName)) {
    empties[tagName] = {
      tag: tagName,
      pointer: EMPTY_STRING,
      data: EMPTY_STRING,
      tree: EMPTY_ARRAY,
    };
  }
  return empties[tagName];
}
