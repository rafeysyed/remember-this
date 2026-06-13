import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `flex-1 rounded-xl px-4 py-2 text-center text-sm font-medium transition ${
    isActive
      ? "bg-white text-foreground shadow-sm"
      : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
  }`;

export default function Navbar() {
  return (
    <header className="bg-background/95 px-6 pb-3 pt-10 sm:pt-12">
      <nav className="mx-auto flex w-full max-w-[560px] justify-center">
        <div className="grid w-full max-w-[260px] grid-cols-2 gap-1 rounded-2xl border bg-muted p-1">
          <NavLink to="/" className={linkClass}>
            Log
          </NavLink>
          <NavLink to="/memories" className={linkClass}>
            Memories
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
