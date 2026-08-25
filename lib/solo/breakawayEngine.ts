import type {
  BreakawayBidState,
  BreakawayMode,
  SoloRiderKey,
  SoloStageState,
  SoloStageType,
} from './soloGameTypes';

import { getTeamTourPosition } from '@/lib/classifications';
import { createGameDraft } from '@/lib/createGameDraft';

import type {
  DummyCard,
  DummyRiderState,
} from './dummyDeckEngine';

import {
  createFatigueCard,
  shuffle,
} from './dummyDeckEngine';

export function startBreakaway(
  soloStage: SoloStageState,
  mode: BreakawayMode
): void {
  soloStage.breakaway = {
    mode,
    completed: mode === 'none',
    phase: 'rider-selection',
    bids: [],
    winnerIds: [],
  };
}

export function selectBreakawayRider(
  soloStage: SoloStageState,
  teamId: string,
  riderKey: SoloRiderKey
): void {
  const existingBid = soloStage.breakaway.bids.find(
    (bid) => bid.teamId === teamId
  );

  if (existingBid) {
    existingBid.riderKey = riderKey;
    existingBid.bid1CardId = undefined;
    existingBid.bid1Value = undefined;
    existingBid.bid2CardId = undefined;
    existingBid.bid2Value = undefined;
    existingBid.totalBid = 0;
    return;
  }

  soloStage.breakaway.bids.push({
    teamId,
    riderKey,
    totalBid: 0,
  });
}

export function drawBreakawayHand(
  rider: DummyRiderState
): DummyCard[] {
  if (rider.pendingHand.length > 0) {
    return [...rider.pendingHand];
  }

  const cards: DummyCard[] = [];

  while (cards.length < 4 && rider.deck.length > 0) {
    const card = rider.deck.shift();

    if (card) {
      cards.push(card);
    }
  }

  rider.pendingHand = [...cards];

  return cards;
}

export function selectBreakawayBidCard(
  rider: DummyRiderState,
  drawnCards: DummyCard[],
  selectedCard: DummyCard
): void {
  const selectedCardExists = drawnCards.some(
    (card) => card.id === selectedCard.id
  );

  if (!selectedCardExists) {
    return;
  }

  const unselectedCards = drawnCards.filter(
    (card) => card.id !== selectedCard.id
  );

  rider.discard.push(selectedCard);
  rider.setAside.push(...unselectedCards);
  rider.pendingHand = [];
}

export function registerBreakawayBid(
  bid: BreakawayBidState,
  selectedCard: DummyCard
): void {
  if (bid.bid1CardId === undefined) {
    bid.bid1CardId = selectedCard.id;
    bid.bid1Value = selectedCard.value;
  } else if (bid.bid2CardId === undefined) {
    bid.bid2CardId = selectedCard.id;
    bid.bid2Value = selectedCard.value;
  } else {
    return;
  }

  bid.totalBid =
    (bid.bid1Value ?? 0) +
    (bid.bid2Value ?? 0);
}

export function resolveBreakawayRider(
  rider: DummyRiderState,
  bid: BreakawayBidState,
  isWinner: boolean
): void {
  const bidCardIds = [
    bid.bid1CardId,
    bid.bid2CardId,
  ].filter(Boolean) as string[];

  const bidCards = rider.discard.filter(
    (card) => bidCardIds.includes(card.id)
  );

  const otherDiscardCards = rider.discard.filter(
    (card) => !bidCardIds.includes(card.id)
  );

  if (isWinner) {
    // The two bid cards stay played/discarded.
    rider.deck.push(...rider.setAside);

    rider.deck.push(
      createFatigueCard(),
      createFatigueCard()
    );

    rider.setAside = [];

    rider.discard = [
      ...otherDiscardCards,
      ...bidCards,
    ];
  } else {
    // Losing rider gets all breakaway cards back.
    rider.deck.push(
      ...rider.setAside,
      ...bidCards
    );

    rider.setAside = [];

    rider.discard = otherDiscardCards;
  }

  rider.deck = shuffle(rider.deck);
}

export function resolveBreakaway(
  soloStage: SoloStageState,
  winnerTeamIds: string[]
): void {
  for (const bid of soloStage.breakaway.bids) {
    const team = soloStage.teams.find(
      (team) => team.teamId === bid.teamId
    );

    if (!team) {
      continue;
    }

    const rider =
      bid.riderKey === 'sprinteur'
        ? team.sprinteur
        : team.rouleur;

    if (!rider) {
      continue;
    }

    const isWinner = winnerTeamIds.includes(bid.teamId);

    resolveBreakawayRider(
      rider,
      bid,
      isWinner
    );
  }

  soloStage.breakaway.winnerIds = winnerTeamIds;
  soloStage.breakaway.completed = true;
}

export function chooseRandomBreakawayRider(): SoloRiderKey {
  return Math.random() < 0.5
    ? 'sprinteur'
    : 'rouleur';
}

export function selectAIRidersForBreakaway(
  soloStage: SoloStageState
): void {
  soloStage.teams.forEach((team) => {
    if (team.teamType !== 'normal-ai') {
      return;
    }

    const riderKey = chooseRandomBreakawayRider();

    selectBreakawayRider(
      soloStage,
      team.teamId,
      riderKey
    );
  });
}

export function getBreakawayTarget(
  playerIndex: number,
  stageType: SoloStageType
): number {
  const playerCount = createGameDraft.playerNames.length;
  const teamPosition = getTeamTourPosition(playerIndex);

  const positionFromLast =
    playerCount - teamPosition + 1;

  let target: number;

  if (playerCount <= 4) {
    const targetsFromLast = [5, 6, 7, 8];

    target =
      targetsFromLast[positionFromLast - 1] ?? 5;
  } else {
    const targetsFromLast = [5, 6, 6, 7, 8, 8];

    target =
      targetsFromLast[positionFromLast - 1] ?? 5;
  }

  if (stageType === 'cobbles') {
    if (target === 7) {
      target = 8;
    } else if (target === 8) {
      target = 9;
    }
  }

  return target;
}

export function chooseBreakawayRiderByFatigue(
  sprinteur: DummyRiderState,
  rouleur: DummyRiderState
): SoloRiderKey {
  const sprinteurFatigue =
    sprinteur.deck.filter(
      (card) => card.type === 'fatigue'
    ).length;

  const rouleurFatigue =
    rouleur.deck.filter(
      (card) => card.type === 'fatigue'
    ).length;

  if (sprinteurFatigue < rouleurFatigue) {
    return 'sprinteur';
  }

  if (rouleurFatigue < sprinteurFatigue) {
    return 'rouleur';
  }

  return Math.random() < 0.5
    ? 'sprinteur'
    : 'rouleur';
}

function getBreakawayPlayableCards(
  cards: DummyCard[]
): DummyCard[] {
  const nonSpecialCards = cards.filter(
    (card) => !card.isSpecial
  );

  return nonSpecialCards.length > 0
    ? nonSpecialCards
    : cards;
}

export function chooseAIBreakawayBid1Card(
  cards: DummyCard[],
  target: number
): DummyCard {
  const playableCards =
    getBreakawayPlayableCards(cards);

  if (target <= 6) {
    const lowestValue = Math.min(
      ...playableCards.map((card) => card.value)
    );

    const candidates = playableCards.filter(
  (card) => card.value === lowestValue
);

const fatigueCandidates = candidates.filter(
  (card) => card.type === 'fatigue'
);

const finalCandidates =
  fatigueCandidates.length > 0
    ? fatigueCandidates
    : candidates;

return finalCandidates[
  Math.floor(Math.random() * finalCandidates.length)
];
  }

  const desiredValue =
    target === 7 ? 3 : 4;

  const bestDistance = Math.min(
    ...playableCards.map(
      (card) =>
        Math.abs(card.value - desiredValue)
    )
  );

  const candidates = playableCards.filter(
    (card) =>
      Math.abs(card.value - desiredValue) ===
      bestDistance
  );

  return candidates[
    Math.floor(Math.random() * candidates.length)
  ];
}

export function chooseAIBreakawayBid2Card(
  cards: DummyCard[],
  target: number,
  bid1Value: number
): DummyCard {
  const playableCards =
    getBreakawayPlayableCards(cards);

  const remainingTarget =
    target - bid1Value;

  const bestDistance = Math.min(
    ...playableCards.map(
      (card) =>
        Math.abs(card.value - remainingTarget)
    )
  );

  const candidates = playableCards.filter(
    (card) =>
      Math.abs(card.value - remainingTarget) ===
      bestDistance
  );

  const fatigueCandidates = candidates.filter(
    (card) => card.type === 'fatigue'
  );

  const finalCandidates =
    fatigueCandidates.length > 0
      ? fatigueCandidates
      : candidates;

  return finalCandidates[
    Math.floor(Math.random() * finalCandidates.length)
  ];
}
