import { GeneratedPet } from '../types';
import { simpleHash } from './random';

// Species = body shape x element. 6 x 8 = 48 entries in the zukan.

export interface BodyShape {
  id: string;
  label: string;
}

export const BODY_SHAPES: BodyShape[] = [
  { id: 'blob', label: 'ぷるぷる' },
  { id: 'beast', label: 'けもの' },
  { id: 'bird', label: 'とり' },
  { id: 'dragon', label: 'ドラゴン' },
  { id: 'bug', label: 'むし' },
  { id: 'ghost', label: 'おばけ' },
];

export const ELEMENT_ORDER = ['fire', 'water', 'grass', 'electric', 'ice', 'wind', 'light', 'dark'];

export const SPECIES_COUNT = BODY_SHAPES.length * ELEMENT_ORDER.length;

// Bosses use photos and are not part of the zukan.
export const isBossPrompt = (imagePrompt: string) => imagePrompt === 'iro-papa' || imagePrompt === 'iro-mama';

// A pet may carry an explicit body (quiz answers pick it); otherwise derive from imagePrompt so old saves map too.
export const bodyIndexOf = (pet: Pick<GeneratedPet, 'imagePrompt'> & { bodyIndex?: number }) => {
  if (typeof pet.bodyIndex === 'number') return pet.bodyIndex % BODY_SHAPES.length;
  return simpleHash(`body:${pet.imagePrompt}`) % BODY_SHAPES.length;
};

// Zukan number, 1-based: elements are the pages, bodies are the rows within a page.
export const speciesNo = (elementId: string, bodyIndex: number) => {
  const e = Math.max(0, ELEMENT_ORDER.indexOf(elementId));
  return e * BODY_SHAPES.length + bodyIndex + 1;
};

export const speciesOf = (pet: GeneratedPet) => {
  const bodyIndex = bodyIndexOf(pet);
  return {
    no: speciesNo(pet.element.id, bodyIndex),
    bodyIndex,
    body: BODY_SHAPES[bodyIndex],
    elementId: pet.element.id,
  };
};

// Evolution form from level (derived, so no save migration is needed).
export const FORM_LEVELS = [1, 8, 20];
export const formOfLevel = (level: number = 1): 1 | 2 | 3 => (level >= FORM_LEVELS[2] ? 3 : level >= FORM_LEVELS[1] ? 2 : 1);
