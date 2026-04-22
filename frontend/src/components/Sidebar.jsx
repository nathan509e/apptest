import { User, Music, Puzzle, Volume2, GraduationCap } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const navItems = [
    { icon: User, label: 'Minhas contas', active: false },
    { icon: Music, label: 'Partituras', active: true },
    { icon: Puzzle, label: 'Plugins', active: false },
    { icon: Volume2, label: 'MuseSounds', active: false },
    { icon: GraduationCap, label: 'Aprenda', active: false },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item, index) => (
          <button 
            key={index} 
            className={`sidebar-item ${item.active ? 'active' : ''}`}
          >
            <item.icon size={18} className="sidebar-icon" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
