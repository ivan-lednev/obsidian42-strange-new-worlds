import { createSignal, For } from "solid-js";
import { render } from "solid-js/web";
import {
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
} from "../types";
import { Branch } from "./branch";
import { collapseEmptyNodes } from "../collapse/collapse-empty-nodes";
import { nothing, produce } from "immer";
import { searchContextTree } from "../search/search-context-tree";
import { FilterProvider } from "./search-context";

export interface AnyTree {
  breadcrumbs?: string[];
  text: string;
  sectionsWithMatches: SectionWithMatch[];
  childLists?: ListContextTree[];
  childHeadings?: HeadingContextTree[];
}

interface TreeProps {
  fileContextTrees: AnyTree[];
}

export function Tree(props: TreeProps) {
  const [filter, setFilter] = createSignal("");

  return (
    <div class="search-results-children">
      <div class="search-input-container">
        <input
          type="search"
          spellcheck={false}
          onInput={({ currentTarget: { value } }) => setFilter(value)}
        />
      </div>
      <FilterProvider filter={filter}>
        <For each={props.fileContextTrees}>
          {(tree) => {
            // immer cannot both update a draft and return null, so this is a workaround when all the tree gets
            // filtered out.
            const ref = { tree };

            const collapsedTree = () =>
              produce(ref, (draft) => {
                if (filter()) {
                  draft.tree = searchContextTree(draft.tree, filter());
                }
                collapseEmptyNodes(draft.tree);
              });

            return <Branch contextTree={collapsedTree().tree} />;
          }}
        </For>
      </FilterProvider>
    </div>
  );
}

export function renderContextTree(
  el: HTMLDivElement,
  contextTrees: FileContextTree[]
) {
  render(() => <Tree fileContextTrees={contextTrees} />, el);
}
