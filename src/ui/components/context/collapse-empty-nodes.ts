import { FileContextTree, HeadingContextTree } from "./types";

export function collapseEmptyNodes(contextTree: FileContextTree) {
  function recursive(
    branch: HeadingContextTree,
    breadcrumbsFromParent?: string[]
  ): HeadingContextTree {
    console.log({ breadcrumbsFromParent });

    if (
      !branch?.sectionsWithMatches?.length &&
      branch?.childHeadings?.length === 1
    ) {
      console.log("found empty node");
      if (breadcrumbsFromParent) {
        breadcrumbsFromParent.push(branch.text);
      }
      const breadcrumbs = breadcrumbsFromParent
        ? breadcrumbsFromParent
        : [branch.text];

      return recursive(branch.childHeadings[0], breadcrumbs);
    }

    branch.childHeadings = branch.childHeadings.map((h) => recursive(h));

    // @ts-ignore
    branch.breadcrumbs = breadcrumbsFromParent;

    return branch;
  }

  contextTree.childHeadings = contextTree.childHeadings.map((h) =>
    recursive(h)
  );

  console.log(contextTree);
  return contextTree;
}