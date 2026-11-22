import type { Mood } from '../../lib/pet';

interface Props {
  mood: Mood;
  health: number;
  stage: number;
  sleeping?: boolean;
  petting?: boolean;
  bowlFull?: boolean;
  size?: number;
}

const FAT: Record<Mood, number> = { radiante: 1.06, sano: 1, cansado: 0.94, enfermo: 0.84, desnutrido: 0.7 };
const SCALE = [0.72, 0.86, 1, 1.04];

/** Gato dibujado en SVG: el aspecto cambia con la salud, la etapa y el estado. */
export function Cat({ mood, health, stage, sleeping, petting, bowlFull, size = 200 }: Props) {
  const fat = FAT[mood];
  const sick = mood === 'enfermo' || mood === 'desnutrido';
  // Pelo naranja atigrado que pierde color al enfermar.
  const h = Math.max(0, Math.min(100, health)) / 100;
  const sat = Math.round(18 + 62 * h);
  const fur = `hsl(28 ${sat}% ${58 + (1 - h) * 6}%)`;
  const stripe = `hsl(24 ${Math.round(sat * 0.9)}% ${40 + (1 - h) * 10}%)`;
  const belly = `hsl(36 ${Math.round(sat * 0.6)}% ${86 - (1 - h) * 6}%)`;
  const ink = '#2a1d14';
  const s = SCALE[stage] ?? 1;
  const headScale = stage === 0 ? 1.14 : 1;
  const eyes = sleeping ? 'sleep' : petting || mood === 'radiante' ? 'happy' : mood === 'sano' ? 'normal' : mood === 'cansado' ? 'tired' : mood === 'enfermo' ? 'sick' : 'sad';
  const mouth = sleeping ? 'flat' : petting || mood === 'radiante' || mood === 'sano' ? 'smile' : mood === 'cansado' ? 'flat' : 'frown';
  const earDrop = sick ? 24 : mood === 'cansado' ? 10 : 0;

  const eye = (x: number) => {
    switch (eyes) {
      case 'happy':
        return <path d={`M${x - 6} 0 Q${x} -7 ${x + 6} 0`} stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
      case 'sleep':
        return <path d={`M${x - 6} -1 Q${x} 4 ${x + 6} -1`} stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" />;
      case 'tired':
        return (
          <g>
            <ellipse cx={x} cy={1} rx={5.5} ry={5} fill={ink} />
            <path d={`M${x - 7} -2 L${x + 7} -2`} stroke={fur} strokeWidth={6} />
            <path d={`M${x - 7} -1 L${x + 7} -1`} stroke={ink} strokeWidth={2} strokeLinecap="round" />
          </g>
        );
      case 'sick':
        return (
          <g stroke={ink} strokeWidth={3} strokeLinecap="round">
            <path d={`M${x - 5} -5 L${x + 5} 5`} />
            <path d={`M${x + 5} -5 L${x - 5} 5`} />
          </g>
        );
      case 'sad':
        return (
          <g>
            <ellipse cx={x} cy={2} rx={4.5} ry={5.5} fill={ink} />
            <path d={x < 0 ? `M${x - 7} -8 L${x + 5} -5` : `M${x + 7} -8 L${x - 5} -5`} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          </g>
        );
      default:
        return (
          <g className="cat-eye">
            <ellipse cx={x} cy={0} rx={6} ry={8} fill={ink} />
            <circle cx={x + 2} cy={-3} r={2.2} fill="#fff" />
          </g>
        );
    }
  };

  return (
    <svg
      className={`cat cat--${mood} ${sleeping ? 'is-sleeping' : ''} ${petting ? 'is-petting' : ''}`}
      width={size}
      height={size * 0.9}
      viewBox="0 0 220 198"
      role="img"
      aria-label={`Gato ${mood}`}
    >
      <ellipse cx={110} cy={186} rx={66 * s} ry={8} fill="rgba(0,0,0,0.35)" />
      {/* Cuenco de comida */}
      <g transform="translate(176 186)">
        {bowlFull && (
          <g fill="#b5733a">
            <circle cx={-8} cy={-15} r={4} />
            <circle cx={0} cy={-17} r={4.5} />
            <circle cx={8} cy={-15} r={4} />
            <circle cx={-3} cy={-13} r={4} />
            <circle cx={5} cy={-12} r={4} />
          </g>
        )}
        <path d="M-20 -14 L20 -14 L15 0 L-15 0 Z" fill={bowlFull ? '#3a86ec' : '#5b6170'} />
        <rect x={-21} y={-16} width={42} height={4} rx={2} fill={bowlFull ? '#5fa0f5' : '#787f8f'} />
      </g>

      <g transform={`translate(104 186) scale(${s})`}>
        <g className="cat-bounce">
          {/* Cola */}
          <path className="cat-tail" d="M36 -20 C 76 -26 84 -66 62 -90" stroke={fur} strokeWidth={13} fill="none" strokeLinecap="round" />
          <path className="cat-tail" d="M66 -50 C 70 -60 70 -70 66 -78" stroke={stripe} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
          {/* Cuerpo */}
          <g className="cat-body">
            <ellipse cx={0} cy={-38} rx={46 * fat} ry={38} fill={fur} />
            <ellipse cx={0} cy={-28} rx={27 * fat} ry={24} fill={belly} />
            <path d={`M${-40 * fat} -52 q8 4 6 12 M${-44 * fat} -36 q8 3 6 11 M${40 * fat} -52 q-8 4 -6 12 M${44 * fat} -36 q-8 3 -6 11`} stroke={stripe} strokeWidth={4} fill="none" strokeLinecap="round" />
            {mood === 'desnutrido' && (
              <g stroke={stripe} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.8}>
                <path d="M-14 -46 q-8 6 -10 16 M-12 -36 q-7 5 -9 13 M14 -46 q8 6 10 16 M12 -36 q7 5 9 13" />
              </g>
            )}
            <ellipse cx={-17} cy={-5} rx={13} ry={8} fill={fur} />
            <ellipse cx={17} cy={-5} rx={13} ry={8} fill={fur} />
            <path d="M-22 -4 v3 M-17 -3 v3 M-12 -4 v3 M12 -4 v3 M17 -3 v3 M22 -4 v3" stroke={stripe} strokeWidth={1.6} strokeLinecap="round" />
          </g>
          {/* Cabeza */}
          <g transform={`translate(0 -92) scale(${headScale})`}>
            <g transform={`rotate(${-earDrop} -20 -26)`}>
              <path d="M-36 -16 L-30 -54 L-6 -36 Z" fill={fur} />
              <path d="M-30 -22 L-27 -45 L-13 -34 Z" fill="#f2a5b5" />
            </g>
            <g transform={`rotate(${earDrop} 20 -26)`}>
              <path d="M36 -16 L30 -54 L6 -36 Z" fill={fur} />
              <path d="M30 -22 L27 -45 L13 -34 Z" fill="#f2a5b5" />
            </g>
            <ellipse cx={0} cy={0} rx={42} ry={38} fill={fur} />
            <path d="M-8 -36 v9 M0 -38 v11 M8 -36 v9" stroke={stripe} strokeWidth={4} strokeLinecap="round" />
            <ellipse cx={0} cy={14} rx={20} ry={13} fill={belly} />
            {(mood === 'radiante' || mood === 'sano' || petting) && !sleeping && (
              <g fill="#ff8fa8" opacity={0.55}>
                <ellipse cx={-25} cy={10} rx={7} ry={4.5} />
                <ellipse cx={25} cy={10} rx={7} ry={4.5} />
              </g>
            )}
            <g className="cat-eyes" transform="translate(0 -4)">
              {eye(-15)}
              {eye(15)}
            </g>
            {mood === 'desnutrido' && !sleeping && <path d="M-17 4 q-2 5 0 8 q2 -3 0 -8" fill="#7cc7ff" />}
            <path d="M-4 7 L4 7 L0 12 Z" fill="#e8798f" />
            {mouth === 'smile' && <path d="M-8 14 Q-4 19 0 14 Q4 19 8 14" stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />}
            {mouth === 'flat' && <path d="M-5 16 L5 16" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />}
            {mouth === 'frown' && <path d="M-7 19 Q0 13 7 19" stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />}
            <g stroke={ink} strokeWidth={1.3} strokeLinecap="round" opacity={0.6}>
              <path d="M-14 11 L-38 6 M-14 14 L-38 15 M14 11 L38 6 M14 14 L38 15" />
            </g>
            {mood === 'enfermo' && !sleeping && (
              <g>
                <path d="M6 16 L30 26" stroke="#e5e5ea" strokeWidth={4} strokeLinecap="round" />
                <circle cx={31} cy={27} r={4} fill="#ff453a" />
              </g>
            )}
            {mood === 'cansado' && !sleeping && <path d="M33 -18 q-4 7 0 10 q4 -3 0 -10" fill="#7cc7ff" />}
            {stage === 3 && (
              <path d="M-20 -36 L-16 -54 L-7 -43 L0 -58 L7 -43 L16 -54 L20 -36 Z" fill="#ffd60a" stroke="#c9a000" strokeWidth={1.5} strokeLinejoin="round" />
            )}
          </g>
          {/* Collar (adulto y leyenda), por encima de la barbilla */}
          {stage >= 2 && (
            <g>
              <path d={`M${-22 * fat} -57 Q0 -47 ${22 * fat} -57`} stroke="#e2457a" strokeWidth={6} fill="none" strokeLinecap="round" />
              <circle cx={0} cy={-48} r={5} fill="#ffd60a" stroke="#b8920a" strokeWidth={1.5} />
            </g>
          )}
        </g>
      </g>

      {mood === 'radiante' && !sleeping && (
        <g className="cat-sparkles" fill="#ffd60a">
          <path d="M40 40 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" />
          <path d="M178 58 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" />
          <path d="M30 110 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" />
        </g>
      )}
      {sleeping && (
        <g className="cat-zzz" fill="#9a9aa1" fontWeight={800}>
          <text x={150} y={58} fontSize={18}>
            z
          </text>
          <text x={164} y={42} fontSize={14}>
            z
          </text>
          <text x={175} y={30} fontSize={11}>
            z
          </text>
        </g>
      )}
      {petting && (
        <g className="cat-hearts" fill="#ff5c8a">
          <path d="M80 60 c-6 -8 -18 -2 -12 8 l12 10 l12 -10 c6 -10 -6 -16 -12 -8z" />
          <path d="M138 50 c-4 -6 -13 -1 -9 6 l9 8 l9 -8 c4 -7 -5 -12 -9 -6z" />
        </g>
      )}
    </svg>
  );
}
