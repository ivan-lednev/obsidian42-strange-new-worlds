import { HeadingCache, ListItemCache } from "obsidian";
import { getTextAtPosition, isSamePosition } from "../util/position";
import {
  getHeadingBreadcrumbs,
  getHeadingIndexContaining,
} from "../util/heading";
import {
  getListBreadcrumbs,
  getListItemIndexContaining,
  getListItemWithDescendants,
  isPositionInList,
} from "../util/list";
import {
  createContextTreeProps,
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
} from "../types";
import { getFirstSectionUnder, getSectionContaining } from "../util/section";
import { formatListWithDescendants } from "../util/format";

export function createContextTree({
  linksToTarget,
  fileContents,
  fileName = "unnamed file",
  listItems = [],
  headings = [],
  sections = [],
}: createContextTreeProps) {
  const linksWithContext = linksToTarget.map((link) => {
    return {
      headingBreadcrumbs: getHeadingBreadcrumbs(link.reference.position, headings),
      listBreadcrumbs: getListBreadcrumbs(link.reference.position, listItems),
      sectionCache: getSectionContaining(link.reference.position, sections),
      link,
    };
  });

  const root = createFileContextTree(fileName);

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

    // todo: move to util
    const headingIndexAtPosition = getHeadingIndexContaining(
      link.reference.position,
      headings
    );
    const linkIsInsideHeading = headingIndexAtPosition >= 0;

    if (isPositionInList(link.reference.position, listItems)) {
      const indexOfListItemContainingLink = getListItemIndexContaining(
        link.reference.position,
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
        link.reference.position,
        sections
      );

      context.sectionsWithMatches.push({
        cache: sectionCache, // todo: don't need it here?
        text: getTextAtPosition(
          fileContents,
          firstSectionUnderHeading.position
        ),
      });
    } else {
      context.sectionsWithMatches.push({
        cache: sectionCache,
        text: getTextAtPosition(fileContents, sectionCache.position),
      });
    }
  }

  return root;
}

function createFileContextTree(name: string): FileContextTree {
  return {
    text: name,
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
