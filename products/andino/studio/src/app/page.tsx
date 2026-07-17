import Link from "next/link";
import { mockMissions } from "@/lib/mock-data";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const stats = [
  { label: "Missions Flown", value: "47" },
  { label: "Designs Evolved", value: "1,284" },
  { label: "Flight Hours", value: "312" },
  { label: "AI Iterations", value: "9,847" },
];

const statusVariant: Record<string, 'success' | 'accent' | 'warning' | 'error'> = {
  planning: 'warning',
  in_flight: 'accent',
  completed: 'success',
  failed: 'error',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <section className="mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold text-text-primary mb-2 tracking-tight">
          Andino Studio
        </h1>
        <p className="text-lg text-text-secondary mb-1">
          Command Center for Drone Evolution
        </p>
        <p className="text-sm text-text-muted max-w-xl">
          Design, simulate, and evolve custom drone platforms for high-altitude
          mining operations in the Andes.
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => (
          <Card key={s.label} hover className="p-5 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="text-2xl font-bold font-mono text-accent-400 glow-text">
              {s.value}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wider mt-2">
              {s.label}
            </div>
          </Card>
        ))}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Recent Missions - 2 cols */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            Recent Missions
          </h2>
          <div className="space-y-2">
            {mockMissions.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-bg-elevated/50 hover:bg-bg-elevated transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-text-muted">{m.id}</span>
                  <span className="text-sm text-text-primary">{m.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={statusVariant[m.status]}>
                    {m.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-text-muted">{formatDate(m.startedAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/flight"
            className="inline-block mt-4 text-sm text-accent-400 hover:text-accent-500 transition-colors"
          >
            View All Missions →
          </Link>
        </Card>

        {/* System Status - 1 col */}
        <Card className="p-5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            System Status
          </h2>

          {/* Evolution Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Evolution Progress</span>
              <span className="text-sm font-mono text-accent-400">71%</span>
            </div>
            <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-full transition-all duration-500"
                style={{ width: "71%" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-text-muted">
              <span>Gen 142 / 200</span>
              <span>Fitness: 0.847</span>
            </div>
          </div>

          {/* Status Items */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-bg-elevated rounded-lg">
              <div className="text-lg font-bold font-mono text-accent-400">3</div>
              <div className="text-xs text-text-muted">Active</div>
            </div>
            <div className="text-center p-3 bg-bg-elevated rounded-lg">
              <div className="text-lg font-bold font-mono text-warning">2</div>
              <div className="text-xs text-text-muted">Queue</div>
            </div>
            <div className="text-center p-3 bg-bg-elevated rounded-lg">
              <div className="text-lg font-bold font-mono text-success">0</div>
              <div className="text-xs text-text-muted">Errors</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4">
        <Link href="/design">
          <Button variant="primary" icon={<span>◇</span>}>
            New Design
          </Button>
        </Link>
        <Link href="/flight">
          <Button variant="secondary" icon={<span>▶</span>}>
            Flight Dashboard
          </Button>
        </Link>
        <Link href="/agent">
          <Button variant="secondary" icon={<span>◆</span>}>
            AI Agent
          </Button>
        </Link>
      </section>
    </div>
  );
}
