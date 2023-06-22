import { Pos, SectionCache } from "obsidian";
import { doesPositionIncludeAnother } from "./position-utils";

export function getSectionContaining(
  searchedForPosition: Pos,
  sections: SectionCache[]
) {
  return sections.find(({ position }) =>
    doesPositionIncludeAnother(position, searchedForPosition)
  );
}