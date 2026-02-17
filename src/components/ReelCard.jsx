import { useRef, useState, useEffect } from "react";
import styles from "./ReelCard.module.css";

const ReelCard = ({ video, isVisible }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  // Get video URL - use cloudinaryUrl for best quality
  const videoUrl = video?.cloudinaryUrl || video?.url;

  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    if (isVisible) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Video play error:", err);
          setIsPlaying(false);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isVisible, videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Video play error:", err);
          setError(true);
        });
    }
  };

  const handleVideoError = (e) => {
    console.error("Video load error:", e, "URL:", videoUrl);
    setError(true);
  };

  if (!videoUrl) {
    return (
      <div className={styles.reelCard}>
        <div className={styles.errorMessage}>
          <p>❌ Video URL not available</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            Video ID: {video?.id}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.reelCard}>
        <div className={styles.errorMessage}>
          <p>❌ Failed to load video</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            URL: {videoUrl}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reelCard}>
      <video
        ref={videoRef}
        className={styles.video}
        src={videoUrl}
        loop
        playsInline
        muted
        onClick={togglePlay}
        onError={handleVideoError}
      />
      
      <div className={styles.overlay}>
        <div className={styles.info}>
          <h3 className={styles.title}>{video.title || "Untitled Video"}</h3>
          {video.description && (
            <p className={styles.description}>{video.description}</p>
          )}
        </div>

        {!isPlaying && (
          <div className={styles.playButton} onClick={togglePlay}>
            ▶
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelCard;
