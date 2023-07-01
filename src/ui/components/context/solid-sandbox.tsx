import { createSignal, For, Index, Match, Show, Switch } from "solid-js";
import { render } from "solid-js/web";
import {
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
} from "./types";
import { MarkdownRenderer } from "obsidian";

export interface AnyTree {
  breadcrumbs?: string[];
  text: string;
  sectionsWithMatches: SectionWithMatch[];
  childLists?: ListContextTree[];
  childHeadings?: HeadingContextTree[];
}

function CollapseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="svg-icon right-triangle"
    >
      <path d="M3 8L12 17L21 8"></path>
    </svg>
  );
}

interface TitleProps {
  breadcrumbs: string[];
  type?: "list" | "heading";
}

function Title(props: TitleProps) {
  return (
    <Index each={props.breadcrumbs}>
      {(breadcrumb, i) => (
        <Switch fallback={<div>🗋 {breadcrumb()}</div>}>
          <Match when={props.type === "list"}>
            <div class="snw-breadcrumb-container">
              <div class="snw-breadcrumb-token">{i === 0 ? "•" : "↳"}</div>
              <div>{breadcrumb().trim().replace(/^-\s+/, "")}</div>
            </div>
          </Match>
          <Match when={props.type === "heading"}>
            <div class="snw-breadcrumb-container">
              <div class="snw-breadcrumb-token">{i === 0 ? "§" : "↳"}</div>
              <div>{breadcrumb()}</div>
            </div>
          </Match>
        </Switch>
      )}
    </Index>
  );
}

interface MatchSectionProps {
  sectionsWithMatches: SectionWithMatch[];
}

function MatchSection(props: MatchSectionProps) {
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
                  section.text,
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

function Branch(props: BranchProps) {
  const breadcrumbs = props.contextTree.breadcrumbs
    ? [...props.contextTree.breadcrumbs, props.contextTree.text]
    : [props.contextTree.text];

  return (
    <div class="tree-item search-result snw-ref-item-container">
      <div class="tree-item-self search-result-file-title is-clickable">
        <div class="tree-item-icon collapse-icon">
          <CollapseIcon />
        </div>
        <div class="tree-item-inner">
          <Title breadcrumbs={breadcrumbs} type={props.type} />
        </div>
      </div>
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
    </div>
  );
}

export function renderContextTree(
  el: HTMLDivElement,
  contextTree: FileContextTree
) {
  render(() => <Branch contextTree={contextTree} />, el);
}
