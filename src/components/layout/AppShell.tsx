import Image from "next/image";
import Link from "next/link";
import { bottomTabs, moreLinks } from "@/lib/constants/navigation";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const teamResponse = await getCurrentTeam();
  const team = teamResponse.data!;
  const links = [...bottomTabs, ...moreLinks];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <Image src="/logo.jpg" alt="Pinkstorm FC" width={44} height={44} className="brand-logo" />
          <div>
            <strong>{team.name}</strong>
            <div className="muted" style={{ fontSize: 12 }}>{team.area}</div>
          </div>
        </div>
        <nav>
          {links.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              <item.icon /> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div>
        <header className="mobile-topbar">
          <Image src="/logo.jpg" alt="Pinkstorm FC" width={36} height={36} className="brand-logo" />
          <div>
            <strong>{team.name}</strong>
            <div className="muted" style={{ fontSize: 12 }}>Vai trò: Đội trưởng</div>
          </div>
        </header>
        <main className="main">{children}</main>
        <nav className="bottom-nav">
          {bottomTabs.map((item) => (
            <Link href={item.href} key={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
