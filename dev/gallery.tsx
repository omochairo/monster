// Dev-only catalog of every body x element, plus forms, shinies and silhouettes. Open /dev/gallery.html
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonsterArt } from '../components/MonsterArt';
import { BODY_SHAPES, ELEMENT_ORDER } from '../services/species';

const Gallery = () => (
  <div className="p-4 space-y-6">
    <h1 className="text-xl font-black">からだ × ぞくせい（48しゅ）</h1>
    <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${ELEMENT_ORDER.length}, 1fr)` }}>
      <div />
      {ELEMENT_ORDER.map(e => <div key={e} className="text-xs font-bold text-center">{e}</div>)}
      {BODY_SHAPES.map((b, bi) => (
        <React.Fragment key={b.id}>
          <div className="text-xs font-bold self-center">{b.label}</div>
          {ELEMENT_ORDER.map(e => <MonsterArt key={e} seed={`${b.id}-${e}`} bodyIndex={bi} elementId={e} className="w-full aspect-square bg-white rounded" />)}
        </React.Fragment>
      ))}
    </div>
    <h1 className="text-xl font-black">しんか 1→2→3 ／ いろちがい ／ シルエット</h1>
    <div className="grid grid-cols-6 gap-2">
      {BODY_SHAPES.map((b, bi) => (
        <div key={b.id} className="bg-white rounded p-1 space-y-1">
          {[1, 2, 3].map(f => <MonsterArt key={f} seed={`evo-${b.id}`} bodyIndex={bi} elementId={ELEMENT_ORDER[bi]} form={f as 1 | 2 | 3} className="w-24 h-24 mx-auto" />)}
          <MonsterArt seed={`evo-${b.id}`} bodyIndex={bi} elementId={ELEMENT_ORDER[bi]} shiny className="w-24 h-24 mx-auto" />
          <MonsterArt seed={`evo-${b.id}`} bodyIndex={bi} elementId={ELEMENT_ORDER[bi]} silhouette className="w-24 h-24 mx-auto" />
        </div>
      ))}
    </div>
    <h1 className="text-xl font-black">おなじ からだ・ぞくせいでも シードで ちがう</h1>
    <div className="grid grid-cols-8 gap-1">
      {Array.from({ length: 16 }, (_, i) => <MonsterArt key={i} seed={`var-${i}`} bodyIndex={1} elementId="water" className="w-full aspect-square bg-white rounded" />)}
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<Gallery />);
