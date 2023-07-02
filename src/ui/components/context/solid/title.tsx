import { Index, Match, Switch } from "solid-js";
import { useFilterContext } from "./search-context";

interface TitleProps {
  breadcrumbs: string[];
  type?: "list" | "heading";
}

function removeListToken(text: string) {
  return text.trim().replace(/^-\s+/, "");
}

export function Title(props: TitleProps) {
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

    return (
      <>
        <span>{before}</span>
        <span class="search-result-file-matched-text">{filter()}</span>
        <span>{after}</span>
      </>
    );
  };

  // todo: clean this up. It can be shorter
  return (
    <Index each={props.breadcrumbs}>
      {(breadcrumb, i) => (
        <Switch fallback={<div>🗋 {addHighlight(breadcrumb())}</div>}>
          <Match when={props.type === "list"}>
            <div class="snw-breadcrumb-container">
              <div class="snw-breadcrumb-token">{i === 0 ? "•" : "↳"}</div>
              <div>{addHighlight(removeListToken(breadcrumb()))}</div>
            </div>
          </Match>
          <Match when={props.type === "heading"}>
            <div class="snw-breadcrumb-container">
              <div class="snw-breadcrumb-token">{i === 0 ? "§" : "↳"}</div>
              <div>{addHighlight(breadcrumb())}</div>
            </div>
          </Match>
        </Switch>
      )}
    </Index>
  );
}
