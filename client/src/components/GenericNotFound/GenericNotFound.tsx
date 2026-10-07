import { StatusPage } from "../StatusPage/StatusPage";
import { ButtonLink } from "../ui";

export function GenericNotFound() {
  return (
    <StatusPage
      code="404"
      title="This page doesn't exist"
      actions={<ButtonLink to="/home">Go back home</ButtonLink>}
    >
      The link may be broken, or the page may have been removed.
    </StatusPage>
  );
}
