import { HeadingCache, ListItemCache } from "obsidian";
import { getTextAtPosition, isSamePosition } from "./position-utils";
import { getHeadingBreadcrumbs } from "./heading-utils";
import { getListBreadcrumbs } from "./list-utils";
import {
  createContextTreeProps,
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
  WithAnyChildren,
  WithListChildren,
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
        context = listItemFoundInChildren;
      } else {
        const newListContext: ListContextTree =
          createListContextTree(listItemCache);

        context.childLists.push(newListContext);
        context = newListContext;
      }
    }

    context.sectionsWithMatches.push(sectionCache);
  }

  return addTextToItems(root, fileContents);
}

function addTextToItems(root: WithAnyChildren, fileContents: string) {
  root.sectionsWithMatches.forEach((sectionCache) => {
    sectionCache.asText = getTextAtPosition(
      fileContents,
      sectionCache.position
    );
  });

  root.childLists.forEach((listContextTree) => {
    listContextTree.listItemCache.asText = getTextAtPosition(
      fileContents,
      listContextTree.listItemCache.position
    );

    // @ts-ignore
    addTextToItems(listContextTree, fileContents);
  });

  root.childHeadings?.forEach((headingContextTree) => {
    addTextToItems(headingContextTree, fileContents);
  });

  return root
}

function walkContextTree(root: FileContextTree, visitor: () => void) {}

function createFileContextTree(): FileContextTree {
  return {
    fileName: "foo",
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
    sectionsWithMatches: [],
    childHeadings: [], // todo: we can already push all the children here
    childLists: [],
  };
}

function createListContextTree(listItemCache: ListItemCache): ListContextTree {
  return {
    listItemCache,
    sectionsWithMatches: [],
    childLists: [],
  };
}
