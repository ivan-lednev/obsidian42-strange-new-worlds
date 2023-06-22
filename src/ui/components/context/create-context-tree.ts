import {
  HeadingCache,
  LinkCache,
  ListItemCache,
  Pos,
  SectionCache,
} from "obsidian";
import { doesPositionIncludeAnother, isSamePosition } from "./position-utils";
import { getHeadingBreadcrumbs } from "./heading-utils";
import { getListBreadcrumbs } from "./list-utils";

interface createContextTreeProps {
  // todo: better naming. Separate metadata cache?
  // todo: this is backlinks. Make it clear that this comes from target, and the other three from referrer
  backlinks: LinkCache[];
  fileContents: string;
  listItems: ListItemCache[];
  headings: HeadingCache[];
  sections: SectionCache[];
}

interface WithListChildren {
  sectionsWithLinks: SectionCache[];
  childLists: ListContextTree[];
}

interface WithAnyChildren extends WithListChildren {
  childHeadings: HeadingContextTree[];
}

interface FileContextTree extends WithAnyChildren {
  fileName?: string;
}

interface HeadingContextTree extends WithAnyChildren {
  headingCache: HeadingCache;
}

interface ListContextTree extends WithListChildren {
  listItemCache: ListItemCache;
}

interface LinkContextTree {
  headingCache: HeadingCache;
  sectionsWithLinks: SectionCache[];
  children: LinkContextTree[];
  childLists: ListItemCache[];
}

export function createContextTree({
  backlinks,
  fileContents,
  listItems = [],
  headings = [],
  sections = [],
}: createContextTreeProps) {
  const linksWithContext = backlinks.map((link) => {
    return {
      headingBreadcrumbs: getHeadingBreadcrumbs(link.position, headings),
      listBreadcrumbs: getListBreadcrumbs(link.position, listItems),
      sectionCache: getSectionContaining(link.position, sections),
    };
  });

  const root: LinkContextTree = {
    // todo: fix cast
    headingCache: {} as HeadingCache,
    childLists: [],
    children: [],
    sectionsWithLinks: [],
  };

  // const root: FileContextTree = {
  //   sectionsWithLinks: [],
  //   childLists: [],
  //   childHeadings: [],
  // };

  for (const {
    headingBreadcrumbs: breadcrumbsListForHeading,
    sectionCache,
  } of linksWithContext) {
    let context = root;

    for (const breadcrumbsHeading of breadcrumbsListForHeading) {
      if (
        !isSamePosition(
          context.headingCache?.position, // todo: fix chaining
          breadcrumbsHeading.position
        )
      ) {
        const headingFoundInChildren = context.children.find((headingTree) =>
          isSamePosition(
            headingTree.headingCache.position,
            breadcrumbsHeading.position
          )
        );

        // move down one level
        if (headingFoundInChildren) {
          context = headingFoundInChildren;
        } else {
          // Need a new child
          const newContext = {
            headingCache: breadcrumbsHeading,
            children: [], // todo: we can already push all the children here
            sectionsWithLinks: [], // todo: section should get to this only if it's the last heading in the chain
          };
          context.children.push(newContext);
          context = newContext;
        }
      }
    }

    context.sectionsWithLinks.push(sectionCache);
  }

  return root;
}

function getSectionContaining(
  searchedForPosition: Pos,
  sections: SectionCache[]
) {
  return sections.find(({ position }) =>
    doesPositionIncludeAnother(position, searchedForPosition)
  );
}
