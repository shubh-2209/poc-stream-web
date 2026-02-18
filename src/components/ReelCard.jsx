import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { store } from "../redux/store";
import styles from "../styles/Dashboard/ReelCard.module.css";

const ReelCard = ({ video, isVisible }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [downloadingAudio, setDownloadingAudio] = useState(false);
  const [downloadingCleanAudio, setDownloadingCleanAudio] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && !e.target.closest(`.${styles.menuContainer}`)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

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

  const handleDownloadAudio = async () => {
    if (!video?.id) return;
    
    setShowMenu(false); 
    setDownloadingAudio(true);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3333/api";
      const state = store.getState();
      const token = state?.auth?.token;
      
      const statusResponse = await axios.get(`${baseUrl}/videos/${video.id}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!statusResponse.data.audioReady) {
        await axios.post(`${baseUrl}/videos/${video.id}/audio/process`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      const response = await axios.get(`${baseUrl}/videos/${video.id}/audio`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title || 'video'}_audio.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error("Audio download error:", err);
      alert("Failed to download audio: " + (err?.response?.data?.error || err.message));
    } finally {
      setDownloadingAudio(false);
    }
  };

  const handleDownloadCleanAudio = async () => {
    if (!video?.id) return;
    
    setShowMenu(false); 
    setDownloadingCleanAudio(true);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3333/api";
      const state = store.getState();
      const token = state?.auth?.token;
      
      const statusResponse = await axios.get(`${baseUrl}/videos/${video.id}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!statusResponse.data.cleanAudioReady) {
        await axios.post(`${baseUrl}/videos/${video.id}/audio/process`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      const response = await axios.get(`${baseUrl}/videos/${video.id}/audio/clean`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title || 'video'}_clean_audio.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error("Clean audio download error:", err);
      alert("Failed to download clean audio: " + (err?.response?.data?.error || err.message));
    } finally {
      setDownloadingCleanAudio(false);
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  if (!videoUrl) {
    return (
      <div className={styles.reelCard}>
        <div className={styles.errorMessage}>
          <p>Video URL not available</p>
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
          <p>Failed to load video</p>
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
      
      <div className={styles.menuContainer}>
        <button className={styles.menuButton} onClick={toggleMenu}>
          ⋮
        </button>
        
        {showMenu && (
          <div className={styles.menuDropdown}>
            <button 
              className={styles.menuItem}
              onClick={handleDownloadAudio}
              disabled={downloadingAudio}
            >
              {downloadingAudio ? (
                <>
                  <span className={styles.menuIcon}>⏳</span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span className={styles.menuIcon}>🎵</span>
                  <span>Get Audio</span>
                </>
              )}
            </button>
            <button 
              className={styles.menuItem}
              onClick={handleDownloadCleanAudio}
              disabled={downloadingCleanAudio}
            >
              {downloadingCleanAudio ? (
                <>
                  <span className={styles.menuIcon}>⏳</span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span className={styles.menuIcon}>🎧</span>
                  <span>Get Clean Audio</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
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
