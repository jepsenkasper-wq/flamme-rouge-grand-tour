import { createGameDraft } from './createGameDraft';
import { gameResults } from './gameResults';

function timeToSeconds(time: string) {
  if (!time) return 0;

  const [minutes, seconds] = time.split(':').map(Number);

  return minutes * 60 + seconds;
}
function getLatestStageRankings() {
  const latestStage = [...gameResults.entries]
    .filter((entry) => entry.entryType === 'stage')
    .at(-1);

  if (!latestStage) {
    return new Map<string, number>();
  }

  const rankings = latestStage.players.flatMap((player, playerIndex) => [
    {
      riderName: `${createGameDraft.playerNames[playerIndex]} - Sprinteur`,
      time: timeToSeconds(player.sprinteur.time),
      tieBreakOrder: player.sprinteur.tieBreakOrder,
    },
    {
      riderName: `${createGameDraft.playerNames[playerIndex]} - Rouleur`,
      time: timeToSeconds(player.rouleur.time),
      tieBreakOrder: player.rouleur.tieBreakOrder,
    },
  ]);

  rankings.sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }

    return a.tieBreakOrder - b.tieBreakOrder;
  });

  return new Map(
    rankings.map((rider, index) => [rider.riderName, index])
  );
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

 const latestStageRankings = getLatestStageRankings();

return riders.sort((a, b) => {
  if (a.totalTime !== b.totalTime) {
    return a.totalTime - b.totalTime;
  }

  return (
    (latestStageRankings.get(a.riderName) ?? 999) -
    (latestStageRankings.get(b.riderName) ?? 999)
  );
});
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

  const latestStageRankings = getLatestStageRankings();

return riders.sort((a, b) => {
  if (a.points !== b.points) {
    return b.points - a.points;
  }

  return (
    (latestStageRankings.get(a.riderName) ?? 999) -
    (latestStageRankings.get(b.riderName) ?? 999)
  );
});
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

 const latestStageRankings = getLatestStageRankings();

return riders.sort((a, b) => {
  if (a.points !== b.points) {
    return b.points - a.points;
  }

  return (
    (latestStageRankings.get(a.riderName) ?? 999) -
    (latestStageRankings.get(b.riderName) ?? 999)
  );
});
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

  const latestStageRankings = getLatestStageRankings();

function getBestTeamStageRank(playerName: string) {
  const sprinteurRank =
    latestStageRankings.get(`${playerName} - Sprinteur`) ?? 999;

  const rouleurRank =
    latestStageRankings.get(`${playerName} - Rouleur`) ?? 999;

  return Math.min(sprinteurRank, rouleurRank);
}

return teams.sort((a, b) => {
  if (a.totalTime !== b.totalTime) {
    return a.totalTime - b.totalTime;
  }

  return getBestTeamStageRank(a.playerName) - getBestTeamStageRank(b.playerName);
});
}
export function calculateOverallClassification() {
 const bonusRules =
  createGameDraft.scoringRules ||
  getClassificationBonusRules(Number(createGameDraft.stages || 21));


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

    function hasRiderTime(riderName: string) {
    const [playerName, riderType] = riderName.split(' - ');

    const playerIndex = players.findIndex(
      (player) => player.playerName === playerName
    );

    if (playerIndex === -1) return false;

    return gameResults.entries.some((entry) => {
      if (entry.entryType === 'restDay') return false;

      const player = entry.players[playerIndex];
      if (!player) return false;

      const rider =
        riderType === 'Sprinteur'
          ? player.sprinteur
          : player.rouleur;

      return rider.time !== '';
    });
  }

  function hasTeamTime(playerName: string) {
    const playerIndex = players.findIndex(
      (player) => player.playerName === playerName
    );

    if (playerIndex === -1) return false;

    return gameResults.entries.some((entry) => {
      if (entry.entryType === 'restDay') return false;

      const player = entry.players[playerIndex];
      if (!player) return false;

      return (
        player.sprinteur.time !== '' ||
        player.rouleur.time !== ''
      );
    });
  }

    yellowClassification
    .filter((rider) => hasRiderTime(rider.riderName))
    .forEach((rider, index) => {
      const bonus = bonusRules.yellow[index] || 0;
      const playerName = rider.riderName.split(' - ')[0];
      const player = players.find((p) => p.playerName === playerName);

      if (player) {
        player.bonusPoints += bonus;
        player.points += bonus;
      }
    });

    mountainClassification
    .filter((rider) => rider.points > 0)
    .forEach((rider, index) => {
      const bonus = bonusRules.mountain[index] || 0;
      const playerName = rider.riderName.split(' - ')[0];
      const player = players.find((p) => p.playerName === playerName);

      if (player) {
        player.bonusPoints += bonus;
        player.points += bonus;
      }
    });

    sprintClassification
    .filter((rider) => rider.points > 0)
    .forEach((rider, index) => {
      const bonus = bonusRules.sprint[index] || 0;
      const playerName = rider.riderName.split(' - ')[0];
      const player = players.find((p) => p.playerName === playerName);

      if (player) {
        player.bonusPoints += bonus;
        player.points += bonus;
      }
    });

    teamClassification
    .filter((team) => hasTeamTime(team.playerName))
    .forEach((team, index) => {
      const bonus = bonusRules.team[index] || 0;
      const player = players.find((p) => p.playerName === team.playerName);

      if (player) {
        player.bonusPoints += bonus;
        player.points += bonus;
      }
    });

  return players.sort((a, b) => b.points - a.points);
}
export function getClassificationBonusRules(numberOfStages: number) {
  if (numberOfStages <= 7) {
    return {
      yellow: [3, 2, 1],
      team: [1, 0, 0],
      sprint: [2, 1, 0],
      mountain: [2, 1, 0],
    };
  }

  if (numberOfStages <= 14) {
    return {
      yellow: [4, 3, 2, 1],
      team: [2, 1, 0],
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
export function calculateBonusBreakdown() {
  const bonusRules =
    createGameDraft.scoringRules ||
    getClassificationBonusRules(Number(createGameDraft.stages || 21));

  const yellowClassification = calculateYellowClassification();
  const mountainClassification = calculateMountainClassification();
  const sprintClassification = calculateSprintClassification();
  const teamClassification = calculateTeamClassification();

  const players = createGameDraft.playerNames.map((playerName, playerIndex) => ({
    playerName: playerName || `Player ${playerIndex + 1}`,
    playerIndex,

    sprinteur: {
      yellow: 0,
      mountain: 0,
      sprint: 0,
    },

    rouleur: {
      yellow: 0,
      mountain: 0,
      sprint: 0,
    },

    team: 0,
  }));

  function addRiderBonus(
    riderName: string,
    type: 'yellow' | 'mountain' | 'sprint',
    bonus: number
  ) {
    const [playerName, riderType] = riderName.split(' - ');

    const player = players.find((p) => p.playerName === playerName);

    if (!player || bonus === 0) {
      return;
    }

    if (riderType === 'Sprinteur') {
      player.sprinteur[type] += bonus;
    }

    if (riderType === 'Rouleur') {
      player.rouleur[type] += bonus;
    }
  }

    function hasRiderTime(riderName: string) {
    const [playerName, riderType] = riderName.split(' - ');

    const player = players.find((p) => p.playerName === playerName);

    if (!player) return false;

    return gameResults.entries.some((entry) => {
      if (entry.entryType === 'restDay') return false;

      const entryPlayer = entry.players[player.playerIndex];
      if (!entryPlayer) return false;

      const rider =
        riderType === 'Sprinteur'
          ? entryPlayer.sprinteur
          : entryPlayer.rouleur;

      return rider.time !== '';
    });
  }

  function hasTeamTime(playerIndex: number) {
    return gameResults.entries.some((entry) => {
      if (entry.entryType === 'restDay') return false;

      const entryPlayer = entry.players[playerIndex];
      if (!entryPlayer) return false;

      return (
        entryPlayer.sprinteur.time !== '' ||
        entryPlayer.rouleur.time !== ''
      );
    });
  }

    yellowClassification
    .filter((rider) => hasRiderTime(rider.riderName))
    .forEach((rider, index) => {
      addRiderBonus(
        rider.riderName,
        'yellow',
        bonusRules.yellow[index] || 0
      );
    });

    mountainClassification
    .filter((rider) => rider.points > 0)
    .forEach((rider, index) => {
      addRiderBonus(
        rider.riderName,
        'mountain',
        bonusRules.mountain[index] || 0
      );
    });

    sprintClassification
    .filter((rider) => rider.points > 0)
    .forEach((rider, index) => {
      addRiderBonus(
        rider.riderName,
        'sprint',
        bonusRules.sprint[index] || 0
      );
    });

    teamClassification
    .filter((team) => {
      const player = players.find((p) => p.playerName === team.playerName);
      return player ? hasTeamTime(player.playerIndex) : false;
    })
    .forEach((team, index) => {
      const player = players.find((p) => p.playerName === team.playerName);

      if (player) {
        player.team += bonusRules.team[index] || 0;
      }
    });

  return players;
}


