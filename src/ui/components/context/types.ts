import { HeadingCache, LinkCache, ListItemCache, SectionCache } from "obsidian";

export interface createContextTreeProps {
  // todo: better naming. Separate metadata cache?
  // todo: this is backlinks. Make it clear that this comes from target, and the other three from referrer
  linksToTarget: LinkCache[];
  fileContents: string;
  listItems: ListItemCache[];
  headings: HeadingCache[];
  sections: SectionCache[];
}

export interface WithListChildren {
  sectionsWithMatches: SectionCache[];
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

export interface LinkContextTree {
  headingCache: HeadingCache;
  sectionsWithLinks: SectionCache[];
  children: LinkContextTree[];
  childLists: ListItemCache[];
}