import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { IoSearch } from "react-icons/io5";
import { useSearch } from "../../queries";
import { PersonRow, useDismiss } from "../ui";
import styles from "./Navbar.module.scss";

// the value once it stops changing for a moment, to search while typing
function useDebounced(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLFormElement>(open, () => setOpen(false));
  const { data: results = [], isFetching } = useSearch(
    useDebounced(query.trim(), 250)
  );

  const close = () => {
    setQuery("");
    setOpen(false);
  };

  // enter opens the page with every result
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() === "") return;
    navigate(`/searchPage?q=${encodeURIComponent(query.trim())}`);
    close();
  };

  return (
    <form ref={ref} role="search" className={styles.search} onSubmit={onSubmit}>
      <IoSearch className={styles.searchIcon} aria-hidden="true" />
      <input
        id="search"
        type="search"
        placeholder="Search Odinbook"
        aria-label="Search people"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim() !== "" && (
        <div className={styles.panel} data-cy="search-results">
          {results.length > 0 ? (
            results.map((person) => (
              <div key={person.id} onClick={close}>
                <PersonRow person={person} size="sm" />
              </div>
            ))
          ) : (
            <p className={styles.panelEmpty}>
              {isFetching ? "Searching..." : "No people found"}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
