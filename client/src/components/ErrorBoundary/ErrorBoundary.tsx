import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { StatusPage } from "../StatusPage/StatusPage";
import { Button } from "../ui";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// a crash while rendering shows this page instead of a blank screen
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    // outside the router, so plain navigation instead of links
    return (
      <StatusPage
        role="alert"
        title="Something went wrong"
        actions={
          <>
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button
              variant="secondary"
              onClick={() => window.location.assign("/home")}
            >
              Go back home
            </Button>
          </>
        }
      >
        Try again, or go back to the home page.
      </StatusPage>
    );
  }
}
