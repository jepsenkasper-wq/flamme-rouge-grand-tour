import {
  router,
  useFocusEffect,
} from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  fetchLiveGame,
  subscribeToLiveGame,
  unsubscribeFromLiveGame,
} from '@/lib/live/liveGames';

import {
  getLiveChatLastSeen,
} from '@/lib/livePlayerIdentity';

import { Colors } from '@/constants/colors';

const CHAT_BUBBLE_POSITION_KEY =
  'flamme-rouge-live-chat-bubble-positions';

type Props = {
  gameId: string;
  screenKey: string;
};

export default function LiveChatBubble({
  gameId,
  screenKey,
}: Props) {
    const { width, height } = useWindowDimensions();
  const position = useRef(
    new Animated.ValueXY({
      x: 0,
      y: 0,
    })
  ).current;

  const startPosition = useRef({
    x: 0,
    y: 0,
  });

  const hasMoved = useRef(false);

  const [hasUnreadMessage, setHasUnreadMessage] =
  useState(false);

  async function savePosition(
  x: number,
  y: number
) {
  try {
    const stored = await AsyncStorage.getItem(
      CHAT_BUBBLE_POSITION_KEY
    );

    const positions = stored
      ? JSON.parse(stored)
      : {};

    positions[screenKey] = {
      x,
      y,
    };

    await AsyncStorage.setItem(
      CHAT_BUBBLE_POSITION_KEY,
      JSON.stringify(positions)
    );
  } catch (error) {
    console.error(
      'CHAT BUBBLE SAVE POSITION ERROR',
      error
    );
  }
}

useEffect(() => {
  async function loadPosition() {
    try {
      const stored = await AsyncStorage.getItem(
        CHAT_BUBBLE_POSITION_KEY
      );

      if (!stored) {
        return;
      }

      const positions = JSON.parse(stored);

      const savedPosition =
        positions[screenKey];

      if (!savedPosition) {
        return;
      }

      position.setValue({
        x: savedPosition.x,
        y: savedPosition.y,
      });
    } catch (error) {
      console.error(
        'CHAT BUBBLE LOAD POSITION ERROR',
        error
      );
    }
  }

  void loadPosition();
}, [screenKey, position]);

const checkUnreadMessages = useCallback(
  async () => {
    try {
      const [liveGame, lastSeen] =
        await Promise.all([
          fetchLiveGame(gameId),
          getLiveChatLastSeen(gameId),
        ]);

      if (!liveGame.chatUpdatedAt) {
        setHasUnreadMessage(false);
        return;
      }

      if (!lastSeen) {
        setHasUnreadMessage(true);
        return;
      }

      setHasUnreadMessage(
        new Date(liveGame.chatUpdatedAt).getTime() >
          new Date(lastSeen).getTime()
      );
    } catch (error) {
      console.error(
        'CHAT BUBBLE UNREAD ERROR',
        error
      );
    }
  },
  [gameId]
);

useEffect(() => {
  void checkUnreadMessages();

  const channel = subscribeToLiveGame(
    gameId,
    () => {
      void checkUnreadMessages();
    }
  );

  return () => {
    void unsubscribeFromLiveGame(channel);
  };
}, [gameId, checkUnreadMessages]);

useFocusEffect(
  useCallback(() => {
    void checkUnreadMessages();
  }, [checkUnreadMessages])
);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (
        _event,
        gestureState
      ) => {
        return (
          Math.abs(gestureState.dx) > 4 ||
          Math.abs(gestureState.dy) > 4
        );
      },

      onPanResponderGrant: () => {
        hasMoved.current = false;

        position.stopAnimation((value) => {
          startPosition.current = {
            x: value.x,
            y: value.y,
          };
        });
      },

      onPanResponderMove: (
        _event,
        gestureState
      ) => {
        if (
          Math.abs(gestureState.dx) > 4 ||
          Math.abs(gestureState.dy) > 4
        ) {
          hasMoved.current = true;
        }   

        const nextX =
  startPosition.current.x +
  gestureState.dx;

const nextY =
  startPosition.current.y +
  gestureState.dy;

const minX = -(width - 92);
const maxX = 0;

const minY = 0;
const maxY = height - 200;

position.setValue({
  x: Math.max(
    minX,
    Math.min(maxX, nextX)
  ),
  y: Math.max(
    minY,
    Math.min(maxY, nextY)
  ),
});
      },

     onPanResponderRelease: () => {
  if (!hasMoved.current) {
    router.push({
      pathname: '/live-chat',
      params: {
        gameId,
      },
    });

    return;
  }

  position.stopAnimation((value) => {
    void savePosition(
      value.x,
      value.y
    );
  });
},
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.chatButton,
        {
          transform: position.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Text style={styles.chatIcon}>💬</Text>

{hasUnreadMessage && (
  <Animated.View style={styles.unreadDot} />
)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chatButton: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.red,
    borderWidth: 2,
    borderColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 8,
  },

  chatIcon: {
    fontSize: 25,
  },

  unreadDot: {
  position: 'absolute',
  top: 3,
  right: 3,
  width: 13,
  height: 13,
  borderRadius: 7,
  backgroundColor: Colors.yellow,
  borderWidth: 2,
  borderColor: Colors.card,
},
});