import { createGameDraft } from '../createGameDraft';
import { gameResults } from '../gameResults';
import type { ImageSourcePropType } from 'react-native';
import {
  calculateYellowClassification,
  calculateMountainClassification,
  calculateRiderBonusPoints,
} from '@/lib/classifications';


export type TourAwardId =
  | 'never-leave-your-wingman'
  | 'most-stage-wins'
  | 'every-man-for-himself'
  | 'heartbreak-award'
  | 'bad-day-at-the-office'
  | 'ice-cold'
  | 'flat-tire-award'
  | 'strong-finish'
  | 'flying-start'
  | 'point-eater'
  | 'goat-mode'
  | 'green-machine'
  | 'slow-and-steady'
  | 'point-gazer'
  | 'bonus-collector';

export type TourAwardResult = {
  id: TourAwardId;
  winnerType: 'rider' | 'team';
  winnerName: string;
  value: string;
  interestScore: number;
};

export type TourAward = TourAwardResult & {
  title: string;
  description: string;
  image: ImageSourcePropType;
};

export const awardDefinitions = {
  'never-leave-your-wingman': {
    title: 'Never Leave Your Wingman',
    description:
      'No team kept its two riders closer together throughout the Tour.',
    image: require('../../assets/images/awards/never-leave-your-wingman.png'),
  },

  'most-stage-wins': {
    title: 'Most Stage Wins',
    description:
      'Awarded to the rider with the most stage victories.',
    image: require('../../assets/images/awards/most-stage-wins.png'),
  },

  'every-man-for-himself': {
    title: 'Every Man for Himself',
    description:
      'Awarded to the team whose two riders finished furthest apart.',
    image: require('../../assets/images/awards/every-man-for-himself.png'),
  },

  'heartbreak-award': {
    title: 'Heartbreak Award',
    description:
      'Awarded to the rider with the most second-place finishes.',
    image: require('../../assets/images/awards/heartbreak-award.png'),
  },

  'bad-day-at-the-office': {
    title: 'Bad Day at the Office',
    description:
      'Awarded for the worst single-stage performance of the Tour.',
    image: require('../../assets/images/awards/bad-day-at-the-office.png'),
  },

  'ice-cold': {
    title: 'Ice Cold',
    description:
      'Awarded to the rider with the longest no-points streak.',
    image: require('../../assets/images/awards/ice-cold.png'),
  },

  'flat-tire-award': {
    title: 'Flat Tire Award',
    description:
      'Awarded to the rider with the most last-place finishes.',
    image: require('../../assets/images/awards/flat-tire-award.png'),
  },

  'strong-finish': {
    title: 'Strong Finish',
    description:
      'Awarded to the rider with the most points in the last part of the tour.',
    image: require('../../assets/images/awards/comeback-kid.png'),
  },

  'flying-start': {
    title: 'Flying Start',
    description:
      'Awarded to the rider with the strongest first part of the Tour.',
    image: require('../../assets/images/awards/flying-start.png'),
  },

  'point-eater': {
    title: 'Point Eater',
    description:
      'Awarded to the rider who collected the most points across all competitions.',
    image: require('../../assets/images/awards/point-eater.png'),
  },

  'goat-mode': {
    title: 'Goat Mode',
    description:
      'Awarded to the team with most mountain points in a single stage.',
    image: require('../../assets/images/awards/goat-mode.png'),
  },

  'green-machine': {
    title: 'Green Machine',
    description:
      'Awarded to the team with most sprint points in a single stage.',
    image: require('../../assets/images/awards/green-machine.png'),
  },

  'slow-and-steady': {
    title: 'Slow and Steady',
    description:
      'Awarded to the rider with highest stage placements but fewest stage wins.',
    image: require('../../assets/images/awards/slow-and-steady.png'),
  },

  'point-gazer': {
    title: 'Point Gazer',
    description:
      'Awarded to the rider with the most fourth-place finishes.',
    image: require('../../assets/images/awards/point-gazer.png'),
  },

  'bonus-collector': {
    title: 'Bonus Collector',
    description:
      'Awarded to the rider with the most bonuspoints.',
    image: require('../../assets/images/awards/bonus-collector.png'),
  },
} as const;

function timeToSeconds(time: string): number | null {
  if (!time) {
    return null;
  }

  const [minutes, seconds] = time.split(':').map(Number);

  if (
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds)
  ) {
    return null;
  }

  return minutes * 60 + seconds;
}

export function secondsToTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}   

function calculateMostStageWins(): TourAwardResult | null {
  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        playerIndex,
        riderType: 'sprinteur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Sprinteur`,
        stageWins: 0,
      },
      {
        playerIndex,
        riderType: 'rouleur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Rouleur`,
        stageWins: 0,
      },
    ]
  );

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      entry.players.forEach((player, playerIndex) => {
        const sprinteur = riders.find(
          (rider) =>
            rider.playerIndex === playerIndex &&
            rider.riderType === 'sprinteur'
        );

        const rouleur = riders.find(
          (rider) =>
            rider.playerIndex === playerIndex &&
            rider.riderType === 'rouleur'
        );

        if (Number(player.sprinteur.tourPoints || 0) === 3) {
          if (sprinteur) {
            sprinteur.stageWins += 1;
          }
        }

        if (Number(player.rouleur.tourPoints || 0) === 3) {
          if (rouleur) {
            rouleur.stageWins += 1;
          }
        }
      });
    });

  const highestStageWins = Math.max(
    0,
    ...riders.map((rider) => rider.stageWins)
  );

  // Awarden kommer kun i spil ved mindst to etapesejre.
  if (highestStageWins < 2) {
    return null;
  }

  const winners = riders.filter(
    (rider) => rider.stageWins === highestStageWins
  );

  // Awarden udelades ved delt førsteplads.
  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
  id: 'most-stage-wins',
  winnerType: 'rider',
  winnerName: winner.winnerName,
  value: `${winner.stageWins} stage wins`,
  interestScore: winner.stageWins * 20,
};
}

function calculateHeartbreakAward(): TourAwardResult | null {
  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        playerIndex,
        riderType: 'sprinteur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Sprinteur`,
        secondPlaces: 0,
      },
      {
        playerIndex,
        riderType: 'rouleur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Rouleur`,
        secondPlaces: 0,
      },
    ]
  );

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      entry.players.forEach((player, playerIndex) => {
        const sprinteur = riders.find(
          (rider) =>
            rider.playerIndex === playerIndex &&
            rider.riderType === 'sprinteur'
        );

        const rouleur = riders.find(
          (rider) =>
            rider.playerIndex === playerIndex &&
            rider.riderType === 'rouleur'
        );

        if (Number(player.sprinteur.tourPoints || 0) === 2) {
          if (sprinteur) {
            sprinteur.secondPlaces += 1;
          }
        }

        if (Number(player.rouleur.tourPoints || 0) === 2) {
          if (rouleur) {
            rouleur.secondPlaces += 1;
          }
        }
      });
    });

  const highestSecondPlaces = Math.max(
    0,
    ...riders.map((rider) => rider.secondPlaces)
  );

  // Awarden kommer kun i spil ved mindst to andenpladser.
  if (highestSecondPlaces < 2) {
    return null;
  }

  const winners = riders.filter(
    (rider) => rider.secondPlaces === highestSecondPlaces
  );

  // Awarden udelades ved delt førsteplads.
  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'heartbreak-award',
    winnerType: 'rider',
    winnerName: winner.winnerName,
    value: `${winner.secondPlaces} second places`,
    interestScore: winner.secondPlaces * 20,
  };
}

function calculateFlatTireAward(): TourAwardResult | null {
  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        playerIndex,
        riderType: 'sprinteur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Sprinteur`,
        lastPlaces: 0,
      },
      {
        playerIndex,
        riderType: 'rouleur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Rouleur`,
        lastPlaces: 0,
      },
    ]
  );

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      const stageRiders: {
        playerIndex: number;
        riderType: 'sprinteur' | 'rouleur';
        seconds: number;
      }[] = [];

      entry.players.forEach((player, playerIndex) => {
        const sprinteurTime = timeToSeconds(player.sprinteur.time);

        if (sprinteurTime !== null) {
          stageRiders.push({
            playerIndex,
            riderType: 'sprinteur',
            seconds: sprinteurTime,
          });
        }

        const rouleurTime = timeToSeconds(player.rouleur.time);

        if (rouleurTime !== null) {
          stageRiders.push({
            playerIndex,
            riderType: 'rouleur',
            seconds: rouleurTime,
          });
        }
      });

      if (stageRiders.length === 0) {
        return;
      }

      const slowestTime = Math.max(
        ...stageRiders.map((rider) => rider.seconds)
      );

      const lastPlaced = stageRiders.filter(
        (rider) => rider.seconds === slowestTime
      );

      // Kun entydige sidstepladser tæller.
      if (lastPlaced.length !== 1) {
        return;
      }

      const loser = riders.find(
        (rider) =>
          rider.playerIndex === lastPlaced[0].playerIndex &&
          rider.riderType === lastPlaced[0].riderType
      );

      if (loser) {
        loser.lastPlaces += 1;
      }
    });

  const highestLastPlaces = Math.max(
    0,
    ...riders.map((rider) => rider.lastPlaces)
  );

  if (highestLastPlaces < 2) {
    return null;
  }

  const winners = riders.filter(
    (rider) => rider.lastPlaces === highestLastPlaces
  );

  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'flat-tire-award',
    winnerType: 'rider',
    winnerName: winner.winnerName,
    value: `${winner.lastPlaces} last places`,
    interestScore: winner.lastPlaces * 20,
  };
}

function calculateBadDayAtTheOffice(): TourAwardResult | null {
  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        playerIndex,
        riderType: 'sprinteur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Sprinteur`,
        biggestTimeLoss: 0,
      },
      {
        playerIndex,
        riderType: 'rouleur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Rouleur`,
        biggestTimeLoss: 0,
      },
    ]
  );

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      const stageRiders: {
        playerIndex: number;
        riderType: 'sprinteur' | 'rouleur';
        seconds: number;
      }[] = [];

      entry.players.forEach((player, playerIndex) => {
        const sprinteurTime = timeToSeconds(
          player.sprinteur.time
        );

        if (sprinteurTime !== null) {
          stageRiders.push({
            playerIndex,
            riderType: 'sprinteur',
            seconds: sprinteurTime,
          });
        }

        const rouleurTime = timeToSeconds(
          player.rouleur.time
        );

        if (rouleurTime !== null) {
          stageRiders.push({
            playerIndex,
            riderType: 'rouleur',
            seconds: rouleurTime,
          });
        }
      });

      if (stageRiders.length < 2) {
        return;
      }

      const fastestTime = Math.min(
        ...stageRiders.map((rider) => rider.seconds)
      );

      stageRiders.forEach((stageRider) => {
        const timeLoss = stageRider.seconds - fastestTime;

        const rider = riders.find(
          (candidate) =>
            candidate.playerIndex === stageRider.playerIndex &&
            candidate.riderType === stageRider.riderType
        );

        if (
          rider &&
          timeLoss > rider.biggestTimeLoss
        ) {
          rider.biggestTimeLoss = timeLoss;
        }
      });
    });

  const biggestTimeLoss = Math.max(
    0,
    ...riders.map((rider) => rider.biggestTimeLoss)
  );

  if (biggestTimeLoss <= 0) {
    return null;
  }

  const winners = riders.filter(
    (rider) => rider.biggestTimeLoss === biggestTimeLoss
  );

  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'bad-day-at-the-office',
    winnerType: 'rider',
    winnerName: winner.winnerName,
    value: `+${secondsToTime(winner.biggestTimeLoss)}`,
    interestScore: winner.biggestTimeLoss,
  };
}

function pointsToNumber(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function calculatePointEater(): TourAwardResult | null {
  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        playerIndex,
        riderType: 'sprinteur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Sprinteur`,
        points: 0,
      },
      {
        playerIndex,
        riderType: 'rouleur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Rouleur`,
        points: 0,
      },
    ]
  );

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      entry.players.forEach((player, playerIndex) => {
        const sprinteur = riders.find(
          (rider) =>
            rider.playerIndex === playerIndex &&
            rider.riderType === 'sprinteur'
        );

        const rouleur = riders.find(
          (rider) =>
            rider.playerIndex === playerIndex &&
            rider.riderType === 'rouleur'
        );

        if (sprinteur) {
  sprinteur.points +=
    pointsToNumber(player.sprinteur.tourPoints) +
    pointsToNumber(player.sprinteur.sprintPoints) +
    pointsToNumber(player.sprinteur.mountainPoints);
}

if (rouleur) {
  rouleur.points +=
    pointsToNumber(player.rouleur.tourPoints) +
    pointsToNumber(player.rouleur.sprintPoints) +
    pointsToNumber(player.rouleur.mountainPoints);
}
      });
    });

  const highestPoints = Math.max(
    0,
    ...riders.map((rider) => rider.points)
  );

  if (highestPoints <= 0) {
    return null;
  }

  const winners = riders.filter(
    (rider) => rider.points === highestPoints
  );

  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'point-eater',
    winnerType: 'rider',
    winnerName: winner.winnerName,
    value: `${winner.points} points`,
    interestScore: winner.points,
  };
}

function calculateGreenMachine(): TourAwardResult | null {
  const candidates: {
    playerIndex: number;
    winnerName: string;
    points: number;
    stageNumber: number;
  }[] = [];

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      entry.players.forEach((player, playerIndex) => {
        const sprinteurPoints = pointsToNumber(
          player.sprinteur.sprintPoints
        );

        const rouleurPoints = pointsToNumber(
          player.rouleur.sprintPoints
        );

        candidates.push({
          playerIndex,
          winnerName:
            createGameDraft.playerNames[playerIndex] ||
            `Player ${playerIndex + 1}`,
          points: sprinteurPoints + rouleurPoints,
          stageNumber: entry.stageNumber,
        });
      });
    });

  const highestPoints = Math.max(
    0,
    ...candidates.map((candidate) => candidate.points)
  );

  if (highestPoints < 6) {
    return null;
  }

  const winningCandidates = candidates.filter(
    (candidate) => candidate.points === highestPoints
  );

  const winningPlayerIndexes = [
    ...new Set(
      winningCandidates.map(
        (candidate) => candidate.playerIndex
      )
    ),
  ];

  if (winningPlayerIndexes.length !== 1) {
    return null;
  }

  const winner = winningCandidates[0];

  const winningStageNumbers = winningCandidates
    .map((candidate) => candidate.stageNumber)
    .sort((a, b) => a - b);

  const stageText =
    winningStageNumbers.length === 1
      ? `stage ${winningStageNumbers[0]}`
      : `stages ${winningStageNumbers.join(', ')}`;

  return {
    id: 'green-machine',
    winnerType: 'team',
    winnerName: winner.winnerName,
    value: `${winner.points} points/${stageText}`,
    interestScore: winner.points * 10,
  };
}

function calculateGoatMode(): TourAwardResult | null {
  const candidates: {
    playerIndex: number;
    winnerName: string;
    points: number;
    stageNumber: number;
  }[] = [];

  gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .forEach((entry) => {
      entry.players.forEach((player, playerIndex) => {
        const sprinteurPoints = pointsToNumber(
          player.sprinteur.mountainPoints
        );

        const rouleurPoints = pointsToNumber(
          player.rouleur.mountainPoints
        );

        const teamPoints = sprinteurPoints + rouleurPoints;

        candidates.push({
          playerIndex,
          winnerName:
            createGameDraft.playerNames[playerIndex] ||
            `Player ${playerIndex + 1}`,
          points: teamPoints,
          stageNumber: entry.stageNumber,
        });
      });
    });

  const highestPoints = Math.max(
    0,
    ...candidates.map((candidate) => candidate.points)
  );

  if (highestPoints < 6) {
    return null;
  }

  const winningCandidates = candidates.filter(
    (candidate) => candidate.points === highestPoints
  );

  const winningPlayerIndexes = [
    ...new Set(
      winningCandidates.map(
        (candidate) => candidate.playerIndex
      )
    ),
  ];

  if (winningPlayerIndexes.length !== 1) {
    return null;
  }

  const winner = winningCandidates[0];

  return {
    id: 'goat-mode',
    winnerType: 'team',
    winnerName: winner.winnerName,
    value: `${winner.points} points/stage ${winner.stageNumber}`,
    interestScore: winner.points * 10,
  };
}

function calculateSlowAndSteady(): TourAwardResult | null {
  const stageEntries = gameResults.entries.filter(
    (entry) => entry.entryType === 'stage'
  );

  const stageCount = stageEntries.length;

  if (stageCount === 0) {
    return null;
  }

  const maxStageWins = Math.ceil(stageCount / 7);

  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        playerIndex,
        riderType: 'sprinteur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Sprinteur`,
        positions: [] as number[],
        stageWins: 0,
      },
      {
        playerIndex,
        riderType: 'rouleur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Rouleur`,
        positions: [] as number[],
        stageWins: 0,
      },
    ]
  );

  stageEntries.forEach((entry) => {
    const stageRiders = entry.players.flatMap(
      (player, playerIndex) => [
        {
          playerIndex,
          riderType: 'sprinteur' as const,
          time: timeToSeconds(player.sprinteur.time),
          tieBreakOrder: player.sprinteur.tieBreakOrder,
        },
        {
          playerIndex,
          riderType: 'rouleur' as const,
          time: timeToSeconds(player.rouleur.time),
          tieBreakOrder: player.rouleur.tieBreakOrder,
        },
      ]
    );

    const validStageRiders = stageRiders
      .filter(
        (
          rider
        ): rider is typeof rider & {
          time: number;
        } => rider.time !== null
      )
      .sort((a, b) => {
        if (a.time !== b.time) {
          return a.time - b.time;
        }

        return a.tieBreakOrder - b.tieBreakOrder;
      });

    validStageRiders.forEach((stageRider, index) => {
      const rider = riders.find(
        (candidate) =>
          candidate.playerIndex === stageRider.playerIndex &&
          candidate.riderType === stageRider.riderType
      );

      if (!rider) {
        return;
      }

      const position = index + 1;

      rider.positions.push(position);

      if (position === 1) {
        rider.stageWins += 1;
      }
    });
  });

  const candidates = riders
    .filter((rider) => {
      return (
        rider.positions.length === stageCount &&
        rider.stageWins <= maxStageWins
      );
    })
    .map((rider) => {
      const positionTotal = rider.positions.reduce(
        (sum, position) => sum + position,
        0
      );

      const averagePosition =
        positionTotal / rider.positions.length;

      const bestPosition = Math.min(...rider.positions);
      const worstPosition = Math.max(...rider.positions);
      const positionRange = worstPosition - bestPosition;

      return {
        ...rider,
        averagePosition,
        positionRange,
      };
    });

  if (candidates.length === 0) {
    return null;
  }

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (a.averagePosition !== b.averagePosition) {
      return a.averagePosition - b.averagePosition;
    }

    return a.positionRange - b.positionRange;
  });

  const winner = sortedCandidates[0];
  const runnerUp = sortedCandidates[1];

  const hasTie =
    runnerUp &&
    winner.averagePosition === runnerUp.averagePosition &&
    winner.positionRange === runnerUp.positionRange;

  if (hasTie) {
    return null;
  }

  return {
    id: 'slow-and-steady',
    winnerType: 'rider',
    winnerName: winner.winnerName,
    value: ``,
    interestScore: Math.round(
      1000 /
        (winner.averagePosition + winner.positionRange + 1)
    ),
  };
}

function calculatePointGazerAward(): TourAwardResult | null {
  const stageEntries = gameResults.entries.filter(
    (entry) => entry.entryType === 'stage'
  );

  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        playerIndex,
        riderType: 'sprinteur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Sprinteur`,
        fourthPlaces: 0,
      },
      {
        playerIndex,
        riderType: 'rouleur' as const,
        winnerName: `${
          playerName || `Player ${playerIndex + 1}`
        } - Rouleur`,
        fourthPlaces: 0,
      },
    ]
  );

  stageEntries.forEach((entry) => {
    const stageRiders = entry.players.flatMap(
      (player, playerIndex) => [
        {
          playerIndex,
          riderType: 'sprinteur' as const,
          time: timeToSeconds(player.sprinteur.time),
        },
        {
          playerIndex,
          riderType: 'rouleur' as const,
          time: timeToSeconds(player.rouleur.time),
        },
      ]
    );

    const validStageRiders = stageRiders.filter(
      (
        rider
      ): rider is typeof rider & {
        time: number;
      } => rider.time !== null
    );

    /*
     * Vi finder de forskellige tider i stigende rækkefølge.
     * Dermed er index 3 den fjerdebedste tid, også selvom
     * flere ryttere deler en af de bedre tider.
     */
    const uniqueTimes = [
      ...new Set(validStageRiders.map((rider) => rider.time)),
    ].sort((a, b) => a - b);

    const fourthBestTime = uniqueTimes[3];

    if (fourthBestTime === undefined) {
      return;
    }

    const fourthPlaceRiders = validStageRiders.filter(
      (rider) => rider.time === fourthBestTime
    );

    fourthPlaceRiders.forEach((fourthPlaceRider) => {
      const rider = riders.find(
        (candidate) =>
          candidate.playerIndex === fourthPlaceRider.playerIndex &&
          candidate.riderType === fourthPlaceRider.riderType
      );

      if (rider) {
        rider.fourthPlaces += 1;
      }
    });
  });

  const highestFourthPlaceCount = Math.max(
    ...riders.map((rider) => rider.fourthPlaces)
  );

  if (highestFourthPlaceCount < 2) {
  return null;
}

  const winners = riders.filter(
    (rider) => rider.fourthPlaces === highestFourthPlaceCount
  );

  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'point-gazer',
    winnerType: 'rider',
    winnerName: winner.winnerName,
    value:
      winner.fourthPlaces === 1
        ? '1 fourth place'
        : `${winner.fourthPlaces} fourth places`,
    interestScore: winner.fourthPlaces,
  };
}

function calculateBonusCollectorAward(): TourAwardResult | null {
  const riders = calculateRiderBonusPoints();

  if (riders.length === 0) {
    return null;
  }

  const highestBonusPoints = Math.max(
    ...riders.map((rider) => rider.bonusPoints)
  );

  if (highestBonusPoints < 3) {
    return null;
  }

  const winners = riders.filter(
    (rider) => rider.bonusPoints === highestBonusPoints
  );

  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'bonus-collector',
    winnerType: 'rider',
    winnerName: winner.riderName,
    value: `${winner.bonusPoints} bonus points`,
    interestScore: winner.bonusPoints,
  };
}

function calculateFlyingStartAward(): TourAwardResult | null {
  const totalStages = Number(createGameDraft.stages || 21);

  const stagesToCheck =
    totalStages <= 7
      ? 3
      : totalStages <= 14
        ? 4
        : 5;

  const earlyStages = gameResults.entries
    .filter((entry) => entry.entryType !== 'restDay')
    .slice(0, stagesToCheck);

  if (earlyStages.length === 0) {
    return null;
  }

  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        riderName: `${playerName || `Player ${playerIndex + 1}`} - Sprinteur`,
        playerIndex,
        riderType: 'sprinteur' as const,
        points: 0,
      },
      {
        riderName: `${playerName || `Player ${playerIndex + 1}`} - Rouleur`,
        playerIndex,
        riderType: 'rouleur' as const,
        points: 0,
      },
    ]
  );

  earlyStages.forEach((entry) => {
    riders.forEach((rider) => {
      const player = entry.players[rider.playerIndex];

      if (!player) {
        return;
      }

      const stagePoints = Number(
        player[rider.riderType].tourPoints || 0
      );

      rider.points += stagePoints;
    });
  });

  const highestPoints = Math.max(
    ...riders.map((rider) => rider.points)
  );

  // Ingen award, hvis ingen har fået point
  if (highestPoints <= 0) {
    return null;
  }

  const winners = riders.filter(
    (rider) => rider.points === highestPoints
  );

  // Ingen award ved delt førsteplads
  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'flying-start',
    winnerType: 'rider',
    winnerName: winner.riderName,
    value:
      winner.points === 1
        ? '1 point in the opening stages'
        : `${winner.points} points`,
    interestScore: winner.points,
  };
}

function calculateStrongFinishAward(): TourAwardResult | null {
  const totalStages = Number(createGameDraft.stages || 21);

  const stagesToCheck =
    totalStages <= 7
      ? 3
      : totalStages <= 14
        ? 4
        : 5;

  const finalStages = gameResults.entries
    .filter((entry) => entry.entryType !== 'restDay')
    .slice(-stagesToCheck);

  if (finalStages.length === 0) {
    return null;
  }

  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        riderName: `${playerName || `Player ${playerIndex + 1}`} - Sprinteur`,
        playerIndex,
        riderType: 'sprinteur' as const,
        points: 0,
      },
      {
        riderName: `${playerName || `Player ${playerIndex + 1}`} - Rouleur`,
        playerIndex,
        riderType: 'rouleur' as const,
        points: 0,
      },
    ]
  );

  finalStages.forEach((entry) => {
    riders.forEach((rider) => {
      const player = entry.players[rider.playerIndex];

      if (!player) {
        return;
      }

      rider.points += Number(
        player[rider.riderType].tourPoints || 0
      );
    });
  });

  const highestPoints = Math.max(
    ...riders.map((rider) => rider.points)
  );

  if (highestPoints <= 0) {
    return null;
  }

  const winners = riders.filter(
    (rider) => rider.points === highestPoints
  );

  // Ingen award ved delt førsteplads
  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'strong-finish',
    winnerType: 'rider',
    winnerName: winner.riderName,
    value:
      winner.points === 1
        ? '1 point in the final stages'
        : `${winner.points} points`,
    interestScore: winner.points,
  };
}

function calculateNeverLeaveYourWingmanAward(): TourAwardResult | null {
  const teams = createGameDraft.playerNames.map((playerName, playerIndex) => ({
    playerName: playerName || `Player ${playerIndex + 1}`,
    totalGap: 0,
    stagesCounted: 0,
  }));

  gameResults.entries
    .filter((entry) => entry.entryType !== 'restDay')
    .forEach((entry) => {
      teams.forEach((team, playerIndex) => {
        const player = entry.players[playerIndex];

        if (!player) {
          return;
        }

        const sprinteurTime = timeToSeconds(player.sprinteur.time);
        const rouleurTime = timeToSeconds(player.rouleur.time);

        if (sprinteurTime === null || rouleurTime === null) {
          return;
        }

        team.totalGap += Math.abs(sprinteurTime - rouleurTime);
        team.stagesCounted++;
      });
    });

  const validTeams = teams
    .filter((team) => team.stagesCounted >= 2)
    .map((team) => ({
      ...team,
      averageGap: team.totalGap / team.stagesCounted,
    }));

  if (validTeams.length === 0) {
    return null;
  }

  const lowestGap = Math.min(
    ...validTeams.map((team) => team.averageGap)
  );

  const winners = validTeams.filter(
    (team) => team.averageGap === lowestGap
  );

  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'never-leave-your-wingman',
    winnerType: 'team',
    winnerName: winner.playerName,
    value: `${winner.averageGap.toFixed(1)} sec avg. gap`,
    interestScore: 1000 - winner.averageGap,
  };
}

function calculateEveryManForHimselfAward(): TourAwardResult | null {
  const teams = createGameDraft.playerNames.map((playerName, playerIndex) => ({
    playerName: playerName || `Player ${playerIndex + 1}`,
    totalGap: 0,
    stagesCounted: 0,
  }));

  gameResults.entries
    .filter((entry) => entry.entryType !== 'restDay')
    .forEach((entry) => {
      teams.forEach((team, playerIndex) => {
        const player = entry.players[playerIndex];

        if (!player) {
          return;
        }

        const sprinteurTime = timeToSeconds(player.sprinteur.time);
        const rouleurTime = timeToSeconds(player.rouleur.time);

        if (sprinteurTime === null || rouleurTime === null) {
          return;
        }

        team.totalGap += Math.abs(sprinteurTime - rouleurTime);
        team.stagesCounted++;
      });
    });

  const validTeams = teams
    .filter((team) => team.stagesCounted >= 2)
    .map((team) => ({
      ...team,
      averageGap: team.totalGap / team.stagesCounted,
    }));

  if (validTeams.length === 0) {
    return null;
  }

  const highestGap = Math.max(
    ...validTeams.map((team) => team.averageGap)
  );

  const winners = validTeams.filter(
    (team) => team.averageGap === highestGap
  );

  // Ingen award ved delt førsteplads
  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'every-man-for-himself',
    winnerType: 'team',
    winnerName: winner.playerName,
    value: `${winner.averageGap.toFixed(1)} sec avg gap`,
    interestScore: winner.averageGap,
  };
}

function calculateIceColdAward(): TourAwardResult | null {
  const stageEntries = gameResults.entries.filter(
    (entry) => entry.entryType !== 'restDay'
  );

  if (stageEntries.length === 0) {
    return null;
  }

  const riders = createGameDraft.playerNames.flatMap(
    (playerName, playerIndex) => [
      {
        riderName: `${playerName || `Player ${playerIndex + 1}`} - Sprinteur`,
        playerIndex,
        riderType: 'sprinteur' as const,
      },
      {
        riderName: `${playerName || `Player ${playerIndex + 1}`} - Rouleur`,
        playerIndex,
        riderType: 'rouleur' as const,
      },
    ]
  );

  const riderResults = riders.map((rider) => {
    const pointsByStage = stageEntries.map((entry) => {
      const player = entry.players[rider.playerIndex];

      if (!player) {
        return 0;
      }

      return Number(
        player[rider.riderType].tourPoints || 0
      );
    });

    const hasScoredPoints = pointsByStage.some(
      (points) => points > 0
    );

    let currentColdStreak = 0;
    let longestColdStreak = 0;

    pointsByStage.forEach((points) => {
      if (points > 0) {
        currentColdStreak = 0;
      } else {
        currentColdStreak++;

        longestColdStreak = Math.max(
          longestColdStreak,
          currentColdStreak
        );
      }
    });

    return {
      riderName: rider.riderName,
      hasScoredPoints,
      longestColdStreak,
      pointsByStage,
    };
  });

  console.log('ICE COLD RESULTS', riderResults);

  const eligibleRiders = riderResults.filter(
    (rider) =>
      rider.hasScoredPoints &&
      rider.longestColdStreak >= 3
  );

  if (eligibleRiders.length === 0) {
    return null;
  }

  const longestColdStreak = Math.max(
    ...eligibleRiders.map(
      (rider) => rider.longestColdStreak
    )
  );

  const winners = eligibleRiders.filter(
    (rider) =>
      rider.longestColdStreak === longestColdStreak
  );

  if (winners.length !== 1) {
    return null;
  }

  const winner = winners[0];

  return {
    id: 'ice-cold',
    winnerType: 'rider',
    winnerName: winner.riderName,
    value: `${winner.longestColdStreak} stages without points`,
    interestScore: winner.longestColdStreak,
  };
}


function getAwardPlayerName(award: TourAwardResult): string {
  if (award.winnerType === 'rider') {
    return award.winnerName.split(' - ')[0];
  }

  return award.winnerName;
}

function selectTourAwards(
  availableAwards: TourAwardResult[]
): TourAwardResult[] {
  const totalStages = Number(createGameDraft.stages || 21);

  const maxAwards =
    totalStages <= 7
      ? 5
      : totalStages <= 14
        ? 6
        : 7;

  const numberOfAwardsToSelect = Math.min(
    maxAwards,
    availableAwards.length
  );

  if (availableAwards.length <= numberOfAwardsToSelect) {
    return availableAwards;
  }

  let bestCombination: TourAwardResult[] = [];
  let bestUniquePlayerCount = -1;
  let bestHighestPlayerAwardCount = Infinity;
  let bestSpreadScore = Infinity;
  let bestInterestScore = -Infinity;

  function evaluateCombination(
    combination: TourAwardResult[]
  ) {
    const awardsPerPlayer = new Map<string, number>();

    combination.forEach((award) => {
      const playerName = getAwardPlayerName(award);

      awardsPerPlayer.set(
        playerName,
        (awardsPerPlayer.get(playerName) || 0) + 1
      );
    });

    const playerAwardCounts = [...awardsPerPlayer.values()];

    const uniquePlayerCount = awardsPerPlayer.size;

    const highestPlayerAwardCount = Math.max(
      ...playerAwardCounts
    );

    /*
     * Lavere score betyder en mere jævn fordeling.
     *
     * Eksempel:
     * [2, 1, 1, 1] => 7
     * [3, 1, 1]    => 11
     */
    const spreadScore = playerAwardCounts.reduce(
      (total, count) => total + count * count,
      0
    );

    const interestScore = combination.reduce(
      (total, award) => total + award.interestScore,
      0
    );

    const isBetter =
      uniquePlayerCount > bestUniquePlayerCount ||
      (
        uniquePlayerCount === bestUniquePlayerCount &&
        highestPlayerAwardCount < bestHighestPlayerAwardCount
      ) ||
      (
        uniquePlayerCount === bestUniquePlayerCount &&
        highestPlayerAwardCount === bestHighestPlayerAwardCount &&
        spreadScore < bestSpreadScore
      ) ||
      (
        uniquePlayerCount === bestUniquePlayerCount &&
        highestPlayerAwardCount === bestHighestPlayerAwardCount &&
        spreadScore === bestSpreadScore &&
        interestScore > bestInterestScore
      );

    if (!isBetter) {
      return;
    }

    bestCombination = combination;
    bestUniquePlayerCount = uniquePlayerCount;
    bestHighestPlayerAwardCount = highestPlayerAwardCount;
    bestSpreadScore = spreadScore;
    bestInterestScore = interestScore;
  }

  function buildCombinations(
    startIndex: number,
    currentCombination: TourAwardResult[]
  ) {
    if (
      currentCombination.length === numberOfAwardsToSelect
    ) {
      evaluateCombination(currentCombination);
      return;
    }

    const awardsStillNeeded =
      numberOfAwardsToSelect - currentCombination.length;

    for (
      let index = startIndex;
      index <= availableAwards.length - awardsStillNeeded;
      index++
    ) {
      buildCombinations(
        index + 1,
        [
          ...currentCombination,
          availableAwards[index],
        ]
      );
    }
  }

  buildCombinations(0, []);

  return bestCombination;
}

export function calculateTourAwards(): TourAward[] {
   const availableAwards = [
    calculateMostStageWins(),
calculateHeartbreakAward(),
calculateFlatTireAward(),
calculateBadDayAtTheOffice(),
calculatePointEater(),
calculateGreenMachine(),
calculateGoatMode(),
calculateSlowAndSteady(),
calculatePointGazerAward(),
calculateBonusCollectorAward(),
calculateFlyingStartAward(),
calculateStrongFinishAward(),
calculateNeverLeaveYourWingmanAward(),
calculateEveryManForHimselfAward(),
calculateIceColdAward(),
   ].filter(
    (result): result is TourAwardResult =>
      result !== null
  );

  const selectedAwards =
    selectTourAwards(availableAwards);

  return selectedAwards.map((result) => ({
    ...awardDefinitions[result.id],
    ...result,
  }));
}

