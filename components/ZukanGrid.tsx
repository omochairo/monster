import React, { useMemo } from 'react';
import { GeneratedPet } from '../types';
import { ELEMENTS } from '../services/geminiService';
import { BODY_SHAPES, ELEMENT_ORDER, SPECIES_COUNT, isBossPrompt, speciesNo, speciesOf } from '../services/species';
import { MonsterArt } from './MonsterArt';
import { PetImage } from './PetImage';

interface ZukanGridProps {
  collection: GeneratedPet[];
  species: Map<number, { shiny: boolean }>;
}

// 48 slots: one page per element, one slot per body shape. Unknown slots are silhouettes.
export const ZukanGrid: React.FC<ZukanGridProps> = ({ collection, species }) => {
  const representative = useMemo(() => {
    const map = new Map<number, GeneratedPet>();
    collection.forEach(p => {
      if (isBossPrompt(p.imagePrompt)) return;
      const no = speciesOf(p).no;
      const current = map.get(no);
      if (!current || (p.level || 1) > (current.level || 1)) map.set(no, p);
    });
    return map;
  }, [collection]);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
        <div className="flex justify-between text-sm font-black text-gray-700 mb-1">
          <span>みつけた しゅぞく</span>
          <span>{species.size} / {SPECIES_COUNT}</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-400 to-purple-500" style={{ width: `${(species.size / SPECIES_COUNT) * 100}%` }} />
        </div>
        <p className="text-[11px] font-bold text-gray-400 mt-1">✨ = いろちがいも みつけた ／ 合成で ねらった しゅぞくを つくれるよ</p>
      </div>

      {ELEMENT_ORDER.map(elementId => {
        const element = ELEMENTS.find(e => e.id === elementId)!;
        const foundInPage = BODY_SHAPES.filter((_, bi) => species.has(speciesNo(elementId, bi))).length;
        const complete = foundInPage === BODY_SHAPES.length;
        return (
          <section key={elementId} className={`bg-white rounded-2xl p-3 shadow-sm border-2 ${complete ? 'border-yellow-300' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full ${element.color} flex items-center justify-center text-sm`}>{element.icon}</span>
                <span className="font-black text-gray-800">{element.label}の なかま</span>
                {complete && <span className="text-[10px] font-black bg-yellow-300 text-yellow-900 px-2 rounded-full">コンプリート！</span>}
              </div>
              <span className="text-xs font-bold text-gray-500">
                {complete ? `${foundInPage}/${BODY_SHAPES.length}` : `あと ${BODY_SHAPES.length - foundInPage}しゅ`}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {BODY_SHAPES.map((body, bi) => {
                const no = speciesNo(elementId, bi);
                const rep = representative.get(no);
                const shiny = species.get(no)?.shiny;
                return (
                  <div key={body.id} className={`relative rounded-xl aspect-square flex flex-col items-center justify-center ${rep ? 'bg-gray-50' : 'bg-gray-100'}`} title={rep ? rep.name : '？？？'}>
                    {rep ? (
                      <PetImage pet={rep} className="w-full h-full" />
                    ) : (
                      <MonsterArt seed={`zukan-${no}`} bodyIndex={bi} elementId={elementId} silhouette className="w-full h-full opacity-40" />
                    )}
                    <span className="absolute bottom-0 left-0.5 text-[8px] font-black text-gray-400">{String(no).padStart(3, '0')}</span>
                    {shiny && <span className="absolute top-0 right-0.5 text-[10px]">✨</span>}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
