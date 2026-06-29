import { useState, useRef } from "react";

export function DemoVideo() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handlePlay() {
    setPlaying(true);
    // autoPlay kicks in once the element mounts, but call play() for safety
    setTimeout(() => videoRef.current?.play(), 50);
  }

  if (playing) {
    return (
      <video
        ref={videoRef}
        src="/demo/quotesnap-demo.mp4"
        controls
        autoPlay
        playsInline
        style={{ width: "100%", height: "auto", display: "block", backgroundColor: "#1c1917" }}
      />
    );
  }

  return (
    <div
      onClick={handlePlay}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "9 / 16",
        background: "linear-gradient(160deg, #292524 0%, #1c1917 60%, #44403c 100%)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {/* Subtle top label */}
      <div style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center" }}>
        <span style={{
          color: "#a8a29e",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          QuoteSnap
        </span>
      </div>

      {/* Play button */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          backgroundColor: "#f59e0b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(245,158,11,0.35)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 32px rgba(245,158,11,0.5)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(245,158,11,0.35)";
        }}
      >
        {/* Triangle */}
        <div style={{
          width: 0,
          height: 0,
          borderTop: "10px solid transparent",
          borderBottom: "10px solid transparent",
          borderLeft: "18px solid #ffffff",
          marginLeft: 4,
        }} />
      </div>

      {/* Bottom label */}
      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ color: "#78716c", fontSize: 12 }}>Watch the demo</span>
      </div>
    </div>
  );
}
