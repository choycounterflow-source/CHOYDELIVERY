import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  details?: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let parsedMessage = error.message || "An unexpected error occurred.";
    let details: string | undefined;

    try {
      const json = JSON.parse(error.message);
      if (json && json.error) {
        parsedMessage = json.error;
        details = `Operation: ${json.operationType || "unknown"} · Path: ${json.path || "n/a"}`;
      }
    } catch {
      // Non-JSON error message
    }

    return { hasError: true, message: parsedMessage, details };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ChoyFood ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-stone-200 rounded-2xl p-8 space-y-5 shadow-sm">
            <div className="flex items-center gap-3 text-[#D12D11]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold font-display">Something interrupted ChoyFood</h2>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed">{this.state.message}</p>
            {this.state.details && (
              <p className="text-xs font-mono text-stone-500 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
                {this.state.details}
              </p>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, message: "", details: undefined });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 bg-[#D12D11] hover:bg-[#A61F09] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
