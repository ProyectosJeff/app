// frontend/src/components/Footer.jsx
import React from "react";

export default function Footer(){
  const y = new Date().getFullYear();
  return (
    <footer style={{
      marginTop: 24, padding: "12px 0",
      background: "rgba(0,0,0,.18)", backdropFilter: "blur(2px)"
    }}>
      <div className="container" style={{textAlign:"center", color:"#dbeafe", fontSize:12}}>
        © {y} — Elaborado por <b>TECDEIN EIRL</b>
      </div>
    </footer>
  );
}
