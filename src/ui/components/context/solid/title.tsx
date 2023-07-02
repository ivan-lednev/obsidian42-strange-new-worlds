import { Index, Match, Switch } from "solid-js";

interface TitleProps {
  breadcrumbs: string[];
  type?: "list" | "heading";
}

function removeListToken(text: string) {
  return text.trim().replace(/^-\s+/, "");
}

export function Title(props: TitleProps) {
  // todo: clean this up. It can be shorter
  return (
    <Index each={props.breadcrumbs}>
      {(breadcrumb, i) => (
        <Switch fallback={<div>🗋 {breadcrumb().replace(/\.md$/, "")}</div>}>
          <Match when={props.type === "list"}>
            <div class="snw-breadcrumb-container">
              <div class="snw-breadcrumb-token">{i === 0 ? "•" : "↳"}</div>
              <div>{removeListToken(breadcrumb())}</div>
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
