import { JSX, createContext, useContext, Accessor } from "solid-js";

const FilterContext = createContext<Accessor<string>>();

interface FilterProviderProps {
  children: JSX.Element;
  filter: Accessor<string>;
}

export function FilterProvider(props: FilterProviderProps) {
  return (
    <FilterContext.Provider value={props.filter}>
      {props.children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  return useContext(FilterContext);
}
