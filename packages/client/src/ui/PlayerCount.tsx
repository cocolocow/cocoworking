import React from "react";

interface PlayerCountProps {
  count: number;
}

export function PlayerCount({ count }: PlayerCountProps) {
  return (
    <div style={styles.container}>
      <span style={styles.dot} />
      {count} online
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    top: 16,
    left: 16,
    background: "rgba(0, 0, 0, 0.75)",
    borderRadius: 20,
    padding: "6px 14px",
    fontFamily: "monospace",
    fontSize: 12,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#00b894",
    display: "inline-block",
  },
};
