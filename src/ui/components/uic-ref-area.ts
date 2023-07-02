//wrapper element for references area. shared between popover and sidepane

import { MarkdownRenderer, setIcon, TFile } from "obsidian";
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
import { renderContextTree } from "./context/solid/tree";
import { getUIC_Ref_Title_Div } from "./uic-ref-title";

let thePlugin: SNWPlugin;

export function setPluginVariableUIC_RefArea(plugin: SNWPlugin) {
  thePlugin = plugin;
}

// todo: remove this old code
export const getUIC_Ref_Area = async (
  refType: string,
  realLink: string,
  key: string,
  filePath: string,
  lineNu: number,
  isHoverView: boolean
): Promise<HTMLElement> => {
  const refAreaItems = await getRefAreaItems(refType, key, filePath);
  const refAreaContainerEl = createDiv();

  refAreaContainerEl.append(
    await getUIC_Ref_Title_Div(
      refType,
      realLink,
      key,
      filePath,
      refAreaItems.refCount,
      lineNu,
      isHoverView,
      thePlugin
    )
  );

  const refAreaEl = createDiv({ cls: "snw-ref-area" });
  refAreaEl.append(refAreaItems.response);
  refAreaContainerEl.append(refAreaEl);

  return refAreaContainerEl;
};

export const mountContextTree = async (
  refType: string,
  realLink: string,
  key: string,
  filePath: string,
  lineNu: number,
  isHoverView: boolean,
  el: HTMLDivElement
) => {
  const { countOfRefs, linksToLoop, uniqueFileKeys, maxItemsToShow } =
    await getIncomingLinks(refType, filePath, key);

  const filesWithLinks = linksToLoop.reduce<{
    [path: string]: { links: Link[]; file: TFile };
  }>((acc, link) => {
    const { path } = link.sourceFile;
    if (path in acc) {
      acc[path].links.push(link);
    } else {
      acc[path] = { file: link.sourceFile, links: [link] };
    }
    return acc;
  }, {});

  for (const [path, { links, file }] of Object.entries(filesWithLinks)) {
    // todo: use Promise.all
    const resolvedFileContents = await thePlugin.app.vault.cachedRead(file);
    const fileCache = thePlugin.app.metadataCache.getFileCache(file);

    // @ts-ignore
    const contextTree = createContextTree({
      fileName: path,
      fileContents: resolvedFileContents,
      linksToTarget: links,
      ...fileCache,
    });

    renderContextTree(el, contextTree);
  }
};

async function getIncomingLinks(
  linkType: string,
  filePath: string,
  key: string
) {
  let countOfRefs = 0;
  let linksToLoop: Link[] = null;

  if (linkType === "File") {
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

  let maxItemsToShow = uniqueFileKeys.length;

  if (
    thePlugin.settings.maxFileCountToDisplay != 1000 &&
    maxItemsToShow >= thePlugin.settings.maxFileCountToDisplay
  )
    maxItemsToShow = thePlugin.settings.maxFileCountToDisplay;
  return { countOfRefs, linksToLoop, uniqueFileKeys, maxItemsToShow };
}

const sortRefCache = async (refCache: Link[]): Promise<Link[]> => {
  return refCache.sort((a, b) => {
    return (
      a.sourceFile.basename.localeCompare(b.sourceFile.basename) ||
      Number(a.reference.position.start.line) -
        Number(b.reference.position.start.line)
    );
  });
};
