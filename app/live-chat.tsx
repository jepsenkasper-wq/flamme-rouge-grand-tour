import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  Modal,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { Colors } from '@/constants/colors';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import {
  fetchLiveChatMessages,
  sendLiveChatMessage,
  subscribeToLiveGame,
unsubscribeFromLiveGame,
fetchLivePlayers,
fetchLiveGame,
createLiveChatImageUpload,
sendLiveChatImage,
createLiveChatImageUrl,
type LivePlayer,
  type LiveChatMessage,
} from '@/lib/live/liveGames';

import {
  getLivePlayerIdentity,
  setLiveChatLastSeen,
} from '@/lib/livePlayerIdentity';

function getPlayerColor(colorName: string) {
  switch (colorName) {
    case 'Blue':
      return '#2f5fb3';
    case 'White':
      return '#f7f1df';
    case 'Green':
      return '#2f8a3e';
    case 'Red':
      return '#b7372f';
    case 'Black':
      return '#222222';
    case 'Pink':
      return '#d97aa7';
    default:
      return Colors.border;
  }
}

export default function LiveChatScreen() {
  const params = useLocalSearchParams();

  const gameId = String(params.gameId ?? '');

  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const chatScrollRef = useRef<KeyboardAwareScrollView>(null);

  const [sendingImage, setSendingImage] =
  useState(false);

  const [players, setPlayers] = useState<LivePlayer[]>([]);
const [currentPlayerId, setCurrentPlayerId] = useState('');

const [imageUrls, setImageUrls] =
  useState<Record<string, string>>({});

const imageUrlsRef =
  useRef<Record<string, string>>({});

const [selectedImageUrl, setSelectedImageUrl] =
  useState<string | null>(null);

  const [imageAspectRatios, setImageAspectRatios] =
  useState<Record<string, number>>({});

 async function loadMessages() {
  const identity = await getLivePlayerIdentity(gameId);


  if (!identity) {
    throw new Error('Live player identity not found');
  }

  const updatedMessages = await fetchLiveChatMessages(
    gameId,
    identity.playerId,
    identity.playerToken
  );

  setMessages(updatedMessages);

  await loadChatImageUrls(
  updatedMessages
);

  const liveGame = await fetchLiveGame(gameId);

  if (liveGame.chatUpdatedAt) {
    await setLiveChatLastSeen(
      gameId,
      liveGame.chatUpdatedAt
    );
  }
}

  useEffect(() => {
    async function loadChat() {
  try {
    const identity = await getLivePlayerIdentity(gameId);

    if (!identity) {
      throw new Error('Live player identity not found');
    }

    const livePlayers = await fetchLivePlayers(gameId);

setPlayers(livePlayers);
setCurrentPlayerId(identity.playerId);

await loadMessages();

const liveGame = await fetchLiveGame(gameId);

if (liveGame.chatUpdatedAt) {
  await setLiveChatLastSeen(
    gameId,
    liveGame.chatUpdatedAt
  );
}
      } catch (error) {
        console.error('LIVE CHAT LOAD ERROR', error);

        Alert.alert(
          'Could not load chat',
          'Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (gameId) {
      loadChat();
    }
  }, [gameId]);

  useEffect(() => {
  if (!gameId) {
    return;
  }

  const channel = subscribeToLiveGame(
    gameId,
    () => {
      loadMessages().catch((error) => {
        console.error('LIVE CHAT REALTIME ERROR', error);
      });
    }
  );

  return () => {
    unsubscribeFromLiveGame(channel);
  };
}, [gameId]);

useEffect(() => {
  if (messages.length === 0) {
    return;
  }

  setTimeout(() => {
    chatScrollRef.current?.scrollToEnd(true);
  }, 100);
}, [messages]);

async function testImageUploadUrl() {
  try {
    const identity =
      await getLivePlayerIdentity(gameId);

    if (!identity) {
      throw new Error(
        'Live player identity not found'
      );
    }

    const result =
      await createLiveChatImageUpload(
        gameId,
        identity.playerId,
        identity.playerToken,
        'jpg'
      );

    console.log(
      'CHAT IMAGE UPLOAD TEST',
      result
    );
  } catch (error: any) {
  console.error(
    'CHAT IMAGE UPLOAD TEST ERROR',
    error
  );

  if (error?.context) {
    try {
      const errorBody =
        await error.context.json();

      console.error(
        'CHAT IMAGE UPLOAD ERROR BODY',
        errorBody
      );
    } catch (contextError) {
      console.error(
        'COULD NOT READ ERROR BODY',
        contextError
      );
    }
  }
}
}

async function pickChatImage() {
  if (sendingImage) {
    return;
  }

  try {
    setSendingImage(true);

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

    if (result.canceled) {
      return;
    }

    const image = result.assets[0];

    const longestSide = Math.max(
      image.width,
      image.height
    );

    const resizeAction =
      longestSide > 1200
        ? image.width >= image.height
          ? { resize: { width: 1200 } }
          : { resize: { height: 1200 } }
        : null;

    const manipulatedImage =
      await ImageManipulator.manipulateAsync(
        image.uri,
        resizeAction ? [resizeAction] : [],
        {
          compress: 0.75,
          format:
            ImageManipulator.SaveFormat.JPEG,
        }
      );

    const identity =
      await getLivePlayerIdentity(gameId);

    if (!identity) {
      throw new Error(
        'Live player identity not found'
      );
    }

    const uploadInfo =
      await createLiveChatImageUpload(
        gameId,
        identity.playerId,
        identity.playerToken,
        'jpg'
      );

    const base64 =
      await FileSystem.readAsStringAsync(
        manipulatedImage.uri,
        {
          encoding:
            FileSystem.EncodingType.Base64,
        }
      );

    const binaryString = atob(base64);

    const bytes = new Uint8Array(
      binaryString.length
    );

    for (
      let i = 0;
      i < binaryString.length;
      i++
    ) {
      bytes[i] =
        binaryString.charCodeAt(i);
    }

    const { error: uploadError } =
      await supabase.storage
        .from('live-chat-images')
        .uploadToSignedUrl(
          uploadInfo.path,
          uploadInfo.token,
          bytes.buffer,
          {
            contentType: 'image/jpeg',
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    await sendLiveChatImage(
      gameId,
      identity.playerId,
      identity.playerToken,
      uploadInfo.path
    );
  } catch (error) {
    console.error(
      'CHAT IMAGE PICK ERROR',
      error
    );

    Alert.alert(
      'Could not send image',
      'Please try again.'
    );
  } finally {
    setSendingImage(false);
  }
}

async function loadChatImageUrls(
  chatMessages: LiveChatMessage[]
) {
  try {
    const imageMessages =
      chatMessages.filter(
        (message) => message.imagePath
      );

    const missingImageMessages =
      imageMessages.filter(
        (message) =>
          !imageUrlsRef.current[message.id]
      );

    if (missingImageMessages.length === 0) {
      return;
    }

    const identity =
      await getLivePlayerIdentity(gameId);

    if (!identity) {
      throw new Error(
        'Live player identity not found'
      );
    }

    const newUrls: Record<string, string> = {};

    await Promise.all(
      missingImageMessages.map(
        async (message) => {
          if (!message.imagePath) {
            return;
          }

          const signedUrl =
            await createLiveChatImageUrl(
              gameId,
              identity.playerId,
              identity.playerToken,
              message.imagePath
            );

          newUrls[message.id] = signedUrl;

          Image.getSize(
            signedUrl,
            (width, height) => {
              setImageAspectRatios(
                (current) => ({
                  ...current,
                  [message.id]:
                    width / height,
                })
              );
            },
            (error) => {
              console.error(
                'CHAT IMAGE SIZE ERROR',
                error
              );
            }
          );
        }
      )
    );

    imageUrlsRef.current = {
      ...imageUrlsRef.current,
      ...newUrls,
    };

    setImageUrls(
      imageUrlsRef.current
    );
  } catch (error) {
    console.error(
      'CHAT IMAGE URLS ERROR',
      error
    );
  }
}
  async function handleSend() {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || sending) {
      return;
    }

    try {
      setSending(true);

      const identity = await getLivePlayerIdentity(gameId);

      if (!identity) {
        throw new Error('Live player identity not found');
      }

      await sendLiveChatMessage(
        gameId,
        identity.playerId,
        identity.playerToken,
        trimmedMessage
      );

      setMessageText('');

      await loadMessages();
    } catch (error) {
      console.error('LIVE CHAT SEND ERROR', error);

      Alert.alert(
        'Could not send message',
        'Please try again.'
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

async function refreshChatImageUrl(
  message: LiveChatMessage
) {
  if (!message.imagePath) {
    return;
  }

  try {
    const identity =
      await getLivePlayerIdentity(gameId);

    if (!identity) {
      throw new Error(
        'Live player identity not found'
      );
    }

    const signedUrl =
      await createLiveChatImageUrl(
        gameId,
        identity.playerId,
        identity.playerToken,
        message.imagePath
      );

    imageUrlsRef.current = {
      ...imageUrlsRef.current,
      [message.id]: signedUrl,
    };

    setImageUrls({
      ...imageUrlsRef.current,
    });
  } catch (error) {
    console.error(
      'CHAT IMAGE REFRESH ERROR',
      error
    );
  }
}

return (
  <View style={styles.screen}>
    <KeyboardAwareScrollView
  ref={chatScrollRef}
  onContentSizeChange={() => {
  chatScrollRef.current?.scrollToEnd(false);
}}
  style={styles.messages}
      contentContainerStyle={styles.messagesContent}
      enableOnAndroid
      extraScrollHeight={250}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.messageList}>
  {messages.map((message) => {
    const isOwnMessage =
      message.playerId === currentPlayerId;

    const player = players.find(
      (player) => player.id === message.playerId
    );

    return (
      <View
        key={message.id}
        style={[
          styles.messageRow,
          isOwnMessage
            ? styles.ownMessageRow
            : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage
              ? styles.ownMessageBubble
              : styles.otherMessageBubble,
          ]}
        >
       {!isOwnMessage && (
  <View style={styles.senderRow}>
    <View
      style={[
        styles.senderColorDot,
        {
          backgroundColor: getPlayerColor(
            player?.color ?? ''
          ),
        },
      ]}
    />

    <Text style={styles.senderName}>
      {player?.name ?? 'Player'}
    </Text>
  </View>
)}

{message.imagePath &&
  imageUrls[message.id] && (
    <Pressable
      onPress={() =>
        setSelectedImageUrl(
          imageUrls[message.id]
        )
      }
    >
      <Image
  source={{
    uri: imageUrls[message.id],
  }}
  style={[
    styles.chatImage,
    {
      aspectRatio:
        imageAspectRatios[message.id] ?? 1,
    },
  ]}
  resizeMode="contain"
  onError={() => {
    void refreshChatImageUrl(message);
  }}
/>
    </Pressable>
  )}

{message.message ? (
  <Text
    style={[
      styles.messageText,
      isOwnMessage && styles.ownMessageText,
    ]}
  >
    {message.message}
  </Text>
) : null}
        </View>
      </View>
    );
  })}
</View>



      <View style={styles.inputRow}>
 <Pressable
  style={[
    styles.imageButton,
    sendingImage && styles.imageButtonDisabled,
  ]}
  onPress={pickChatImage}
  disabled={sendingImage}
>
  <Text style={styles.imageButtonText}>
    {sendingImage ? '...' : '📷'}
  </Text>
</Pressable>

  <TextInput
    style={styles.input}
    value={messageText}
    onChangeText={setMessageText}
    placeholder="Write a message..."
    onSubmitEditing={handleSend}
    returnKeyType="send"
  />

  <Pressable
    style={styles.sendButton}
    onPress={handleSend}
    disabled={sending}
  >
    <Text style={styles.sendButtonText}>
      {sending ? '...' : 'Send'}
    </Text>
  </Pressable>
</View>
  </KeyboardAwareScrollView>
  <Modal
  visible={selectedImageUrl !== null}
  transparent
  animationType="fade"
  onRequestClose={() =>
    setSelectedImageUrl(null)
  }
>
  <Pressable
    style={styles.imageModalBackdrop}
    onPress={() =>
      setSelectedImageUrl(null)
    }
  >
    {selectedImageUrl && (
      <Image
        source={{
          uri: selectedImageUrl,
        }}
        style={styles.fullImage}
        resizeMode="contain"
      />
    )}

    <View style={styles.imageModalClose}>
      <Text style={styles.imageModalCloseText}>
        ✕
      </Text>
    </View>
  </Pressable>
</Modal>
  </View>
);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    gap: 16,
    backgroundColor: Colors.paper,
    marginBottom: 26,
  },

  messages: {
    flex: 1,
  },

messagesContent: {
  flexGrow: 1,
  justifyContent: 'space-between',
  gap: 16,
},

  message: {
    fontSize: 16,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  sendButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#333333',
  },

  sendButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  messageList: {
  gap: 8,
},

messageRow: {
  width: '100%',
  flexDirection: 'row',
},

ownMessageRow: {
  justifyContent: 'flex-end',
},

otherMessageRow: {
  justifyContent: 'flex-start',
},

messageBubble: {
  maxWidth: '78%',
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 18,
},

ownMessageBubble: {
  backgroundColor: Colors.red,
  borderBottomRightRadius: 5,
},

otherMessageBubble: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderBottomLeftRadius: 5,
},

senderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 3,
},

senderColorDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  borderWidth: 1,
  borderColor: Colors.brown,
},

senderName: {
  fontSize: 12,
  fontWeight: '900',
  color: Colors.brown,
},

messageText: {
  fontSize: 16,
  color: Colors.brown,
},

ownMessageText: {
  color: '#ffffff',
},
chatImage: {
  width: 220,
  borderRadius: 8,
},
imageButton: {
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
},

imageButtonText: {
  fontSize: 22,
},
imageButtonDisabled: {
  opacity: 0.5,
},
imageModalBackdrop: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
},

fullImage: {
  width: '100%',
  height: '90%',
},

imageModalClose: {
  position: 'absolute',
  top: 50,
  right: 20,
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  alignItems: 'center',
  justifyContent: 'center',
},

imageModalCloseText: {
  color: Colors.white,
  fontSize: 24,
  fontWeight: '700',
},
});