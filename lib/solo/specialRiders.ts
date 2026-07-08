export type SpecialRiderDeckCard = {
  value: number;
  isSpecial?: boolean;
};

function c(value: number, isSpecial = false): SpecialRiderDeckCard {
  return {
    value,
    isSpecial,
  };
}

export type SpecialRiderId =
  | 'baroudeur'
  | 'flandrien'
  | 'grimpeur'
  | 'domestique'
  | 'super-rouleur'
  | 'puncheur'
  | 'descender'
  | 'polyvalent'
  | 'mountaineer'
  | 'squirrel'
  | 'super-sprinteur'
  | 'flahute';


export type SpecialRiderDefinition = {
  id: SpecialRiderId;
  name: string;
  riderType: 'sprinteur' | 'rouleur';
  deck: SpecialRiderDeckCard[];
};
const BAROUDEUR: SpecialRiderDefinition = {
  id: 'baroudeur',
  name: 'Baroudeur',
  riderType: 'rouleur',
  deck: [
    c(3),
    c(3),

    c(4),
    c(4),
    c(4),

    c(5),
    c(5),
    c(5, true),

    c(6),
    c(6, true),
    c(6, true),

    c(7),
    c(7),
    c(7, true),
  ],
};

const FLANDRIEN: SpecialRiderDefinition = {
  id: 'flandrien',
  name: 'Flandrien',
  riderType: 'rouleur',
  deck: [
    c(3, true),
    c(3),
    c(3),

    c(4, true),
    c(4),
    c(4),

    c(5, true),
    c(5),
    c(5),

    c(6, true),
    c(6),
    c(6),

    c(7, true),
    c(7),
    c(7),
  ],
};

const GRIMPEUR: SpecialRiderDefinition = {
  id: 'grimpeur',
  name: 'Grimpeur',
  riderType: 'rouleur',
  deck: [
    c(3, true),
    c(3, true),
    c(3, true),

    c(4),
    c(4),
    c(4),

    c(5),
    c(5),
    c(5),

    c(6, true),
    c(6, true),
    c(6, true),

    c(7),
    c(7),
    c(7),
  ],
};

const DOMESTIQUE: SpecialRiderDefinition = {
  id: 'domestique',
  name: 'Domestique',
  riderType: 'rouleur',
  deck: [
    c(3),
    c(3),
    c(3),

    c(4, true),
    c(4, true),
    c(4, true),

    c(5),
    c(5),
    c(5),

    c(6),
    c(6),
    c(6),

    c(7),
    c(7),
    c(7),
  ],
};


const SUPER_ROULEUR: SpecialRiderDefinition = {
  id: 'super-rouleur',
  name: 'Super Rouleur',
  riderType: 'rouleur',
  deck: [
    c(3),
    c(3),
    c(3),

    c(4),
    c(4),
    c(4),

    c(5, true),
    c(5, true),
    c(5),

    c(6, true),
    c(6, true),
    c(6),

    c(7),
    c(7),
    c(7),
  ],
};

const PUNCHEUR: SpecialRiderDefinition = {
  id: 'puncheur',
  name: 'Puncheur',
  riderType: 'rouleur',
  deck: [
    c(3),
    c(3),
    c(3),

    c(4),
    c(4),

    c(5),
    c(5),
    c(5),

    c(6),
    c(6),

    c(7),
    c(7),
    c(7),

    c(8, true),
  ],
};

const DESCENDER: SpecialRiderDefinition = {
  id: 'descender',
  name: 'Descender',
  riderType: 'sprinteur',
  deck: [
    c(2),
    c(2),
    c(2),

    c(3, true),
    c(3, true),
    c(3, true),

    c(4),
    c(4),
    c(4),

    c(5),
    c(5),
    c(5),

    c(9),
    c(9),
    c(9),
  ],
};

const POLYVALENT: SpecialRiderDefinition = {
  id: 'polyvalent',
  name: 'Polyvalent',
  riderType: 'sprinteur',
  deck: [
    c(2),
    c(2),
    c(2),

    c(3),
    c(3),
    c(3),
    c(3),

    c(5),
    c(5),
    c(5),

    c(6),
    c(6),

    c(9),
    c(9),
    c(9),
  ],
};

const MOUNTAINEER: SpecialRiderDefinition = {
  id: 'mountaineer',
  name: 'Mountaineer',
  riderType: 'sprinteur',
  deck: [
    c(2),
    c(2),

    c(3),
    c(3),

    c(4),
    c(4),
    c(4),
    c(4),

    c(5),
    c(5),

    c(7, true),
    c(7, true),

    c(9),
    c(9),
  ],
};

const SQUIRREL: SpecialRiderDefinition = {
  id: 'squirrel',
  name: 'Squirrel',
  riderType: 'sprinteur',
  deck: [
    c(2),
    c(2),

    c(3),
    c(3),
    c(3),

    c(4),
    c(4),
    c(4),

    c(5),
    c(5),
    c(5),

    c(7, true),
    c(7, true),

    c(9),
    c(9),
  ],
};

const SUPER_SPRINTEUR: SpecialRiderDefinition = {
  id: 'super-sprinteur',
  name: 'Super Sprinteur',
  riderType: 'sprinteur',
  deck: [
    c(2),
    c(2),
    c(2),

    c(3),
    c(3),
    c(3),

    c(4),
    c(4),
    c(4),
    c(4),

    c(5),
    c(5),

    c(9),

    c(10),
    c(11),
  ],
};

const FLAHUTE: SpecialRiderDefinition = {
  id: 'flahute',
  name: 'Flahute',
  riderType: 'sprinteur',
  deck: [
    c(2),
    c(2),
    c(2),

    c(3),
    c(3),
    c(3),

    c(4),
    c(4),

    c(5),
    c(5),
    c(5),
    c(5, true),

    c(9),
    c(9, true),
    c(9, true),
  ],
};

export const specialRiders: Record<SpecialRiderId, SpecialRiderDefinition> = {
  baroudeur: BAROUDEUR,
  flandrien: FLANDRIEN,
grimpeur: GRIMPEUR,
  domestique: DOMESTIQUE,
  'super-rouleur': SUPER_ROULEUR,
  puncheur: PUNCHEUR,
  descender: DESCENDER,
  polyvalent: POLYVALENT,
  mountaineer: MOUNTAINEER,
  squirrel: SQUIRREL,
  'super-sprinteur': SUPER_SPRINTEUR,
  flahute: FLAHUTE,
};