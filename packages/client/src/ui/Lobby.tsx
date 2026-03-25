import React, { useState } from "react";

const COLOR_OPTIONS = [
  { name: "Rouge", value: 0xff6b6b },
  { name: "Bleu", value: 0x48dbfb },
  { name: "Jaune", value: 0xfeca57 },
  { name: "Rose", value: 0xff9ff3 },
  { name: "Indigo", value: 0x54a0ff },
  { name: "Violet", value: 0x5f27cd },
  { name: "Teal", value: 0x01a3a4 },
  { name: "Magenta", value: 0xf368e0 },
];

interface LobbyProps {
  onJoin: (name: string, color: number) => void;
}

export function Lobby({ onJoin }: LobbyProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim() || `Coco${Math.floor(Math.random() * 999)}`;
    onJoin(trimmed, selectedColor);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h1 style={styles.title}>Coco Working</h1>
        <p style={styles.subtitle}>Espace de co-working digital</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Ton nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Coco"
            maxLength={20}
            style={styles.input}
            autoFocus
          />

          <label style={{ ...styles.label, marginTop: 16 }}>Ta couleur</label>
          <div style={styles.colors}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                style={{
                  ...styles.colorBtn,
                  backgroundColor: `#${c.value.toString(16).padStart(6, "0")}`,
                  outline: selectedColor === c.value ? "2px solid #fff" : "2px solid transparent",
                  transform: selectedColor === c.value ? "scale(1.2)" : "scale(1)",
                }}
                title={c.name}
              />
            ))}
          </div>

          <button type="submit" style={styles.joinBtn}>
            Rejoindre
          </button>
        </form>

        <p style={styles.hint}>WASD ou fleches pour se deplacer</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute",
    inset: 0,
    background: "#1a1a2e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "monospace",
    color: "#fff",
  },
  card: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: "40px 48px",
    textAlign: "center",
    maxWidth: 380,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    margin: 0,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "#636e72",
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: "#b2bec3",
    textAlign: "left",
    marginBottom: 6,
  },
  input: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: 6,
    color: "#fff",
    padding: "10px 14px",
    fontSize: 14,
    fontFamily: "monospace",
    outline: "none",
  },
  colors: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  colorBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    transition: "transform 0.15s, outline 0.15s",
  },
  joinBtn: {
    marginTop: 24,
    background: "#6c5ce7",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    padding: "12px",
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "bold",
    cursor: "pointer",
    letterSpacing: 1,
  },
  hint: {
    marginTop: 20,
    fontSize: 10,
    color: "#636e72",
  },
};
