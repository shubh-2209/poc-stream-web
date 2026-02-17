 import { useNavigate } from "react-router-dom";

const LiveStreamingPage = () => {
  const navigate = useNavigate();

  const startLive = () => {
    console.log("Starting live stream...");
    // Future: WebRTC / LiveKit logic yaha add hoga
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>🔴 Live Streaming Page</h2>

      <button onClick={startLive}>
        🎥 Start Live Stream
      </button>

      <br /><br />

      <button onClick={() => navigate("/dashboard")}>
        ⬅ Back to Dashboard
      </button>
    </div>
  );
};

export default LiveStreamingPage;
