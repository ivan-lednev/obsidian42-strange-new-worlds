import { HeadingCache, ListItemCache } from "obsidian";
import { getTextAtPosition, isSamePosition } from "./position-utils";
import {
  getHeadingBreadcrumbs,
  getHeadingIndexContaining,
} from "./heading-utils";
import {
  getListBreadcrumbs,
  getListItemIndexContaining,
  getListItemWithDescendants,
} from "./list-utils";
import {
  createContextTreeProps,
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
} from "./types";
import { getFirstSectionUnder, getSectionContaining } from "./section-utils";
import { formatListWithDescendants } from "./formatting-utils";

export function createContextTree({
  linksToTarget,
  fileContents,
  listItems = [],
  headings = [],
  sections = [],
}: createContextTreeProps) {
  const linksWithContext = linksToTarget.map((link) => {
    return {
      headingBreadcrumbs: getHeadingBreadcrumbs(link.position, headings),
      listBreadcrumbs: getListBreadcrumbs(link.position, listItems),
      sectionCache: getSectionContaining(link.position, sections),
      link,
    };
  });

  const root = createFileContextTree();

  for (const {
    headingBreadcrumbs,
    listBreadcrumbs,
    sectionCache,
    link,
  } of linksWithContext) {
    let context = root;

    for (const headingCache of headingBreadcrumbs) {
      const headingFoundInChildren = context.childHeadings.find((tree) =>
        isSamePosition(tree.headingCache.position, headingCache.position)
      );

      if (headingFoundInChildren) {
        context = headingFoundInChildren;
      } else {
        const newHeadingContext: HeadingContextTree =
          createHeadingContextTree(headingCache);

        context.childHeadings.push(newHeadingContext);
        context = newHeadingContext;
      }
    }

    // todo: remove duplication
    for (const listItemCache of listBreadcrumbs) {
      const listItemFoundInChildren = context.childLists.find((tree) =>
        isSamePosition(tree.listItemCache.position, listItemCache.position)
      );

      if (listItemFoundInChildren) {
        // @ts-ignore
        context = listItemFoundInChildren;
      } else {
        const newListContext: ListContextTree = createListContextTree(
          listItemCache,
          getTextAtPosition(fileContents, listItemCache.position)
        );

        context.childLists.push(newListContext);
        // @ts-ignore
        context = newListContext;
      }
    }

    // if we are in a list, push child list items

    const linkIsInsideSubList = listBreadcrumbs.length > 0;
    const headingIndexAtPosition = getHeadingIndexContaining(
      link.position,
      headings
    );
    const linkIsInsideHeading = headingIndexAtPosition >= 0;

    if (linkIsInsideSubList) {
      const indexOfListItemContainingLink = getListItemIndexContaining(
        link.position,
        listItems
      );
      const listItemCacheWithDescendants = getListItemWithDescendants(
        indexOfListItemContainingLink,
        listItems
      );
      const text = formatListWithDescendants(
        fileContents,
        listItemCacheWithDescendants
      );

      context.sectionsWithMatches.push({
        cache: sectionCache, // todo: we don't need it here
        text,
      });
    } else if (linkIsInsideHeading) {
      const firstSectionUnderHeading = getFirstSectionUnder(
        link.position,
        sections
      );

      context.sectionsWithMatches.push({
        cache: sectionCache, // todo: don't need it here?
        text: getTextAtPosition(fileContents, {
          start: headings[headingIndexAtPosition].position.start,
          end: firstSectionUnderHeading.position.end,
        }),
      });
    } else {
      // just get the containing section
      context.sectionsWithMatches.push({
        cache: sectionCache,
        text: getTextAtPosition(fileContents, sectionCache.position),
      });
    }
  }

  return root;
}

function createFileContextTree(): FileContextTree {
  return {
    text: "foo",
    sectionsWithMatches: [],
    childLists: [],
    childHeadings: [],
  };
}

function createHeadingContextTree(
  headingCache: HeadingCache
): HeadingContextTree {
  return {
    headingCache,
    text: headingCache.heading,
    sectionsWithMatches: [],
    childHeadings: [], // todo: we can already push all the children here
    childLists: [],
  };
}

function createListContextTree(
  listItemCache: ListItemCache,
  text: string
): ListContextTree {
  return {
    text,
    listItemCache,
    sectionsWithMatches: [],
    childLists: [],
  };
}

