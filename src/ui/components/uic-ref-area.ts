//wrapper element for references area. shared between popover and sidepane

import { MarkdownRenderer, setIcon } from "obsidian";
import { getReferencesCache, getSnwAllLinksResolutions } from "src/indexer";
import SNWPlugin from "src/main";
import { Link } from "src/types";
import { getUIC_Ref_Item } from "./uic-ref-item";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createContextTree } from "./context/create/create-context-tree";
import {
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
} from "./context/types";
import { collapseEmptyNodes } from "./context/collapse/collapse-empty-nodes";
import {renderContextTree} from "./context/solid/tree"

let thePlugin: SNWPlugin;

export function setPluginVariableUIC_RefArea(plugin: SNWPlugin) {
  thePlugin = plugin;
}

// export /**
//  *  Crates the primarhy "AREA" body for displaying refrences. This is the overall wrapper for the title and individaul references
//  *
//  * @param {string} refType
//  * @param {string} key
//  * @param {string} filePath
//  * @param {boolean} isHoverView
//  * @return {*}  {Promise<string>}
//  */
// const getUIC_Ref_Area = async (refType: string, realLink: string, key: string, filePath: string, lineNu: number, isHoverView:boolean): Promise<HTMLElement> => {
//     const refAreaItems = await getRefAreaItems(refType, key, filePath);
//     const refAreaContainerEl = createDiv();
//
//     //get title header for this reference area
//     refAreaContainerEl.append(await getUIC_Ref_Title_Div(refType, realLink, key, filePath, refAreaItems.refCount, lineNu, isHoverView, thePlugin));
//
//     const refAreaEl = createDiv({cls: "snw-ref-area"});
//     refAreaEl.append(refAreaItems.response)
//     refAreaContainerEl.append(refAreaEl)
//
//     return refAreaContainerEl;
// }

const collapseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>`;

const displayContextTreeForFile = (
  el: HTMLDivElement,
  contextTree: FileContextTree
) => {
  el.createDiv(
    { cls: "tree-item search-result snw-ref-item-container" },
    (el) => {
      collapseEmptyNodes(contextTree);
      displayContextTreeBranch(el, contextTree);
    }
  );
};

const displayContextTreeBranch = (
  el: HTMLDivElement,
  contextTree: {
    breadcrumbs?: string[];
    text: string;
    sectionsWithMatches: SectionWithMatch[];
    childLists?: ListContextTree[];
    childHeadings?: HeadingContextTree[];
  },
  type?: "list" | "heading"
) => {
  el.createDiv(
    {
      cls: "tree-item-self search-result-file-title is-clickable",
    },
    (el) => {
      el.createDiv(
        {
          cls: "tree-item-icon collapse-icon",
        },
        (el) => {
          el.innerHTML = collapseIcon;
        }
      );

      const breadcrumbs = contextTree.breadcrumbs
        ? [...contextTree.breadcrumbs, contextTree.text]
        : [contextTree.text];

      el.createDiv({ cls: "tree-item-inner" }, (el) => {
        if (type === "list") {
          breadcrumbs
            .map((listText) => listText.trim().replace(/^-\s+/, ""))
            .forEach((b, i) => {
              el.createDiv({ cls: "snw-breadcrumb-container" }, (el) => {
                const token = i === 0 ? "•" : "↳";
                el.createDiv({ text: token, cls: "snw-breadcrumb-token" });
                el.createDiv({ text: b });
              });
            });
        } else if (type === "heading") {
          breadcrumbs.forEach((b, i) => {
            el.createDiv({ cls: "snw-breadcrumb-container" }, (el) => {
              const token = i === 0 ? "§" : "↳";
              el.createDiv({ text: token, cls: "snw-breadcrumb-token" });
              el.createDiv({ text: b });
            });
          });
        } else {
          breadcrumbs.forEach((b) => {
            el.createDiv({ text: `🗋 ${b}` });
          });
        }
      });
    }
  );

  el.createDiv({ cls: "snw-tree-item-children" }, (el) => {
    if (contextTree.sectionsWithMatches.length > 0) {
      el.createDiv(
        { cls: "search-result-file-matches snw-ref-item-collection-items" },
        (el) => {
          contextTree.sectionsWithMatches.forEach(async (section) => {
            const renderContainer = el.createDiv({
              cls: "search-result-file-match snw-ref-item-info",
              attr: {
                uic: "uic",
              },
            });
            await MarkdownRenderer.renderMarkdown(
              section.text,
              renderContainer,
              "/",
              thePlugin
            );
          });
        }
      );
    }

    contextTree.childLists?.forEach((list) =>
      displayContextTreeBranch(el, list, "list")
    );

    contextTree.childHeadings?.forEach((heading) =>
      displayContextTreeBranch(el, heading, "heading")
    );
  });
};

export const getUIC_Ref_Area = async (
  refType: string,
  realLink: string,
  key: string,
  filePath: string,
  lineNu: number,
  isHoverView: boolean
): Promise<HTMLElement> => {
  return createDiv({}, async (el) => {
    // todo: don't use active file, use filepath
    const activeFile = thePlugin.app.workspace.getActiveFile();

    el.createDiv({ cls: "search-results-children" }, async (el) => {
      const backlinks =
        // @ts-ignore
        thePlugin.app.metadataCache.getBacklinksForFile(activeFile)?.data;

      for (const [path, linksToTarget] of Object.entries(backlinks)) {
        const inlinkingFile = thePlugin.app.metadataCache.getFirstLinkpathDest(
          path,
          "/"
        );

        if (!inlinkingFile) {
          continue;
        }

        const inlinkingFileContents = await thePlugin.app.vault.cachedRead(
          inlinkingFile
        );

        // @ts-ignore
        const contextTree = createContextTree({
          fileName: path,
          fileContents: inlinkingFileContents,
          // @ts-ignore
          linksToTarget,
          ...thePlugin.app.metadataCache.getFileCache(inlinkingFile),
        });

        // collapseEmptyNodes(contextTree);
        renderContextTree(el, contextTree)
        // displayContextTreeForFile(el, contextTree);
      }
    });
  });
};

/**
 * Creates a DIV for a colection of reference blocks to be displayed
 *
 * @param {string} refType
 * @param {string} key
 * @param {string} filePath
 * @return {*}  {Promise<{response: string, refCount: number}>}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRefAreaItems = async (
  refType: string,
  key: string,
  filePath: string
): Promise<{
  response: HTMLElement;
  refCount: number;
}> => {
  let countOfRefs = 0;
  let linksToLoop: Link[] = null;

  if (refType === "File") {
    const allLinks: Link[] = getSnwAllLinksResolutions();
    const incomingLinks = allLinks.filter((f) => {
      if (!f?.resolvedFile) return false;
      return f?.resolvedFile?.path === filePath;
    });
    countOfRefs = incomingLinks.length;
    linksToLoop = incomingLinks;
  } else {
    let refCache: Link[] = getReferencesCache()[key];
    if (refCache === undefined)
      refCache = getReferencesCache()[filePath + "#^" + key];
    const sortedCache = await sortRefCache(refCache);
    countOfRefs = sortedCache.length;
    linksToLoop = sortedCache;
  }

  // get the unique file names for files in thie refeernces
  const uniqueFileKeys: Link[] = Array.from(
    new Set(linksToLoop.map((a) => a.sourceFile.path))
  ).map((file_path) => {
    return linksToLoop.find((a) => a.sourceFile.path === file_path);
  });

  const wrapperEl = createDiv();

  let maxItemsToShow = uniqueFileKeys.length;

  if (
    thePlugin.settings.maxFileCountToDisplay != 1000 &&
    maxItemsToShow >= thePlugin.settings.maxFileCountToDisplay
  )
    maxItemsToShow = thePlugin.settings.maxFileCountToDisplay;

  for (let index = 0; index < maxItemsToShow; index++) {
    const file_path = uniqueFileKeys[index];
    const responseItemContainerEl = createDiv();
    responseItemContainerEl.addClass("snw-ref-item-container");
    responseItemContainerEl.addClass("tree-item");

    wrapperEl.appendChild(responseItemContainerEl);

    const refItemFileEl = createDiv();
    refItemFileEl.addClass("snw-ref-item-file");
    refItemFileEl.addClass("tree-item-self");
    refItemFileEl.addClass("search-result-file-title");
    refItemFileEl.addClass("is-clickable");
    refItemFileEl.setAttribute("snw-data-line-number", "-1");
    refItemFileEl.setAttribute(
      "snw-data-file-name",
      file_path.sourceFile.path.replace(".md", "")
    );
    refItemFileEl.setAttribute("data-href", file_path.sourceFile.path);
    refItemFileEl.setAttribute("href", file_path.sourceFile.path);

    const refItemFileIconEl = createDiv();
    refItemFileIconEl.addClass("snw-ref-item-file-icon");
    refItemFileIconEl.addClass("tree-item-icon");
    refItemFileIconEl.addClass("collapse-icon");
    setIcon(refItemFileIconEl, "file-box");

    const refItemFileLabelEl = createDiv();
    refItemFileLabelEl.addClass("snw-ref-item-file-label");
    refItemFileLabelEl.addClass("tree-item-inner");
    refItemFileLabelEl.innerText = file_path.sourceFile.basename;

    refItemFileEl.append(refItemFileIconEl);
    refItemFileEl.append(refItemFileLabelEl);

    responseItemContainerEl.appendChild(refItemFileEl);

    const refItemsCollectionE = createDiv();
    refItemsCollectionE.addClass("snw-ref-item-collection-items");
    refItemsCollectionE.addClass("search-result-file-matches");
    responseItemContainerEl.appendChild(refItemsCollectionE);

    for (const ref of linksToLoop) {
      if (file_path.sourceFile.path === ref.sourceFile.path) {
        refItemsCollectionE.appendChild(await getUIC_Ref_Item(ref));
      }
    }
  }

  return { response: wrapperEl, refCount: countOfRefs };
};

const sortRefCache = async (refCache: Link[]): Promise<Link[]> => {
  return refCache.sort((a, b) => {
    return (
      a.sourceFile.basename.localeCompare(b.sourceFile.basename) ||
      Number(a.reference.position.start.line) -
        Number(b.reference.position.start.line)
    );
  });
};
