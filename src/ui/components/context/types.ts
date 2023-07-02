import { HeadingCache, LinkCache, ListItemCache, SectionCache } from "obsidian";
import {Link} from "../../../types";

export interface createContextTreeProps {
  // todo: better naming. Separate metadata cache?
  // todo: this is backlinks. Make it clear that this comes from target, and the other three from referrer
  linksToTarget: Link[];
  fileContents: string;
  fileName?: string;
  listItems: ListItemCache[];
  headings: HeadingCache[];
  sections: SectionCache[];
}

export interface SectionWithMatch {
  text: string;
  cache: SectionCache;
}

export interface WithListChildren {
  text: string;
  sectionsWithMatches: SectionWithMatch[];
  childLists: ListContextTree[];
}

export interface WithAnyChildren extends WithListChildren {
  childHeadings: HeadingContextTree[];
}

export interface FileContextTree extends WithAnyChildren {
  fileName?: string;
}

export interface HeadingContextTree extends WithAnyChildren {
  headingCache: HeadingCache;
}

export interface ListContextTree extends WithListChildren {
  listItemCache: ListItemCache;
}
