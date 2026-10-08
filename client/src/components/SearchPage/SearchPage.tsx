import { useSearchParams } from "react-router";
import Skeleton from "react-loading-skeleton";
import { BsSearch } from "react-icons/bs";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { Card, EmptyState, PersonRow } from "../ui";
import { useSearch } from "../../queries";
import styles from "./SearchPage.module.scss";

// the search is in the url (/searchPage?q=...), so it survives a refresh
export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const { data: results, isLoading } = useSearch(q);

  return (
    <PageLayout title={q ? `Search: ${q}` : "Search"} aside={<SideMenu />}>
      <Card title={q ? `Results for "${q}"` : "Search"}>
        {!q ? (
          <EmptyState icon={<BsSearch />} title="Search for people">
            Type a name in the search box at the top
          </EmptyState>
        ) : isLoading ? (
          <Skeleton height={48} count={3} style={{ marginBottom: 8 }} />
        ) : results && results.length > 0 ? (
          <ul className={styles.list}>
            {results.map((user) => (
              <li key={user.id} data-cy="search-result">
                <PersonRow person={user} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<BsSearch />} title="No users found">
            Check the spelling or try another name
          </EmptyState>
        )}
      </Card>
    </PageLayout>
  );
}
