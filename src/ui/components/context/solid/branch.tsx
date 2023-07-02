import { createSignal, For, Show } from "solid-js";
import { SectionWithMatch } from "../types";
import { MarkdownRenderer } from "obsidian";
import { CollapseIcon } from "./collapse-icon";
import { Title } from "./title";
import { AnyTree } from "./tree";
import { useFilterContext } from "./search-context";

interface MatchSectionProps {
  sectionsWithMatches: SectionWithMatch[];
}

function MatchSection(props: MatchSectionProps) {
  const filter = useFilterContext();

  const addHighlight = (text: string) => {
    if (filter().length === 0) {
      return text;
    }

    const filterStart = text.indexOf(filter());

    if (filterStart === -1) {
      return text;
    }

    const filterEnd = filterStart + filter().length;

    const before = text.substring(0, filterStart);
    const after = text.substring(filterEnd);

    return `${before}==${filter()}==${after}`;
  };

  return (
    <Show when={props.sectionsWithMatches.length > 0}>
      <div class="search-result-file-matches snw-ref-item-collection-items">
        <For each={props.sectionsWithMatches}>
          {(section) => (
            <div
              // @ts-ignore
              uic="uic"
              class="search-result-file-match snw-ref-item-info"
              ref={async (el) =>
                await MarkdownRenderer.renderMarkdown(
                  addHighlight(section.text),
                  el,
                  "/",
                  // @ts-ignore
                  window.thePlugin
                )
              }
            />
          )}
        </For>
      </div>
    </Show>
  );
}

interface BranchProps {
  contextTree: AnyTree;
  type?: "list" | "heading";
}

export function Branch(props: BranchProps) {
  const [childrenShown, setChildrenShown] = createSignal(true);

  const breadcrumbs = props.contextTree.breadcrumbs
    ? [...props.contextTree.breadcrumbs, props.contextTree.text]
    : [props.contextTree.text];

  return (
    <div class="tree-item search-result snw-ref-item-container">
      <div class="tree-item-self search-result-file-title is-clickable">
        <div
          class={`tree-item-icon collapse-icon ${
            childrenShown() ? "" : "is-collapsed"
          }`}
          onClick={() => setChildrenShown(!childrenShown())}
        >
          <CollapseIcon />
        </div>
        <div class="tree-item-inner">
          <Title breadcrumbs={breadcrumbs} type={props.type} />
        </div>
      </div>
      <Show when={childrenShown()}>
        <div class="snw-tree-item-children">
          <MatchSection
            sectionsWithMatches={props.contextTree.sectionsWithMatches}
          />
          <For each={props.contextTree.childLists}>
            {(list) => <Branch contextTree={list} type="list" />}
          </For>
          <For each={props.contextTree.childHeadings}>
            {(list) => <Branch contextTree={list} type="heading" />}
          </For>
        </div>
      </Show>
    </div>
  );
}
