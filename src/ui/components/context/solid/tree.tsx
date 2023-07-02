import { createEffect, createSignal, For } from "solid-js";
import { render } from "solid-js/web";
import {
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
} from "../types";
import { Branch } from "./branch";
import { collapseEmptyNodes } from "../collapse/collapse-empty-nodes";
import { produce } from "immer";
import { searchContextTree } from "../search/search-context-tree";
import Mark from "mark.js";

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
  let markContextRef: HTMLDivElement;

  createEffect(() => {
    const mark = new Mark(markContextRef);

    mark.unmark({
      done: () => mark.mark(filter()),
    });
  });

  return (
    <div class="search-results-children">
      <div class="search-input-container">
        <input
          type="search"
          spellcheck={false}
          onInput={({ currentTarget: { value } }) => setFilter(value)}
        />
      </div>
      <div ref={markContextRef}>
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
      </div>
    </div>
  );
}

export function renderContextTree(
  el: HTMLDivElement,
  contextTrees: FileContextTree[]
) {
  render(() => <Tree fileContextTrees={contextTrees} />, el);
}
