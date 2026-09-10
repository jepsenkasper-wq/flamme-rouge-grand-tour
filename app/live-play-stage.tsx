import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Text,
  View,
} from 'react-native';

import { router, Stack } from 'expo-router';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';

import {
  fetchLiveStageState,
  subscribeToLiveStageState,
  unsubscribeFromLiveStageState,
  updateLiveStageSetup,
  selectLiveBreakawayRider,
  drawLiveBreakawayHand,
  startLiveBreakawayBid1,
  submitLiveBreakawayBid1,
  submitLiveBreakawayBid2,
  resolveLiveBreakaway,
  getLiveBreakawayPendingHand,
  fetchLivePlayers,
  type LiveStageState,
  LivePlayer,
} from '@/lib/live/liveGames';

import type {
  DummyCard,
} from '@/lib/solo/dummyDeckEngine';

import { getActiveLiveGameSession } from '@/lib/live/activeLiveGame';
import { createGameDraft } from '@/lib/createGameDraft';

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};



export default function LivePlayStageScreen() {
  const [stageState, setStageState] =
    useState<LiveStageState | null>(null);

const [players, setPlayers] =
  useState<LivePlayer[]>([]);


  const [loading, setLoading] =
    useState(true);

  const [bid1Hand, setBid1Hand] = useState<
  DummyCard[]
>([]);  

const [selectedBid1CardId, setSelectedBid1CardId] =
  useState<string | null>(null);

  const [bid2Hand, setBid2Hand] = useState<
  DummyCard[]
>([]);

const [selectedBid2CardId, setSelectedBid2CardId] =
  useState<string | null>(null);

const [selectedBreakawayWinnerIds, setSelectedBreakawayWinnerIds] =
  useState<string[]>([]);

  const liveSession =
    getActiveLiveGameSession();


  useEffect(() => {
    if (!liveSession) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadStageState() {
      try {
 const [state, livePlayers, pendingHand] =
  await Promise.all([
    fetchLiveStageState(
      liveSession!.gameId
    ),
    fetchLivePlayers(
      liveSession!.gameId
    ),
    getLiveBreakawayPendingHand(
      liveSession!.gameId
    ),
  ]);

if (active) {
  setStageState(state);
  setPlayers(livePlayers);

  const myBid = state?.breakaway.bids.find(
    (bid) =>
      bid.teamId === liveSession!.playerId
  );

  if (
    state?.breakaway.phase === 'bid-1' &&
    !myBid?.bid1Submitted
  ) {
    setBid1Hand(pendingHand);
  }

  if (
    state?.breakaway.phase === 'bid-2' &&
    !myBid?.bid2Submitted
  ) {
    setBid2Hand(pendingHand);
  }

  setLoading(false);
}
      } catch (error) {
        console.error(
          'FETCH LIVE STAGE STATE ERROR',
          error
        );

        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStageState();

    const channel =
      subscribeToLiveStageState(
        liveSession.gameId,
        () => {
          void loadStageState();
        }
      );

    return () => {
      active = false;

      void unsubscribeFromLiveStageState(
        channel
      );
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!liveSession || !stageState) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>
          Live Play
        </Text>

        <Text style={styles.text}>
          Stage information could not be loaded.
        </Text>
      </View>
    );
  }

  const myBreakawayBid =
  stageState.breakaway.bids.find(
    (bid) =>
      bid.teamId === liveSession.playerId
  );

const myBreakawayRider =
  myBreakawayBid?.riderKey;

const selectedRiderCount =
  stageState.breakaway.bids.length;

const requiredRiderCount =
  createGameDraft.playerNames.length;

const allRidersSelected =
  selectedRiderCount >= requiredRiderCount;

  return (
  <View style={styles.screen}>
    <Stack.Screen
  options={{
    headerBackVisible: false,
    headerLeft: () => (
  <Pressable
    onPress={() => {
      router.replace('/(tabs)');
    }}
    style={{
      width: 56,
      height: 44,
      justifyContent: 'center',
      paddingLeft: 8,
    }}
    hitSlop={10}
  >
    <Text
      style={{
        fontSize: 32,
        lineHeight: 32,
      }}
    >
      ‹
    </Text>
  </Pressable>
),
  }}
/>
    <BackgroundWatermark />

    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.title}>
        Stage {stageState.stageNumber}
      </Text>

      <View style={styles.card}>
        {stageState.breakaway.phase ===
  'rider-selection' && (
  <>
  <Text style={styles.sectionTitle}>
    Race Type
  </Text>

  <View style={styles.optionRow}>
    {[
      { key: 'normal', label: 'Normal' },
      { key: 'time-trial', label: 'Time Trial' },
      {
        key: 'team-time-trial',
        label: 'Team Time Trial',
      },
    ].map((option) => {
      const isSelected =
        stageState.raceType === option.key;

      return (
        <Pressable
          key={option.key}
          disabled={!liveSession.isAdmin}
          style={[
            styles.optionButton,
            isSelected &&
              styles.optionButtonActive,
            !liveSession.isAdmin &&
              styles.optionButtonDisabled,
          ]}
          onPress={async () => {
            await updateLiveStageSetup(
              liveSession.gameId,
              {
                raceType:
                  option.key as LiveStageState['raceType'],
              }
            );
          }}
        >
          <Text
            style={[
              styles.optionText,
              isSelected &&
                styles.optionTextActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>

  <Text style={styles.sectionTitle}>
    Stage Profile (relevant for AI riders)
  </Text>

  <View style={styles.optionRow}>
    {[
      { key: 'standard', label: 'Standard' },
      { key: 'flat', label: 'Flat' },
      { key: 'hilly', label: 'Hills' },
      { key: 'mountain', label: 'Mountain' },
      { key: 'cobbles', label: 'Cobbles' },
    ].map((option) => {
      const isSelected =
        stageState.stageType === option.key;

      return (
        <Pressable
          key={option.key}
          disabled={!liveSession.isAdmin}
          style={[
            styles.optionButton,
            isSelected &&
              styles.optionButtonActive,
            !liveSession.isAdmin &&
              styles.optionButtonDisabled,
          ]}
          onPress={async () => {
            await updateLiveStageSetup(
              liveSession.gameId,
              {
                stageType:
                  option.key as LiveStageState['stageType'],
              }
            );
          }}
        >
          <Text
            style={[
              styles.optionText,
              isSelected &&
                styles.optionTextActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>

<Text style={styles.sectionTitle}>
  Breakaway
</Text>

<View style={styles.optionRow}>
  {[
    { key: 'none', label: 'No Breakaway' },
    { key: 'one', label: 'Breakaway' },
  ].map((option) => {
    const isSelected =
      stageState.breakaway.mode === option.key;

    return (
      <Pressable
        key={option.key}
        disabled={!liveSession.isAdmin}
        style={[
          styles.optionButton,
          isSelected &&
            styles.optionButtonActive,
          !liveSession.isAdmin &&
            styles.optionButtonDisabled,
        ]}
        onPress={async () => {
          await updateLiveStageSetup(
            liveSession.gameId,
            {
              breakawayMode:
                option.key as LiveStageState['breakaway']['mode'],
            }
          );
        }}
      >
        <Text
          style={[
            styles.optionText,
            isSelected &&
              styles.optionTextActive,
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  })}
</View>

{stageState.breakaway.mode === 'one' && (
  <View style={styles.breakawaySelection}>
    <Text style={styles.sectionTitle}>
      Your Breakaway Rider
    </Text>

    <Text style={styles.helperText}>
      Choose which rider will attempt to join the breakaway.
    </Text>

    <View style={styles.optionRow}>
      {[
        {
          key: 'sprinteur',
          label: 'Sprinteur',
        },
        {
          key: 'rouleur',
          label: 'Rouleur',
        },
      ].map((option) => {
        const isSelected =
          myBreakawayRider === option.key;

        return (
          <Pressable
            key={option.key}
            style={[
              styles.optionButton,
              isSelected &&
                styles.optionButtonActive,
            ]}
            onPress={async () => {
              await selectLiveBreakawayRider(
                liveSession.gameId,
                liveSession.playerId,
                option.key as
                  | 'sprinteur'
                  | 'rouleur'
              );
            }}
          >
            <Text
              style={[
                styles.optionText,
                isSelected &&
                  styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
)}

<Text style={styles.readyText}>
  {selectedRiderCount}/{requiredRiderCount} riders selected
</Text>

{liveSession.isAdmin && (
  <Pressable
    disabled={!allRidersSelected}
    style={[
      styles.continueButton,
      !allRidersSelected &&
        styles.continueButtonDisabled,
    ]}
    onPress={() =>
      startLiveBreakawayBid1(
        liveSession.gameId
      )
    }
  >
    <Text style={styles.continueButtonText}>
      Continue to Bid 1
    </Text>
  </Pressable>
)}
</>
)}
</View>

{stageState.breakaway.phase === 'bid-1' && (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>
      Breakaway – Bid 1
    </Text>

    {myBreakawayBid?.bid1Submitted ? (
      <Text style={styles.helperText}>
        Waiting for other players...
      </Text>
    ) : bid1Hand.length === 0 ? (
      <Pressable
        style={styles.button}
        onPress={async () => {
          try {
            const cards =
              await drawLiveBreakawayHand(
                liveSession.gameId
              );

            setBid1Hand(cards);
          } catch (error) {
            console.error(
              'DRAW LIVE BREAKAWAY HAND ERROR',
              error
            );
          }
        }}
      >
        <Text style={styles.buttonText}>
          DRAW CARDS
        </Text>
      </Pressable>
    ) : (
      <View style={styles.handRow}>
        {bid1Hand.map((card) => {
          const isSelected =
            selectedBid1CardId === card.id;

          return (
            <Pressable
              key={card.id}
              style={[
                styles.handCard,
                isSelected &&
                  styles.handCardSelected,
              ]}
              onPress={() =>
                setSelectedBid1CardId(card.id)
              }
            >
              <Text style={styles.cardValue}>
                {card.displayValue ?? card.value}
              </Text>
            </Pressable>
          );
        })}
      </View>
    )}

    {!myBreakawayBid?.bid1Submitted &&
      selectedBid1CardId && (
        <Pressable
          style={styles.button}
          onPress={async () => {
            try {
              await submitLiveBreakawayBid1(
                liveSession.gameId,
                selectedBid1CardId
              );

              setBid1Hand([]);
              setSelectedBid1CardId(null);
            } catch (error) {
              console.error(
                'SUBMIT LIVE BREAKAWAY BID 1 ERROR',
                error
              );
            }
          }}
        >
          <Text style={styles.buttonText}>
            SUBMIT BID 1
          </Text>
        </Pressable>
      )}
  </View>
)}

{(
  stageState.breakaway.phase === 'bid-1-results' ||
  stageState.breakaway.phase === 'bid-2' ||
  stageState.breakaway.phase === 'bid-2-results'
) && (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>
      Breakaway – Bid 1 Results
    </Text>

    {stageState.breakaway.bids.map((bid) => {
      const player = players.find(
        (player) => player.id === bid.teamId
      );

      if (!player) {
        return null;
      }

      const riderLabel =
        bid.riderKey === 'sprinteur'
          ? 'Sprinteur'
          : 'Rouleur';

      return (
        <Pressable
  key={bid.teamId}
disabled={
  !liveSession.isAdmin ||
  stageState.breakaway.phase !==
    'bid-2-results' ||
  stageState.breakaway.completed
}   
 style={[
  styles.row,
  (
    selectedBreakawayWinnerIds.includes(
      bid.teamId
    ) ||
    (
      stageState.breakaway.completed &&
      stageState.breakaway.winnerIds.includes(
        bid.teamId
      )
    )
  ) &&
    styles.breakawayWinnerSelected,
]}
  onPress={() => {
    setSelectedBreakawayWinnerIds(
      (current) => {
        if (current.includes(bid.teamId)) {
          return current.filter(
            (id) => id !== bid.teamId
          );
        }

        if (current.length >= 2) {
          return current;
        }

        return [...current, bid.teamId];
      }
    );
  }}
>
          <Image
            source={
  riderImages[player.color ?? 'Blue']
}
            style={styles.avatar}
          />

          <View style={styles.rowInfo}>
            <Text style={styles.rowText}>
              {player.name} - {riderLabel}
            </Text>

            <Text style={styles.rowSubText}>
  Bid 1: {bid.bid1Value ?? '-'} • Bid 2:{' '}
  {bid.bid2Value ?? '-'}
</Text>
          </View>

          <Text
            style={styles.breakawayBidValue}
          >
            {bid.totalBid ?? bid.bid1Value ?? '-'}
          </Text>
          
        </Pressable>
        
      );
      
    })}

    {stageState.breakaway.completed && (
  <Text style={styles.helperText}>
    Breakaway confirmed
  </Text>
)}

    {liveSession.isAdmin &&
  stageState.breakaway.phase ===
    'bid-2-results' &&
  !stageState.breakaway.completed &&
  selectedBreakawayWinnerIds.length >= 1 && (
    <Pressable
      style={styles.button}
     onPress={async () => {
  try {
    await resolveLiveBreakaway(
      liveSession.gameId,
      selectedBreakawayWinnerIds
    );

    setSelectedBreakawayWinnerIds([]);
  } catch (error) {
    console.error(
      'RESOLVE LIVE BREAKAWAY ERROR',
      error
    );
  }
}}
    >
      <Text style={styles.buttonText}>
        CONFIRM BREAKAWAY
      </Text>
    </Pressable>
  )}
{stageState.breakaway.phase === 'bid-2' && (
  <>
    {myBreakawayBid?.bid2Submitted ? (
      <Text style={styles.helperText}>
        Waiting for other players...
      </Text>
    ) : bid2Hand.length === 0 ? (
      <Pressable
        style={styles.button}
        onPress={async () => {
          try {
            const cards =
              await drawLiveBreakawayHand(
                liveSession.gameId
              );

            setBid2Hand(cards);
          } catch (error) {
            console.error(
              'DRAW LIVE BREAKAWAY BID 2 ERROR',
              error
            );
          }
        }}
      >
        <Text style={styles.buttonText}>
          DRAW BID 2 CARDS
        </Text>
      </Pressable>
    ) : (
      <>
        <View style={styles.handRow}>
          {bid2Hand.map((card) => {
            const isSelected =
              selectedBid2CardId === card.id;

            return (
              <Pressable
                key={card.id}
                style={[
                  styles.handCard,
                  isSelected &&
                    styles.handCardSelected,
                ]}
                onPress={() =>
                  setSelectedBid2CardId(
                    card.id
                  )
                }
              >
                <Text style={styles.cardValue}>
                  {card.displayValue ??
                    card.value}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedBid2CardId && (
          <Pressable
            style={styles.button}
            onPress={async () => {
              try {
                await submitLiveBreakawayBid2(
                  liveSession.gameId,
                  selectedBid2CardId
                );

                setBid2Hand([]);
                setSelectedBid2CardId(null);
              } catch (error) {
                console.error(
                  'SUBMIT LIVE BREAKAWAY BID 2 ERROR',
                  error
                );
              }
            }}
          >
            <Text style={styles.buttonText}>
              SUBMIT BID 2
            </Text>
          </Pressable>
        )}
      </>
    )}
  </>
)}
  </View>
)}


      <Text style={styles.roleText}>
        {liveSession.isAdmin
          ? 'You are the stage administrator.'
          : 'Waiting for the administrator.'}
      </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  content: {
  padding: 24,
  paddingTop: 50,
  paddingBottom: 40,
},

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 20,
    textAlign: 'center',
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.brown,
    opacity: 0.65,
    marginTop: 10,
  },

  value: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.brown,
    marginTop: 2,
  },

  text: {
    fontSize: 16,
    color: Colors.brown,
    textAlign: 'center',
  },

  roleText: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brown,
    textAlign: 'center',
  },
  sectionTitle: {
  fontSize: 16,
  fontWeight: '900',
  color: Colors.brown,
  marginTop: 14,
  marginBottom: 8,
},

optionRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
},

optionButton: {
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: Colors.red,
  backgroundColor: Colors.card,
},

optionButtonActive: {
  backgroundColor: Colors.red,
},

optionButtonDisabled: {
  opacity: 0.7,
},

optionText: {
  fontSize: 13,
  fontWeight: '800',
  color: Colors.brown,
},

optionTextActive: {
  color: Colors.white,
},

breakawaySelection: {
  marginTop: 16,
},

helperText: {
  fontSize: 13,
  color: Colors.brown,
  opacity: 0.7,
  marginBottom: 10,
},
readyText: {
  marginTop: 18,
  textAlign: 'center',
  fontSize: 14,
  fontWeight: '800',
  color: Colors.brown,
},

continueButton: {
  marginTop: 12,
  backgroundColor: Colors.red,
  padding: 16,
  borderRadius: 14,
  alignItems: 'center',
},

continueButtonDisabled: {
  opacity: 0.4,
},

continueButtonText: {
  color: Colors.white,
  fontSize: 16,
  fontWeight: '900',
},
button: {
  marginTop: 16,
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 12,
  backgroundColor: Colors.red,
  alignItems: 'center',
},

buttonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '800',
},
handRow: {
  flexDirection: 'row',
  gap: 8,
  marginTop: 16,
},

handCard: {
  flex: 1,
  minHeight: 80,
  borderWidth: 1,
  borderColor: '#b8aa91',
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fff',
},

cardValue: {
  fontSize: 28,
  fontWeight: '900',
  color: Colors.brown,
},
handCardSelected: {
  borderWidth: 3,
  transform: [{ scale: 1.05 }],
},
row: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 16,
  padding: 18,
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
},

avatar: {
  width: 32,
  height: 32,
  marginRight: 12,
},

rowInfo: {
  flex: 1,
  flexDirection: 'column',
  justifyContent: 'center',
},

rowText: {
  fontSize: 18,
  fontWeight: '900',
  color: Colors.brown,
},

rowSubText: {
  fontSize: 13,
  color: Colors.brown,
  marginTop: 2,
},

breakawayBidValue: {
  fontSize: 22,
  fontWeight: '700',
},
breakawayWinnerSelected: {
  borderWidth: 3,
  transform: [{ scale: 1.02 }],
},
});