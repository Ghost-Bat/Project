import { useContext, useMemo } from 'react'
import { useWindowSize } from '@react-hook/window-size'
import Zoom from '@mui/material/Zoom'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import useTheme from '@mui/material/styles/useTheme'
import { v4 as uuid } from 'uuid'

import { useRtcConfig } from 'hooks/useRtcConfig'
import { trackerUrls } from 'config/trackerUrls'
import { time } from 'lib/Time'
import { RoomContext } from 'contexts/RoomContext'
import { ShellContext } from 'contexts/ShellContext'
import { MessageForm } from 'components/MessageForm'
import { ChatTranscript } from 'components/ChatTranscript'
import { WholePageLoading } from 'components/Loading'
import { encryption } from 'services/Encryption'
import { SettingsContext } from 'contexts/SettingsContext'

import { useRoom } from './useRoom'
import { RoomAudioControls } from './RoomAudioControls'
import { RoomVideoControls } from './RoomVideoControls'
import { RoomScreenShareControls } from './RoomScreenShareControls'
import { RoomFileUploadControls } from './RoomFileUploadControls'
import { RoomVideoDisplay } from './RoomVideoDisplay'
import { RoomShowMessagesControls } from './RoomShowMessagesControls'
import { TypingStatusBar } from './TypingStatusBar'
import { AdmissionController } from './AdmissionController' // YENİ IMPORT

export interface RoomProps {
  appId?: string
  getUuid?: typeof uuid
  password?: string
  roomId: string
  userId: string
  encryptionService?: typeof encryption
  timeService?: typeof time
  targetPeerId?: string
}

export function Room({
  appId = `${encodeURI(window.location.origin)}_${process.env.VITE_NAME}`,
  getUuid = uuid,
  encryptionService = encryption,
  timeService = time,
  roomId,
  password,
  userId,
  targetPeerId,
}: RoomProps) {
  const theme = useTheme()
  const settingsContext = useContext(SettingsContext)
  const { showActiveTypingStatus, publicKey, isEnhancedConnectivityEnabled } =
    settingsContext.getUserSettings()

  const { rtcConfig, isLoading: isConfigLoading } = useRtcConfig(
    isEnhancedConnectivityEnabled
  )

  const roomJoinConfig = useMemo(
    () => ({
      appId,
      relayUrls: trackerUrls,
      rtcConfig,
      password,
      relayRedundancy: 4,
    }),
    [appId, rtcConfig, password]
  )

  const {
    isDirectMessageRoom,
    isPrivate, // YENİ: isPrivate değişkenini al
    handleInlineMediaUpload,
    handleMessageChange,
    isMessageSending,
    messageLog,
    peerRoom,
    roomContextValue,
    sendMessage,
    showVideoDisplay,
  } = useRoom(
    roomJoinConfig,
    {
      roomId,
      userId,
      getUuid,
      publicKey,
      encryptionService,
      timeService,
      targetPeerId,
    }
  )

  const { showRoomControls } = useContext(ShellContext)
  const [windowWidth, windowHeight] = useWindowSize()
  const landscape = windowWidth > windowHeight

  const handleMessageSubmit = async (message: string) => {
    await sendMessage(message)
  }

  const showMessages = roomContextValue.isShowingMessages

  if (isConfigLoading) {
    return <WholePageLoading />
  }

  return (
    <RoomContext.Provider value={roomContextValue}>
      {/* YENİ: SADECE ÖZEL ODALARDA AdmissionController'ı RENDER ET */}
      {isPrivate && !isDirectMessageRoom && (
        <AdmissionController roomId={roomId} secret={password!} />
      )}

      <Box
        className="Room"
        sx={{
          height: '100%',
          display: 'flex',
          flexGrow: '1',
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: '1',
            overflow: 'auto',
          }}
        >
          {!isDirectMessageRoom && (
            <Zoom in={showRoomControls}>
              <Box
                sx={{
                  alignItems: 'flex-start',
                  display: 'flex',
                  justifyContent: 'center',
                  overflow: 'visible',
                  height: 0,
                  position: 'relative',
                  top: theme.spacing(1),
                }}
              >
                <RoomAudioControls peerRoom={peerRoom} />
                <RoomVideoControls peerRoom={peerRoom} />
                <RoomScreenShareControls peerRoom={peerRoom} />
                <RoomFileUploadControls
                  peerRoom={peerRoom}
                  onInlineMediaUpload={handleInlineMediaUpload}
                />
                <Zoom in={showVideoDisplay} mountOnEnter unmountOnExit>
                  <span>
                    <RoomShowMessagesControls />
                  </span>
                </Zoom>
              </Box>
            </Zoom>
          )}
          <Box
            sx={{
              display: 'flex',
              flexDirection: landscape ? 'row' : 'column',
              height: '100%',
              width: '100%',
              overflow: 'auto',
            }}
          >
            {showVideoDisplay && (
              <RoomVideoDisplay
                userId={userId}
                width="100%"
                height={landscape || !showMessages ? '100%' : '60%'}
              />
            )}
            {showMessages && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: '1',
                  width: showVideoDisplay && landscape ? '400px' : '100%',
                  height: landscape ? '100%' : '40%',
                }}
              >
                <ChatTranscript
                  messageLog={messageLog}
                  userId={userId}
                  sx={{ ...(isDirectMessageRoom && { pt: 1 }) }}
                />
                <Divider />
                <Box>
                  <MessageForm
                    onMessageSubmit={handleMessageSubmit}
                    isMessageSending={isMessageSending}
                    onMessageChange={handleMessageChange}
                  />
                  {showActiveTypingStatus ? (
                    <TypingStatusBar
                      isDirectMessageRoom={isDirectMessageRoom}
                    />
                  ) : null}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </RoomContext.Provider>
  )
}
