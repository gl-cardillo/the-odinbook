import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import homePic from "../../images/home-pic.png";

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
    return (
      <div className="not-found-page" role="alert">
        <img src={homePic} alt="logo" />
        <h1>Something went wrong :(</h1>
        <p>Try again, or go back to the home page.</p>
        <button onClick={() => window.location.reload()}>Try again</button>
        <a href="/home">Go back home!</a>
      </div>
    );
  }
}
