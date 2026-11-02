export type ChallengerColor =
  | 'red'
  | 'black'
  | 'green'
  | 'blue'
  | 'white'
  | 'pink';

export type ChallengerCard = {
  id: number;
  values: Record<
    ChallengerColor,
    {
      sprinteur: number;
      rouleur: number;
    }
  >;
};

export const challengerCards: ChallengerCard[] = [
  {
    id: 1,
    values: {
      red: { sprinteur: 3, rouleur: 6 },
      black: { sprinteur: 5, rouleur: 6 },
      green: { sprinteur: 4, rouleur: 4 },
      blue: { sprinteur: 4, rouleur: 3 },
      white: { sprinteur: 5, rouleur: 5 },
      pink: { sprinteur: 9, rouleur: 5 },
    },
  },
  {
    id: 2,
    values: {
      red: { sprinteur: 4, rouleur: 3 },
      black: { sprinteur: 9, rouleur: 4 },
      green: { sprinteur: 5, rouleur: 6 },
      blue: { sprinteur: 5, rouleur: 5 },
      white: { sprinteur: 4, rouleur: 3 },
      pink: { sprinteur: 2, rouleur: 7 },
    },
  },
  {
    id: 3,
    values: {
      red: { sprinteur: 5, rouleur: 5 },
      black: { sprinteur: 3, rouleur: 5 },
      green: { sprinteur: 4, rouleur: 3 },
      blue: { sprinteur: 2, rouleur: 3 },
      white: { sprinteur: 9, rouleur: 6 },
      pink: { sprinteur: 5, rouleur: 4 },
    },
  },
  {
    id: 4,
    values: {
      red: { sprinteur: 4, rouleur: 4 },
      black: { sprinteur: 5, rouleur: 3 },
      green: { sprinteur: 5, rouleur: 7 },
      blue: { sprinteur: 9, rouleur: 6 },
      white: { sprinteur: 2, rouleur: 4 },
      pink: { sprinteur: 3, rouleur: 5 },
    },
  },
  {
    id: 5,
    values: {
      red: { sprinteur: 5, rouleur: 7 },
      black: { sprinteur: 4, rouleur: 6 },
      green: { sprinteur: 2, rouleur: 4 },
      blue: { sprinteur: 3, rouleur: 4 },
      white: { sprinteur: 4, rouleur: 5 },
      pink: { sprinteur: 9, rouleur: 3 },
    },
  },
  {
    id: 6,
    values: {
      red: { sprinteur: 2, rouleur: 3 },
      black: { sprinteur: 9, rouleur: 5 },
      green: { sprinteur: 4, rouleur: 5 },
      blue: { sprinteur: 5, rouleur: 7 },
      white: { sprinteur: 5, rouleur: 4 },
      pink: { sprinteur: 4, rouleur: 6 },
    },
  },
  {
    id: 7,
    values: {
      red: { sprinteur: 9, rouleur: 6 },
      black: { sprinteur: 2, rouleur: 7 },
      green: { sprinteur: 9, rouleur: 3 },
      blue: { sprinteur: 4, rouleur: 5 },
      white: { sprinteur: 3, rouleur: 6 },
      pink: { sprinteur: 5, rouleur: 4 },
    },
  },
  {
    id: 8,
    values: {
      red: { sprinteur: 5, rouleur: 4 },
      black: { sprinteur: 4, rouleur: 3 },
      green: { sprinteur: 3, rouleur: 7 },
      blue: { sprinteur: 9, rouleur: 5 },
      white: { sprinteur: 9, rouleur: 5 },
      pink: { sprinteur: 4, rouleur: 6 },
    },
  },
  {
    id: 9,
    values: {
      red: { sprinteur: 3, rouleur: 5 },
      black: { sprinteur: 2, rouleur: 4 },
      green: { sprinteur: 5, rouleur: 5 },
      blue: { sprinteur: 4, rouleur: 6 },
      white: { sprinteur: 4, rouleur: 7 },
      pink: { sprinteur: 9, rouleur: 3 },
    },
  },
  {
    id: 10,
    values: {
      red: { sprinteur: 9, rouleur: 7 },
      black: { sprinteur: 5, rouleur: 5 },
      green: { sprinteur: 2, rouleur: 6 },
      blue: { sprinteur: 3, rouleur: 4 },
      white: { sprinteur: 5, rouleur: 3 },
      pink: { sprinteur: 4, rouleur: 6 },
    },
  },
  {
    id: 11,
    values: {
      red: { sprinteur: 4, rouleur: 4 },
      black: { sprinteur: 4, rouleur: 3 },
      green: { sprinteur: 9, rouleur: 3 },
      blue: { sprinteur: 5, rouleur: 7 },
      white: { sprinteur: 2, rouleur: 6 },
      pink: { sprinteur: 5, rouleur: 5 },
    },
  },
  {
    id: 12,
    values: {
      red: { sprinteur: 5, rouleur: 5 },
      black: { sprinteur: 5, rouleur: 6 },
      green: { sprinteur: 3, rouleur: 5 },
      blue: { sprinteur: 4, rouleur: 3 },
      white: { sprinteur: 9, rouleur: 4 },
      pink: { sprinteur: 2, rouleur: 7 },
    },
  },
  {
    id: 13,
    values: {
      red: { sprinteur: 2, rouleur: 3 },
      black: { sprinteur: 3, rouleur: 5 },
      green: { sprinteur: 5, rouleur: 4 },
      blue: { sprinteur: 9, rouleur: 6 },
      white: { sprinteur: 4, rouleur: 7 },
      pink: { sprinteur: 4, rouleur: 4 },
    },
  },
  {
    id: 14,
    values: {
      red: { sprinteur: 9, rouleur: 5 },
      black: { sprinteur: 9, rouleur: 7 },
      green: { sprinteur: 4, rouleur: 6 },
      blue: { sprinteur: 2, rouleur: 4 },
      white: { sprinteur: 5, rouleur: 3 },
      pink: { sprinteur: 3, rouleur: 5 },
    },
  },
  {
    id: 15,
    values: {
      red: { sprinteur: 4, rouleur: 6 },
      black: { sprinteur: 4, rouleur: 4 },
      green: { sprinteur: 9, rouleur: 5 },
      blue: { sprinteur: 5, rouleur: 5 },
      white: { sprinteur: 3, rouleur: 5 },
      pink: { sprinteur: 5, rouleur: 3 },
    },
  },
];