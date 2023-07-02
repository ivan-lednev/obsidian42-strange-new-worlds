import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import {
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
} from "../types";
import { Branch } from "./branch";
import { collapseEmptyNodes } from "../collapse-empty-nodes";
import { produce } from "immer";
import { searchContextTree } from "../search-context-tree";
import { FilterProvider } from "./search-context";

export interface AnyTree {
  breadcrumbs?: string[];
  text: string;
  sectionsWithMatches: SectionWithMatch[];
  childLists?: ListContextTree[];
  childHeadings?: HeadingContextTree[];
}

interface TreeProps {
  contextTree: AnyTree;
}

export function Tree(props: TreeProps) {
  const [filter, setFilter] = createSignal("");

  const collapsedTree = () =>
    produce(props.contextTree, (draft) => {
      if (filter()) {
        draft = searchContextTree(draft, filter());
      }
      collapseEmptyNodes(draft);
    });

  return (
    <>
      <div class="search-input-container">
        <input
          type="search"
          spellcheck={false}
          onInput={({ currentTarget: { value } }) => setFilter(value)}
        />
      </div>
      <FilterProvider filter={filter}>
        <Branch contextTree={collapsedTree()} />
      </FilterProvider>
    </>
  );
}

export function renderContextTree(
  el: HTMLDivElement,
  contextTree: FileContextTree
) {
  render(() => <Tree contextTree={contextTree} />, el);
}
