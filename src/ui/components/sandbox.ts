import {
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
} from "./context/types";
import { collapseEmptyNodes } from "./context/collapse-empty-nodes";
import { MarkdownRenderer } from "obsidian";

const collapseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>`;

class Branch {
  private readonly children: Branch[] = [];
  private readonly contentEl: HTMLDivElement;
  private childrenCollapsed = false;

  constructor(
    private readonly containerEl: HTMLDivElement,
    private readonly contextTree: AnyTree,
    type?: "heading" | "list"
  ) {
    containerEl.createDiv(
      {
        cls: "tree-item-self search-result-file-title is-clickable",
      },
      (el) => {
        const collapseIconEl = el.createDiv(
          {
            cls: "tree-item-icon collapse-icon",
          },
          (el) => {
            el.innerHTML = collapseIcon;
          }
        );

        collapseIconEl.addEventListener("click", () => {
          this.childrenCollapsed = !this.childrenCollapsed;
          this.contentEl.setCssStyles({
            display: this.childrenCollapsed ? "none" : "block",
          });
        });

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

    this.contentEl = containerEl.createDiv(
      { cls: "snw-tree-item-children" },
      (el) => {
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
                  // @ts-ignore
                  window.thePlugin
                );
              });
            }
          );
        }

        contextTree.childLists?.forEach((list) =>
          this.children.push(new Branch(el, list, "list"))
        );

        contextTree.childHeadings?.forEach((heading) =>
          this.children.push(new Branch(el, heading, "heading"))
        );
      }
    );
  }
}

class ContextTree {
  private searchEl: HTMLDivElement;
  private branches: Branch[] = [];

  constructor(
    private readonly containerEl: HTMLDivElement,
    private readonly fileContextTree: FileContextTree
  ) {
    this.addSearchEl();

    this.containerEl.createDiv(
      { cls: "tree-item search-result snw-ref-item-container" },
      (el) => {
        collapseEmptyNodes(fileContextTree);
        this.branches.push(new Branch(el, fileContextTree));
        // displayContextTreeBranch(el, fileContextTree);
      }
    );
  }

  private addSearchEl() {
    this.searchEl = this.containerEl.createEl("input");

    this.searchEl.addEventListener("input", (e) => {
      // @ts-ignore
      this.filterResults(e.currentTarget.value);
    });
  }

  // private filterResults(filter: string) {
  //   this.listEls.forEach((el) => {
  //     const doesMatch = el.textContent.includes(filter);
  //     el.setCssStyles({ display: doesMatch ? "block" : "none" });
  //   });
  // }
}

export function sandbox(el: HTMLDivElement, tree: FileContextTree) {
  new ContextTree(el, tree);
}
