import { Individual, GedcomIndividual } from "./individual";
import { GedcomTag } from "./parsing-functions";
import { GedcomFamily } from "./family";

/*
Tests the parsing of GedcomIndividuals to Individuals.

The GedcomIndividual structure is quite verbose and could be generated from
something much more succint, but doing that would complicate and obfuscate the
tests. 
They would be easier to read, but harder to tell what's actually going on.
*/

describe("Parser for individuals", () => {
  describe("extracts sex based on the SEX tag", () => {
    it.each(["M", "F"])("(%s)", (sex) => {
      const unit = new Individual(
        partialTag({
          tag: "INDI",
          tree: [
            partialTag({
              tag: "SEX",
              data: sex,
            }),
          ],
        })
      );
      expect(unit.sex).toBe(sex);
    });
  });

  describe("extracts name, id, and generation based on the NAME tag (generation:id/name/)", () => {
    it.each`
      gen     | id         | name            | input
      ${"00"} | ${"01"}    | ${"My name"}    | ${"00:01/My name/"}
      ${"I"}  | ${"01.01"} | ${"Other name"} | ${"I:01.01/Other name/"}
    `(
      "$input is parsed into { gen: $gen, id: $id, name: $name }",
      ({ gen, id, name, input }) => {
        const unit = new Individual(
          partialTag({
            tag: "INDI",
            tree: [
              partialTag({
                tag: "NAME",
                data: input,
              }),
            ],
          })
        );
        expect(unit.name).toBe(name);
        expect(unit.generation).toBe(gen);
        expect(unit.id).toBe(id);
      }
    );

    it("based on the entire NAME tag if the format is unexpected", () => {
      const name = ":::/My garbled name)";
      const unit = new Individual(
        partialTag({
          tag: "INDI",
          tree: [
            partialTag({
              tag: "NAME",
              data: name,
            }),
          ],
        })
      );
      expect(unit.name).toBe(name);
    });
  });

  describe("extracts birth info based on the BIRT tag:", () => {
    it.each`
      date            | place              | source
      ${"1 JAN 1970"} | ${"My birthplace"} | ${"My data source"}
      ${"9 DEC 2012"} | ${"Elsewhere"}     | ${"Other news"}
    `("$date at $place according to $source", ({ date, place, source }) => {
      const unit = new Individual(
        partialTag({
          tag: "INDI",
          tree: [
            partialTag({
              tag: "BIRT",
              tree: [
                partialTag({
                  tag: "DATE",
                  data: date,
                }),
                partialTag({
                  tag: "PLAC",
                  data: place,
                }),
                partialTag({
                  tag: "SOUR",
                  data: source,
                }),
              ],
            }),
          ],
        })
      );
      expect(unit.birth.date).toEqual(date);
      expect(unit.birth.place).toEqual(place);
      expect(unit.birth.source).toEqual(source);
    });
  });

  describe("extracts death info based on the DEAT tag:", () => {
    it.each`
      date            | place              | source
      ${"1 JAN 1970"} | ${"My deathplace"} | ${"My data source"}
      ${"9 DEC 2012"} | ${"Elsewhere"}     | ${"Other news"}
    `("$date at $place according to $source", ({ date, place, source }) => {
      const unit = new Individual(
        partialTag({
          tag: "INDI",
          tree: [
            partialTag({
              tag: "DEAT",
              tree: [
                partialTag({
                  tag: "DATE",
                  data: date,
                }),
                partialTag({
                  tag: "PLAC",
                  data: place,
                }),
                partialTag({
                  tag: "SOUR",
                  data: source,
                }),
              ],
            }),
          ],
        })
      );
      expect(unit.death.date).toEqual(date);
      expect(unit.death.place).toEqual(place);
      expect(unit.death.source).toEqual(source);
    });
  });

  describe("extracts a link to the parental family (child-of) based on the FAMC tag", () => {
    it.each(["@123@", "@6545@"])("%s", (pointer) => {
      const unit = new Individual(
        partialTag({
          tag: "INDI",
          tree: [
            partialTag({
              tag: "FAMC",
              data: pointer,
            }),
          ],
        })
      );
      expect(unit.childOf).toBe(pointer);
    });
  });

  describe("extracts a link to the own family (spouse-of / parent-of) based on the FAMS tags", () => {
    it.each`
      pointers
      ${["@123@", "@6545@"]}
      ${["@17659@"]}
      ${[]}
    `("%j", ({ pointers }) => {
      const unit = new Individual(
        partialTag({
          tag: "INDI",
          tree: pointers.map((pointer) =>
            partialTag({
              tag: "FAMS",
              data: pointer,
            })
          ),
        })
      );
      expect(unit.spouseOf.length).toBe(pointers.length);
      pointers.forEach((pointer) => expect(unit.spouseOf).toContain(pointer));
    });
  });
});

/**
 * Fills up a GedcomTag with missing required properties
 * (Most properties are not required for testing).
 *
 * Also tries to help out with type inference based on the 'tag' property.
 */
function partialTag(tagContents: {
  tag: "INDI";
  pointer?: string;
  data?: string;
  tree?: Array<GedcomTag>;
}): GedcomIndividual;
function partialTag(tagContents: {
  tag: "FAM";
  pointer?: string;
  data?: string;
  tree?: Array<GedcomTag>;
}): GedcomFamily;
function partialTag(tagContents: {
  tag: string;
  pointer?: string;
  data?: string;
  tree?: Array<GedcomTag>;
}): GedcomTag;
function partialTag(tagContents: {
  tag: string;
  pointer?: string;
  data?: string;
  tree?: Array<GedcomTag>;
}) {
  return {
    tag: tagContents.tag,
    pointer: tagContents.pointer || "",
    data: tagContents.data || "",
    tree: tagContents.tree || [],
  };
}
