export function HealthBar({ health }: { health: number }) {
  const tone = health >= 60 ? 'good' : health >= 40 ? 'mid' : 'bad';
  return (
    <div className="hbar">
      <span className={`hbar__fill hbar__fill--${tone}`} style={{ transform: `scaleX(${Math.max(0.03, health / 100)})` }} />
    </div>
  );
}
