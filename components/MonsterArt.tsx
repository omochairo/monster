import React, { useId } from 'react';

export interface MonsterArtProps {
  seed: string;
  bodyIndex: number;
  elementId: string;
  form?: 1 | 2 | 3;
  shiny?: boolean;
  silhouette?: boolean;
  className?: string;
  title?: string;
}

type Palette = { body: string; shade: string; cheek: string; belly: string; accent: string };

const palettes: Record<string, Palette> = {
  fire: { body: '#ff895e', shade: '#d95045', cheek: '#ffb19a', belly: '#ffd2a5', accent: '#ffbd4a' },
  water: { body: '#69c7e8', shade: '#348bbd', cheek: '#ff9eaa', belly: '#d5f5ff', accent: '#8ae8f2' },
  grass: { body: '#8bd577', shade: '#4a9b5b', cheek: '#ffaaa0', belly: '#e0f2ae', accent: '#b9e66b' },
  electric: { body: '#f5d65e', shade: '#d79a35', cheek: '#ff8b89', belly: '#fff2b6', accent: '#fff16b' },
  ice: { body: '#a5e5f2', shade: '#64aaca', cheek: '#ffb2c5', belly: '#e8fcff', accent: '#d0f8ff' },
  wind: { body: '#9addbf', shade: '#5eaa91', cheek: '#ffa9a1', belly: '#e5f8c8', accent: '#c1f1a1' },
  light: { body: '#ffe19a', shade: '#d9ad58', cheek: '#ff9e9d', belly: '#fff5d5', accent: '#fff4a1' },
  dark: { body: '#9084bd', shade: '#554b83', cheek: '#d58aa9', belly: '#c9c1e4', accent: '#b7a7df' },
};

// いろちがい: each element gets its own surprising colour set.
const shinyPalettes: Record<string, Palette> = {
  fire: { body: '#7fd0ff', shade: '#3f86c9', cheek: '#ffb19a', belly: '#e6f6ff', accent: '#ffe066' },
  water: { body: '#ffb36b', shade: '#d9783a', cheek: '#ff9eaa', belly: '#fff0d9', accent: '#ffe066' },
  grass: { body: '#f39ad0', shade: '#b8579a', cheek: '#ffd0e6', belly: '#ffe9f5', accent: '#fff1a8' },
  electric: { body: '#b896ff', shade: '#7656c9', cheek: '#ff8b89', belly: '#eee4ff', accent: '#fff16b' },
  ice: { body: '#ffd37a', shade: '#d39a3c', cheek: '#ffb2c5', belly: '#fff7df', accent: '#ffffff' },
  wind: { body: '#ff9ea6', shade: '#cf5b6c', cheek: '#ffd5d1', belly: '#ffeef0', accent: '#fff1a8' },
  light: { body: '#c9c9d6', shade: '#8a8aa3', cheek: '#ff9e9d', belly: '#f4f4fa', accent: '#fff4a1' },
  dark: { body: '#3c3c4a', shade: '#1d1d26', cheek: '#e05a8a', belly: '#6d6d80', accent: '#ffd84d' },
};

const choices = <T,>(seed: string, values: T[], salt: number): T => {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h ^= h >>> 16;
  return values[(h >>> 0) % values.length];
};

type ShapeProps = { color: string; shade: string; accent: string; silhouette: boolean; form: 1 | 2 | 3 };
const outline = (p: ShapeProps) => ({ fill: p.color, stroke: p.silhouette ? 'none' : p.shade, strokeWidth: 4, strokeLinejoin: 'round' as const });
const blobShape = (p: ShapeProps) => <g>
  <path d="M100 34 C133 35 152 56 151 91 Q151 117 167 143 Q153 153 140 145 Q128 164 113 151 Q99 166 84 151 Q67 164 58 145 Q44 153 33 143 Q49 116 49 91 C48 56 67 35 100 34Z" {...outline(p)}/>
  <path d="M100 39 Q91 29 100 18 Q109 29 100 39Z" {...outline(p)}/>
</g>;
const beastShape = (p: ShapeProps) => <g>
  <path d="M56 119 Q31 105 18 123 Q25 146 57 143 Q62 165 77 164 L83 148 L117 148 L123 164 Q139 165 143 143 Q174 147 183 123 Q168 102 145 119Z" {...outline(p)}/>
  <path d="M58 67 L39 29 Q37 19 50 27 L78 50 Q100 40 122 50 L150 27 Q163 19 161 29 L142 67 Q159 84 154 123 Q150 151 100 153 Q50 151 46 123 Q41 84 58 67Z" {...outline(p)}/>
  <path d="M53 137 Q37 144 30 158 M77 147 L73 165 M123 147 L127 165 M147 137 Q163 144 170 158" fill="none" stroke={p.silhouette ? p.color : p.shade} strokeWidth="12" strokeLinecap="round"/>
</g>;
const birdShape = (p: ShapeProps) => <g>
  <path d="M68 80 Q43 47 12 57 L26 75 L8 80 L30 94 L12 101 L42 113 Q43 142 65 146Z M132 80 Q157 47 188 57 L174 75 L192 80 L170 94 L188 101 L158 113 Q157 142 135 146Z" {...outline(p)}/>
  <path d="M100 42 Q87 29 93 19 Q101 25 102 33 Q111 18 119 22 Q119 36 108 43Z M100 49 Q134 42 146 69 L140 126 Q129 150 100 151 Q71 150 60 126 L54 69 Q66 42 100 49Z" {...outline(p)}/>
  <path d="M87 99 L100 111 L113 99 L100 119Z" {...outline(p)}/>
  <path d="M87 147 L84 169 M113 147 L116 169" fill="none" stroke={p.silhouette ? p.color : p.shade} strokeWidth="5" strokeLinecap="round"/>
</g>;
const dragonShape = (p: ShapeProps) => <g>
  <path d="M63 79 L42 52 L44 92 L17 71 L34 112 Q39 144 67 147 L74 160 L89 148 L100 164 L111 148 L127 160 L134 145 Q162 137 166 111 L183 71 L156 92 L158 52 L137 79Z" {...outline(p)}/>
  <path d="M61 89 Q39 45 14 54 L31 80 L12 79 L38 110 Q47 120 62 119Z M139 89 Q161 45 186 54 L169 80 L188 79 L162 110 Q153 120 138 119Z" {...outline(p)}/>
  <path d="M57 67 L48 35 L78 53 Q100 44 122 53 L152 35 L143 67 L150 115 Q144 148 100 151 Q56 148 50 115Z M139 133 Q165 145 175 158 L187 151 L181 171 Q157 167 132 153Z" {...outline(p)}/>
  <path d="M67 143 L63 165 Q72 170 86 165 L89 147 M111 147 L114 165 Q128 170 137 165 L133 143" {...outline(p)}/>
</g>;
const bugShape = (p: ShapeProps) => <g>
  <path d="M79 79 Q58 50 45 31 M121 79 Q142 50 155 31" fill="none" stroke={p.silhouette ? p.color : p.shade} strokeWidth="5" strokeLinecap="round"/>
  <circle cx="45" cy="31" r="6" fill={p.color} stroke={p.silhouette ? 'none' : p.shade} strokeWidth="3"/><circle cx="155" cy="31" r="6" fill={p.color} stroke={p.silhouette ? 'none' : p.shade} strokeWidth="3"/>
  <path d="M68 105 Q48 89 34 102 L55 119 L35 128 L64 137 M75 124 Q50 119 40 139 L69 143 L51 158 L80 153 M132 105 Q152 89 166 102 L145 119 L165 128 L136 137 M125 124 Q150 119 160 139 L131 143 L149 158 L120 153" fill="none" stroke={p.silhouette ? p.color : p.shade} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
  <ellipse cx="100" cy="131" rx="28" ry="27" {...outline(p)}/><ellipse cx="100" cy="91" rx="35" ry="30" {...outline(p)}/><circle cx="100" cy="57" r="23" {...outline(p)}/>
  <path d="M100 69 L100 155" stroke={p.silhouette ? p.color : p.shade} strokeWidth="3"/>
  {!p.silhouette && <path d="M100 104 Q75 86 69 110 Q73 132 100 143 Q127 132 131 110 Q125 86 100 104Z" fill={p.accent} opacity=".85"/>}
</g>;
const ghostShape = (p: ShapeProps) => <g opacity={p.silhouette ? 1 : .85}>
  <ellipse cx="100" cy="182" rx="30" ry="5" fill={p.silhouette ? p.color : p.shade} opacity=".45"/>
  <path d="M55 142 Q39 130 34 143 Q44 157 61 153 M145 142 Q161 130 166 143 Q156 157 139 153" {...outline(p)}/>
  <path d="M100 36 C65 36 48 64 50 105 L43 145 Q54 151 66 139 Q78 153 91 140 Q103 154 116 140 Q130 153 141 139 Q153 151 161 145 L150 105 C152 64 135 36 100 36Z" {...outline(p)}/>
</g>;
const shapeParts = [blobShape, beastShape, birdShape, dragonShape, bugShape, ghostShape];

const eyeShapes = [
  <><ellipse cx="79" cy="91" rx="7" ry="10"/><ellipse cx="121" cy="91" rx="7" ry="10"/></>,
  <><path d="M70 94 Q79 82 88 94"/><path d="M112 94 Q121 82 130 94"/></>,
  <><path d="M79 79 L82 87 L91 88 L84 94 L86 103 L79 98 L72 103 L74 94 L67 88 L76 87Z"/><path d="M121 79 L124 87 L133 88 L126 94 L128 103 L121 98 L114 103 L116 94 L109 88 L118 87Z"/></>,
  <><path d="M70 91 Q79 97 88 91"/><path d="M112 91 Q121 97 130 91"/></>,
];

const mouths = [
  <path d="M91 116 Q100 124 109 116"/>,
  <ellipse cx="100" cy="118" rx="5" ry="7"/>,
  <path d="M88 116 Q100 130 112 116 Q102 120 88 116Z"/>,
  <path d="M91 117 L109 117"/>,
];

export const MonsterArt: React.FC<MonsterArtProps> = ({ seed, bodyIndex, elementId, form = 1, shiny = false, silhouette = false, className, title }) => {
  const reactId = useId().replace(/:/g, '');
  const safeSeed = seed || 'monster';
  const raw = palettes[elementId] || palettes.grass;
  const palette = shiny ? shinyPalettes[elementId] || shinyPalettes.grass : raw;
  const color = silhouette ? '#454653' : palette.body;
  const shade = silhouette ? '#454653' : palette.shade;
  const belly = silhouette ? '#454653' : palette.belly;
  const accent = silhouette ? '#454653' : palette.accent;
  const shapeIndex = Math.max(0, Math.min(5, bodyIndex | 0));
  const eyes = choices(safeSeed, [0, 1, 2, 3], 11);
  const mouth = choices(safeSeed, [0, 1, 2, 3], 23);
  const blush = choices(safeSeed, [true, false], 37);
  const bellyMark = choices(safeSeed, [0, 1, 2], 43);
  const hue = choices(safeSeed, [-9, -5, 0, 4, 8], 71);
  const id = `monster-${reactId}-${Math.abs(choices(safeSeed, [1, 2, 3, 4, 5, 6, 7, 8, 9], 97))}`;
  const eyeStyle = silhouette ? { fill: color, stroke: 'none' } : { fill: eyes === 1 || eyes === 3 ? 'none' : '#382e45', stroke: '#382e45' };
  const ornament = () => {
    switch (elementId) {
      case 'fire': return <path d="M100 46 Q83 34 96 15 Q99 27 107 29 Q111 18 118 15 Q124 38 108 47Z" fill={accent}/>;
      case 'water': return <path d="M100 12 C95 23 86 29 87 37 A13 13 0 0 0 113 37 C114 29 105 22 100 12Z" fill={accent}/>;
      case 'grass': return <path d="M100 43 Q82 27 91 14 Q107 16 105 31 Q116 17 124 21 Q121 39 100 43Z" fill={accent}/>;
      case 'electric': return <path d="M103 10 L87 31 L99 30 L94 46 L115 22 L103 23Z" fill={accent}/>;
      case 'ice': return <g stroke={accent} strokeWidth="4" strokeLinecap="round"><path d="M100 13V42M87 20L113 35M113 20L87 35"/></g>;
      case 'wind': return <path d="M86 27 Q105 14 114 25 Q120 34 106 36 Q98 36 100 30" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round"/>;
      case 'light': return <path d="M76 35 Q100 15 124 35" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round"/>;
      default: return <path d="M111 15 A16 16 0 1 0 124 38 A13 13 0 0 1 111 15Z" fill={accent}/>;
    }
  };

  return <svg className={className} width="100%" height="100%" viewBox="0 0 200 200" role="img" aria-label={title || 'かわいいモンスター'}>
    {title && <title>{title}</title>}
    {!silhouette && <defs><linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.8" y2="1"><stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={shade} /></linearGradient></defs>}
    {/* Evolved forms get a glow behind them so the change reads at a glance */}
    {form >= 2 && !silhouette && <circle cx="100" cy="100" r={form === 3 ? 86 : 76} fill={accent} opacity={form === 3 ? 0.28 : 0.2}/>}
    {form === 3 && <ellipse cx="100" cy="99" rx="88" ry="85" fill="none" stroke={silhouette ? color : accent} strokeWidth="4" strokeDasharray="7 7" opacity=".75"/>}
    <g transform={`translate(100 100) scale(${form === 1 ? 0.78 : form === 2 ? 0.94 : 1.05}) translate(-100 -100)`}>
      {shapeParts[shapeIndex]({ color, shade, accent, silhouette, form: form as 1 | 2 | 3 })}
      {!silhouette && <g fill="none" stroke="#fff" strokeWidth="4" opacity=".3"><path d="M62 72 Q72 55 88 54" strokeLinecap="round"/></g>}
      {form >= 2 && <g fill={silhouette ? color : accent} stroke={shade} strokeWidth="2"><path d="M71 51 Q60 25 82 37 L94 52Z"/><path d="M106 52 L118 37 Q140 25 129 51Z"/></g>}
      {form === 3 && <path d="M83 42 L88 27 L97 38 L104 22 L111 39 L120 28 L119 47Z" fill={silhouette ? color : accent} stroke={shade} strokeWidth="3" strokeLinejoin="round"/>}
      {!silhouette && <>
        {shapeIndex !== 0 && shapeIndex !== 4 && shapeIndex !== 5 && <ellipse cx="100" cy="129" rx="29" ry="20" fill={belly}/>}
        {bellyMark === 1 && <path d="M84 128 Q100 119 116 128" fill="none" stroke={shade} strokeWidth="3" opacity=".6"/>}
        {bellyMark === 2 && <circle cx="100" cy="130" r="6" fill={palette.cheek} opacity=".75"/>}
        <g fill={eyeStyle.fill} stroke={eyeStyle.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{eyes === 2 ? <g>{eyeShapes[2]}</g> : eyes === 1 || eyes === 3 ? <g>{eyeShapes[eyes]}</g> : <g>{eyeShapes[0]}<circle cx="81" cy="88" r="2.5" fill="white" stroke="none"/><circle cx="123" cy="88" r="2.5" fill="white" stroke="none"/></g>}</g>
        {blush && <g fill={palette.cheek} opacity=".85"><ellipse cx="63" cy="108" rx="9" ry="5"/><ellipse cx="137" cy="108" rx="9" ry="5"/></g>}
        {shapeIndex === 2 ? <path d="M100 106 L87 115 L100 121 L113 115Z" fill={accent} stroke={shade} strokeWidth="2"/> : <g fill="#6b3c50" stroke="#6b3c50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{mouths[mouth]}</g>}
      </>}
      {ornament()}
      {form >= 2 && ornament()}
    </g>
    {form === 3 && !silhouette && <path d="M100 8 L103 15 L111 16 L105 21 L107 29 L100 25 L93 29 L95 21 L89 16 L97 15Z" fill="#fff3a6" stroke="#e7bd55" strokeWidth="1.5"/>}
    {shiny && !silhouette && <g fill="#fff7ae" stroke="#e9c95c" strokeWidth="1"><path d="M34 61 L37 68 L44 71 L37 74 L34 81 L31 74 L24 71 L31 68Z"/><path d="M164 90 L166 95 L171 97 L166 99 L164 104 L162 99 L157 97 L162 95Z"/><path d="M48 151 L50 156 L55 158 L50 160 L48 165 L46 160 L41 158 L46 156Z"/></g>}
  </svg>;
};
