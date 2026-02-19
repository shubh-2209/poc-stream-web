import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import {
    fetchVideos,
    selectVideos,
    selectVideosLoading,
    selectVideosError,
} from "../features/videos/videosSlice";
import Navbar from "../components/Navbar";
import styles from "../styles/Dashboard/DashboardVideosPage.module.css";

const DashboardVideosPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const videos = useSelector(selectVideos);
    const loading = useSelector(selectVideosLoading);
    const error = useSelector(selectVideosError);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const videoRef = useRef(null);

    useEffect(() => {
        dispatch(fetchVideos({ page: 1, limit: 100 }))
            .unwrap()
            .then((res) => {
                console.log("📦 Overall FetchVideos Response:", res);
            })
            .catch((err) => {
                console.error("❌ FetchVideos Error:", err);
            });
    }, [dispatch]);

    const handleUploadClick = () => {
        navigate("/uploadVideoFilter");
        navigate("/uploadVideoFilter");
    };

    const handleVideoClick = (video) => {
        console.log("🖱 Clicked Video Object:", video);
        setSelectedVideo(video);
    };

    const handleCloseModal = () => {
        if (videoRef.current) {
            videoRef.current.pause();   // video pause
            videoRef.current.currentTime = 0; // optional reset
        }
        setSelectedVideo(null);
    };


    // ── Render ──────────────────────────────────────────────────
    return (
        <div className={styles.page}>
            <Navbar />

            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    {/* <h1 className={styles.title}>My Videos</h1> */}
                    <button className={styles.uploadBtn} onClick={handleUploadClick}>
                        📤 Upload Video
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className={styles.stateBox}>
                        <div className={styles.spinner} />
                        <p>Loading videos...</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className={styles.stateBox}>
                        <p className={styles.errorText}>❌ {error}</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && videos.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📭</div>
                        <h2 className={styles.emptyTitle}>No videos uploaded yet</h2>
                        <p className={styles.emptySubtitle}>
                            Upload your first video to get started
                        </p>
                        <button className={styles.uploadBtn} onClick={handleUploadClick}>
                            📤 Upload Video
                        </button>
                    </div>
                )}

                {/* Videos Grid */}
                {!loading && !error && videos.length > 0 && (
                    <div className={styles.grid}>
                        {videos.map((video, index) => (
                            // <div key={video.id || index} className={styles.videoCard}>
                            <div
                                key={video.id || index}
                                className={styles.videoCard}
                                onClick={() => handleVideoClick(video)}
                                style={{ cursor: "pointer" }}
                            >

                                {/* Thumbnail */}
                                < div className={styles.thumbnail} >
                                    {
                                        video.thumbnailPath || video.posterUrl ? (
                                            <img
                                                src={video.thumbnailPath || video.posterUrl}
                                                alt={video.title || "Video"}
                                                className={styles.thumbnailImg}
                                            />
                                        ) : (
                                            <div className={styles.thumbnailPlaceholder}>🎬</div>
                                        )
                                    }
                                    {
                                        video.duration && (
                                            <span className={styles.duration}>
                                                {formatDuration(video.duration)}
                                            </span>
                                        )
                                    }
                                </div>

                                {/* Info */}
                                <div className={styles.videoInfo}>
                                    <p className={styles.videoTitle}>
                                        {video.title || video.originalFilename || "Untitled"}
                                    </p>
                                    <p className={styles.videoMeta}>
                                        {video.resolution && (
                                            <span className={styles.badge}>{video.resolution}</span>
                                        )}
                                        <span
                                            className={`${styles.badge} ${video.status === "ready"
                                                ? styles.badgeReady
                                                : styles.badgePending
                                                }`}
                                        >
                                            {video.status || "ready"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )
                }
            </div >
            {selectedVideo && (
                <div
                    className={styles.modalOverlay}
                    onClick={handleCloseModal}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className={styles.closeBtn}
                            onClick={(e) => {
                                e.stopPropagation();   // 🔥 important
                                handleCloseModal();
                            }}
                        >
                            ✖
                        </button>

                        <video
                            ref={videoRef}
                            src={
                                // selectedVideo.cloudinaryStreamingUrl ||
                                selectedVideo.cloudinaryUrl
                            }
                            controls
                            autoPlay
                            className={styles.modalVideo}
                        />
                    </div>
                </div>
            )}
        </div >
    );
};

// ── Helper ────────────────────────────────────────────────────
function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default DashboardVideosPage;