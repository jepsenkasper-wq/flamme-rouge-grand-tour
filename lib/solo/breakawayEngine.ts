import type {
  BreakawayBidState,
  BreakawayMode,
  SoloRiderKey,
  SoloStageState,
} from './soloGameTypes';

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
