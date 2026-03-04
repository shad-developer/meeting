import React from 'react';
import VideoTile from './VideoTile';

const getGridStyle = (count) => {
  if (count === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
  if (count === 2) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
  if (count <= 4) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
  if (count <= 6) return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr' };
  if (count <= 9) return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' };
  return { gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' };
};

const VideoGrid = ({
  localStream,
  localUser,
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  screenStream,
  remoteStreams,
  isHost,
  onMuteParticipant,
  onRemoveParticipant,
}) => {
  const allTiles = [];

  // Screen share takes priority as large tile
  const screenSharingPeer = Object.entries(remoteStreams).find(([, data]) => data.isScreenSharing);

  if (isScreenSharing && screenStream) {
    // Local is sharing screen - show screen large, others in strip
    return (
      <div style={{ display: 'flex', width: '100%', height: '100%', gap: '8px', padding: '8px' }}>
        {/* Screen share - large */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <VideoTile
            stream={screenStream}
            name={localUser?.name}
            isLocal
            audioEnabled={audioEnabled}
            videoEnabled
            isScreenSharing
            isLarge
          />
        </div>
        {/* Side strip */}
        <div style={{
          width: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <div style={{ height: '120px', flexShrink: 0 }}>
            <VideoTile
              stream={localStream}
              name={localUser?.name}
              isLocal
              audioEnabled={audioEnabled}
              videoEnabled={videoEnabled}
            />
          </div>
          {Object.entries(remoteStreams).map(([socketId, data]) => (
            <div key={socketId} style={{ height: '120px', flexShrink: 0 }}>
              <VideoTile
                stream={data.stream}
                name={data.name}
                audioEnabled={data.audioEnabled}
                videoEnabled={data.videoEnabled}
                isScreenSharing={data.isScreenSharing}
                isHost={isHost}
                showControls
                onMute={() => onMuteParticipant(socketId)}
                onRemove={() => onRemoveParticipant(socketId)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screenSharingPeer) {
    const [sharingSocketId, sharingData] = screenSharingPeer;
    return (
      <div style={{ display: 'flex', width: '100%', height: '100%', gap: '8px', padding: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <VideoTile
            stream={sharingData.stream}
            name={sharingData.name}
            audioEnabled={sharingData.audioEnabled}
            videoEnabled
            isScreenSharing
            isLarge
          />
        </div>
        <div style={{
          width: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <div style={{ height: '120px', flexShrink: 0 }}>
            <VideoTile
              stream={localStream}
              name={localUser?.name}
              isLocal
              audioEnabled={audioEnabled}
              videoEnabled={videoEnabled}
            />
          </div>
          {Object.entries(remoteStreams)
            .filter(([sid]) => sid !== sharingSocketId)
            .map(([socketId, data]) => (
              <div key={socketId} style={{ height: '120px', flexShrink: 0 }}>
                <VideoTile
                  stream={data.stream}
                  name={data.name}
                  audioEnabled={data.audioEnabled}
                  videoEnabled={data.videoEnabled}
                  isHost={isHost}
                  showControls
                  onMute={() => onMuteParticipant(socketId)}
                  onRemove={() => onRemoveParticipant(socketId)}
                />
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Normal grid view
  const totalCount = 1 + Object.keys(remoteStreams).length;
  const gridStyle = getGridStyle(totalCount);

  return (
    <div
      style={{
        display: 'grid',
        ...gridStyle,
        gap: '8px',
        padding: '8px',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Local */}
      <VideoTile
        stream={localStream}
        name={localUser?.name}
        isLocal
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isScreenSharing={isScreenSharing}
        isLarge={totalCount === 1}
      />

      {/* Remote peers */}
      {Object.entries(remoteStreams).map(([socketId, data]) => (
        <VideoTile
          key={socketId}
          stream={data.stream}
          name={data.name}
          audioEnabled={data.audioEnabled}
          videoEnabled={data.videoEnabled}
          isScreenSharing={data.isScreenSharing}
          isHost={isHost}
          showControls
          onMute={() => onMuteParticipant(socketId)}
          onRemove={() => onRemoveParticipant(socketId)}
        />
      ))}
    </div>
  );
};

export default VideoGrid;
