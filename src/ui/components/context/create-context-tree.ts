import { HeadingCache, ListItemCache } from "obsidian";
import { getTextAtPosition, isSamePosition } from "./position-utils";
import { getHeadingBreadcrumbs } from "./heading-utils";
import { getListBreadcrumbs } from "./list-utils";
import {
  createContextTreeProps,
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
} from "./types";
import { getSectionContaining } from "./section-utils";

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
    };
  });

  const root = createFileContextTree();

  for (const {
    headingBreadcrumbs,
    listBreadcrumbs,
    sectionCache,
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

    context.sectionsWithMatches.push({
      cache: sectionCache,
      text: getTextAtPosition(fileContents, sectionCache.position),
    });
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
