import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Muestra el error real en consola del navegador
    console.error("App crashed:", error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{
          minHeight: "100vh",
          padding: "16px",
          color: "#e2e8f0",
          background: "#0f172a"
        }}>
          <h2 style={{ margin: 0 }}>Se produjo un error en la app</h2>
          <div style={{
            marginTop: 12,
            padding: 12,
            background: "#111827",
            borderRadius: 8,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            whiteSpace: "pre-wrap",
            overflow: "auto"
          }}>
            {String(error?.message || error)}
          </div>
          <button
            onClick={() => location.reload()}
            style={{
              marginTop: 16,
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
