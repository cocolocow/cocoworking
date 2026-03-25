import React, { useEffect, useRef } from "react";

interface VideoFeed {
  playerId: string;
  playerName: string;
  stream: MediaStream | null;
  isLocal?: boolean;
}

interface VideoPanelProps {
  feeds: VideoFeed[];
  visible: boolean;
}

export function VideoPanel({ feeds, visible }: VideoPanelProps) {
  if (!visible || feeds.length === 0) return null;

  return (
    <div style={styles.container}>
      {feeds.map((feed) => (
        <VideoTile key={feed.playerId} feed={feed} />
      ))}
    </div>
  );
}

function VideoTile({ feed }: { feed: VideoFeed }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && feed.stream) {
      videoRef.current.srcObject = feed.stream;
    }
  }, [feed.stream]);

  return (
    <div style={styles.tile}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={feed.isLocal}
        style={styles.video}
      />
      <div style={styles.name}>{feed.isLocal ? "Toi" : feed.playerName}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    top: 16,
    right: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    zIndex: 100,
  },
  tile: {
    width: 160,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    background: "#000",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  name: {
    position: "absolute",
    bottom: 4,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "monospace",
    fontSize: 10,
    color: "#fff",
    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
  },
};
