import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error: null, info: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ this.setState({ info }); }

  render(){
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        padding: 16, margin: 16, borderRadius: 12, background: "#2b2b2b",
        color: "#fff", fontFamily: "ui-sans-serif, system-ui", lineHeight: 1.4
      }}>
        <h2 style={{marginTop:0}}>💥 Se produjo un error en la app</h2>
        <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.error?.stack || this.state.error)}</pre>
        {this.state.info?.componentStack && (
          <>
            <h3>Component stack</h3>
            <pre style={{whiteSpace:"pre-wrap"}}>{this.state.info.componentStack}</pre>
          </>
        )}
      </div>
    );
  }
}
