import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';   // <— EXACTO

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header style={{ background:'linear-gradient(90deg,#1e3a8a,#2563eb)', color:'#fff' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontWeight:600, fontSize:18 }}>Proyecto Alianza</div>
        <nav style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Link to="/inventario" style={{ color:'#fff', textDecoration:'underline' }}>Inventario</Link>
          <span>Sesión: <b>{user?.username}</b></span>
          <button onClick={()=>{logout(); nav('/login',{replace:true})}}
                  style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.25)', padding:'6px 12px', borderRadius:10, cursor:'pointer' }}>
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}

