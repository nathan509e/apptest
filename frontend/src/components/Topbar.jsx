import './Topbar.css';

export default function Topbar() {
  return (
    <header className="topbar">
      <nav className="topbar-nav">
        <button className="topbar-item active">Início</button>
        <button className="topbar-item">Partitura</button>
        <button className="topbar-item">Publicar</button>
      </nav>
    </header>
  );
}
