import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `flex-1 rounded-xl px-3 py-1.5 text-center text-sm font-medium transition ${isActive
    ? "bg-white text-foreground shadow-sm"
    : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
  }`;

export default function Navbar() {
  return (
    <header className="bg-background/95 px-6 pb-3 pt-10 sm:px-10 sm:pt-12">
      <nav className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-center sm:gap-0">
        {/* Left Side: Logo and Site Name */}
        <div className="flex items-center">
          <img
            src="/re.svg"
            alt="Remember This Logo"
            className="h-[38px] w-auto object-contain"
          />
          <div className="ml-2.5 flex flex-col justify-center gap-[1px] h-[38px]">
            <span className="text-[18px] font-semibold leading-none text-foreground tracking-tight">
              Remember
            </span>
            <span className="text-[18px] font-semibold leading-none text-foreground tracking-tight">
              This.
            </span>
          </div>
        </div>

        {/* Right Side: Log / Memories Toggle */}
        <div className="grid w-full max-w-[200px] grid-cols-2 gap-1 rounded-2xl border bg-muted p-1">
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
