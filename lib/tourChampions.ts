import { createGameDraft } from '@/lib/createGameDraft';
import {
  calculateOverallClassification,
  calculateYellowClassification,
  calculateMountainClassification,
  calculateSprintClassification,
  calculateTeamClassification,
  secondsToTime,
} from '@/lib/classifications';

export type TeamColor =
  | 'Blue'
  | 'White'
  | 'Green'
  | 'Red'
  | 'Black'
  | 'Pink';

type RiderChampion = {
  name: string;
  result: string;
};

type TeamChampion = {
  name: string;
  result: string;
  color: TeamColor;
};

type OverallStanding = {
  playerName: string;
  points: number;
};

export type TourChampions = {
  overallWinner: TeamChampion;
  overallStandings: OverallStanding[];
  yellowWinner: RiderChampion;
  mountainWinner: RiderChampion;
  sprintWinner: RiderChampion;
  teamWinner: TeamChampion;
};

function getPlayerColor(playerName: string): TeamColor {
  const playerIndex =
    createGameDraft.playerNames.findIndex(
      (name) => name === playerName
    );

  const color = createGameDraft.playerColors[playerIndex];

  return (color ?? 'Blue') as TeamColor;
}

export function calculateTourChampions(): TourChampions {
  const overallClassification =
  calculateOverallClassification();

const overallWinner =
  overallClassification[0];
    

  const yellowWinner =
    calculateYellowClassification()[0];

  const mountainWinner =
    calculateMountainClassification()[0];

  const sprintWinner =
    calculateSprintClassification()[0];

  const teamWinner =
    calculateTeamClassification()[0];

  return {
    overallWinner: {
  name: overallWinner?.playerName ?? 'No winner',
  result: `${overallWinner?.points ?? 0} Tour Points`,
  color: getPlayerColor(
    overallWinner?.playerName ?? ''
  ),
},

overallStandings: overallClassification,

    yellowWinner: {
      name: yellowWinner?.riderName ?? 'No winner',
      result:
        yellowWinner?.totalTime !== undefined
          ? secondsToTime(yellowWinner.totalTime)
          : 'No result',
    },

    mountainWinner: {
      name: mountainWinner?.riderName ?? 'No winner',
      result: `${mountainWinner?.points ?? 0} pts`,
    },

    sprintWinner: {
      name: sprintWinner?.riderName ?? 'No winner',
      result: `${sprintWinner?.points ?? 0} pts`,
    },

    teamWinner: {
      name: teamWinner?.playerName ?? 'No winner',
      result:
        teamWinner?.totalTime !== undefined
          ? secondsToTime(teamWinner.totalTime)
          : 'No result',
      color: getPlayerColor(
        teamWinner?.playerName ?? ''
      ),
    },
  };
}