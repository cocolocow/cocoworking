import React, { useState, useRef, useEffect } from "react";

interface ChatMessage {
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
}

interface ChatProps {
  messages: ChatMessage[];
  onSend: (content: string) => void;
}

export function Chat({ messages, onSend }: ChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Chat</div>
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} style={styles.message}>
            <span style={styles.name}>{msg.playerName}</span>
            <span style={styles.content}>{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrire un message..."
          style={styles.input}
          maxLength={200}
        />
        <button type="submit" style={styles.button}>
          &rarr;
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 300,
    maxHeight: 400,
    background: "rgba(0, 0, 0, 0.75)",
    borderRadius: 8,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "monospace",
    fontSize: 12,
    color: "#fff",
    overflow: "hidden",
  },
  header: {
    padding: "8px 12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    fontWeight: "bold",
    fontSize: 13,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 12px",
    maxHeight: 300,
  },
  message: {
    marginBottom: 4,
    lineHeight: "1.4",
  },
  name: {
    color: "#48dbfb",
    marginRight: 6,
    fontWeight: "bold",
  },
  content: {
    color: "#dfe6e9",
  },
  form: {
    display: "flex",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  input: {
    flex: 1,
    background: "rgba(255, 255, 255, 0.05)",
    border: "none",
    color: "#fff",
    padding: "10px 12px",
    fontFamily: "monospace",
    fontSize: 12,
    outline: "none",
  },
  button: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    color: "#fff",
    padding: "10px 14px",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: 14,
  },
};
