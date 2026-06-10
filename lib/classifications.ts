import { createGameDraft } from './createGameDraft';
import { gameResults } from './gameResults';

function timeToSeconds(time: string) {
  if (!time) return 0;

  const [minutes, seconds] = time.split(':').map(Number);

  return minutes * 60 + seconds;
}

export function calculateYellowClassification() {
  const riders: {
    riderName: string;
    totalTime: number;
  }[] = [];

  createGameDraft.playerNames.forEach((playerName, playerIndex) => {
    riders.push({
      riderName: `${playerName || `Player ${playerIndex + 1}`} - Sprinteur`,
      totalTime: 0,
    });

    riders.push({
      riderName: `${playerName || `Player ${playerIndex + 1}`} - Rouleur`,
      totalTime: 0,
    });
  });

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      entry.players.forEach((player, playerIndex) => {
        const sprinteurIndex = playerIndex * 2;
        const rouleurIndex = playerIndex * 2 + 1;

        riders[sprinteurIndex].totalTime += timeToSeconds(player.sprinteur.time);
        riders[rouleurIndex].totalTime += timeToSeconds(player.rouleur.time);
      });
    });

  return riders.sort((a, b) => a.totalTime - b.totalTime);
}

export function secondsToTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}    
  
 export function calculateMountainClassification() {
  const riders: {
    riderName: string;
    points: number;
  }[] = [];

  createGameDraft.playerNames.forEach((playerName, playerIndex) => {
    riders.push({
      riderName: `${playerName || `Player ${playerIndex + 1}`} - Sprinteur`,
      points: 0,
    });

    riders.push({
      riderName: `${playerName || `Player ${playerIndex + 1}`} - Rouleur`,
      points: 0,
    });
  });

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      entry.players.forEach((player, playerIndex) => {
        const sprinteurIndex = playerIndex * 2;
        const rouleurIndex = playerIndex * 2 + 1;

        riders[sprinteurIndex].points += Number(player.sprinteur.mountainPoints || 0);
        riders[rouleurIndex].points += Number(player.rouleur.mountainPoints || 0);
      });
    });

  return riders.sort((a, b) => b.points - a.points);
}
export function calculateSprintClassification() {
  const riders: {
    riderName: string;
    points: number;
  }[] = [];

  createGameDraft.playerNames.forEach((playerName, playerIndex) => {
    riders.push({
      riderName: `${playerName || `Player ${playerIndex + 1}`} - Sprinteur`,
      points: 0,
    });

    riders.push({
      riderName: `${playerName || `Player ${playerIndex + 1}`} - Rouleur`,
      points: 0,
    });
  });

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      entry.players.forEach((player, playerIndex) => {
        const sprinteurIndex = playerIndex * 2;
        const rouleurIndex = playerIndex * 2 + 1;

        riders[sprinteurIndex].points += Number(player.sprinteur.sprintPoints || 0);
        riders[rouleurIndex].points += Number(player.rouleur.sprintPoints || 0);
      });
    });

  return riders.sort((a, b) => b.points - a.points);
}
export function calculateTeamClassification() {
  const teams: {
    playerName: string;
    totalTime: number;
  }[] = [];

  createGameDraft.playerNames.forEach((playerName, playerIndex) => {
    teams.push({
      playerName: playerName || `Player ${playerIndex + 1}`,
      totalTime: 0,
    });
  });

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      entry.players.forEach((player, playerIndex) => {
        teams[playerIndex].totalTime +=
          timeToSeconds(player.sprinteur.time) +
          timeToSeconds(player.rouleur.time);
      });
    });

  return teams.sort((a, b) => a.totalTime - b.totalTime);
}
export function calculateOverallClassification() {
  const bonusRules = getClassificationBonusRules(
    Number(createGameDraft.stages || 21)
  );

  const yellowClassification = calculateYellowClassification();
  const mountainClassification = calculateMountainClassification();
  const sprintClassification = calculateSprintClassification();
  const teamClassification = calculateTeamClassification();

  const players = createGameDraft.playerNames.map((playerName, playerIndex) => ({
    playerName: playerName || `Player ${playerIndex + 1}`,
    points: 0,
    tourPoints: 0,
    bonusPoints: 0,
  }));

  gameResults.entries.forEach((entry) => {
    entry.players.forEach((player, playerIndex) => {
      const stageTourPoints =
        Number(player.sprinteur.tourPoints || 0) +
        Number(player.rouleur.tourPoints || 0);

      players[playerIndex].tourPoints += stageTourPoints;
      players[playerIndex].points += stageTourPoints;
    });
  });

  yellowClassification.forEach((rider, index) => {
    const bonus = bonusRules.yellow[index] || 0;
    const playerName = rider.riderName.split(' - ')[0];
    const player = players.find((p) => p.playerName === playerName);

    if (player) {
      player.bonusPoints += bonus;
      player.points += bonus;
    }
  });

  mountainClassification.forEach((rider, index) => {
    const bonus = bonusRules.mountain[index] || 0;
    const playerName = rider.riderName.split(' - ')[0];
    const player = players.find((p) => p.playerName === playerName);

    if (player) {
      player.bonusPoints += bonus;
      player.points += bonus;
    }
  });

  sprintClassification.forEach((rider, index) => {
    const bonus = bonusRules.sprint[index] || 0;
    const playerName = rider.riderName.split(' - ')[0];
    const player = players.find((p) => p.playerName === playerName);

    if (player) {
      player.bonusPoints += bonus;
      player.points += bonus;
    }
  });

  teamClassification.forEach((team, index) => {
    const bonus = bonusRules.team[index] || 0;
    const player = players.find((p) => p.playerName === team.playerName);

    if (player) {
      player.bonusPoints += bonus;
      player.points += bonus;
    }
  });

  return players.sort((a, b) => b.points - a.points);
}
function getClassificationBonusRules(numberOfStages: number) {
  if (numberOfStages <= 7) {
    return {
      yellow: [3, 2, 1],
      team: [1],
      sprint: [2, 1],
      mountain: [2, 1],
    };
  }

  if (numberOfStages <= 14) {
    return {
      yellow: [4, 3, 2, 1],
      team: [2, 1],
      sprint: [3, 2, 1],
      mountain: [3, 2, 1],
    };
  }

  return {
    yellow: [5, 4, 3, 2, 1],
    team: [3, 2, 1],
    sprint: [4, 3, 2, 1],
    mountain: [4, 3, 2, 1],
  };
}
