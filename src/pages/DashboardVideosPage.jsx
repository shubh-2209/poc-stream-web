import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    fetchVideos,
    selectVideos,
    selectVideosLoading,
    selectVideosError,
} from "../features/videos/videosSlice";
import Navbar from "../components/Navbar";
import styles from "../styles/Dashboard/DashboardVideosPage.module.css";

const getCloudinaryThumb = (video) => {
    if (!video?.cloudinaryUrl || !video?.cloudinaryPublicId) return null;
    try {
        const url = new URL(video.cloudinaryUrl);
        const cloudName = url.pathname.split("/")[1];
        return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,f_jpg,q_auto,w_400,ar_16:9,c_fill/${video.cloudinaryPublicId}.jpg`;
    } catch {
        return null;
    }
};

const DashboardVideosPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const videos = useSelector(selectVideos);
    const loading = useSelector(selectVideosLoading);
    const error = useSelector(selectVideosError);

    const [selectedVideo, setSelectedVideo] = useState(null);
    const [hoverTime, setHoverTime] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const videoRef = useRef(null);
    const wrapperRef = useRef(null);
    const hoverThumbRef = useRef(null);

    useEffect(() => {
        dispatch(fetchVideos({ page: 1, limit: 100, type: "video" }));
    }, [dispatch]);

    useEffect(() => {
        const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", onFSChange);
        return () => document.removeEventListener("fullscreenchange", onFSChange);
    }, []);

    const toggleFullscreen = useCallback((e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            wrapperRef.current?.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    const handleVideoClick = (video) => setSelectedVideo(video);

    const handleCloseModal = () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
        videoRef.current?.pause();
        if (videoRef.current) videoRef.current.currentTime = 0;
        setSelectedVideo(null);
        setHoverTime(null);
    };

    const handleHoverThumbnail = (e) => {
        const vt = selectedVideo?.videoThumbnails;
        const sprite = vt?.sprite ?? selectedVideo?.spriteData ?? selectedVideo?.sprite ?? null;
        const interval = vt?.interval ?? selectedVideo?.spriteInterval ?? selectedVideo?.interval ?? 1;
        const duration = vt?.duration ?? selectedVideo?.duration;

        if (!sprite || !duration || !videoRef.current) return;

        const rect = wrapperRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const CONTROLS_ZONE = 70;
        if (mouseY < rect.height - CONTROLS_ZONE) {
            setHoverTime(null);
            return;
        }

        const percent = Math.max(0, Math.min(mouseX / rect.width, 1));
        const time = percent * duration;

        setHoverTime(time);

        const frameIndex = Math.floor(time / interval);
        const col = frameIndex % sprite.columns;
        const row = Math.floor(frameIndex / sprite.columns);

        if (hoverThumbRef.current) {
            hoverThumbRef.current.style.backgroundPosition =
                `-${col * sprite.thumbWidth}px -${row * sprite.thumbHeight}px`;
            const left = Math.max(0, Math.min(
                mouseX - sprite.thumbWidth / 2,
                rect.width - sprite.thumbWidth
            ));
            hoverThumbRef.current.style.left = `${left}px`;
        }
    };

    return (
        <div className={styles.page}>
            <Navbar />
            <div className={styles.content}>

                <div className={styles.header}>
                    <button className={styles.uploadBtn} onClick={() => navigate("/uploadVideoFilter")}>
                        📤 Upload Video
                    </button>
                </div>

                {loading && (
                    <div className={styles.stateBox}>
                        <div className={styles.spinner} />
                        <p>Loading videos...</p>
                    </div>
                )}
                {!loading && error && (
                    <div className={styles.stateBox}>
                        <p className={styles.errorText}>❌ {error}</p>
                    </div>
                )}
                {!loading && !error && videos.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📭</div>
                        <h2 className={styles.emptyTitle}>No videos uploaded yet</h2>
                        <p className={styles.emptySubtitle}>Upload your first video to get started</p>
                        <button className={styles.uploadBtn} onClick={() => navigate("/uploadVideoFilter")}>
                            📤 Upload Video
                        </button>
                    </div>
                )}

                {!loading && !error && videos.length > 0 && (
                    <div className={styles.grid}>
                        {videos.map((video, index) => {
                            const vt = video.videoThumbnails;
                            const sprite = vt?.sprite ?? video.spriteData ?? video.sprite ?? null;
                            const dur = vt?.duration ?? video.duration;
                            const thumbUrl = getCloudinaryThumb(video);

                            return (
                                <div
                                    key={video.id || index}
                                    className={styles.videoCard}
                                    onClick={() => handleVideoClick(video)}
                                >
                                    <div className={styles.thumbnail}>
                                        {thumbUrl ? (
                                            <img
                                                src={thumbUrl}
                                                alt={video.title || "Video"}
                                                className={styles.thumbnailImg}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className={styles.thumbnailPlaceholder}>🎬</div>
                                        )}
                                        {dur && (
                                            <span className={styles.duration}>{formatDuration(dur)}</span>
                                        )}
                                    </div>
                                    <div className={styles.videoInfo}>
                                        <p className={styles.videoTitle}>
                                            {video.title || video.originalFilename || "Untitled"}
                                        </p>
                                        <div className={styles.videoMeta}>
                                            {video.resolution && (
                                                <span className={styles.badge}>{video.resolution}</span>
                                            )}
                                            <span className={`${styles.badge} ${video.status === "ready" ? styles.badgeReady : styles.badgePending}`}>
                                                {video.status || "ready"}
                                            </span>
                                            {sprite && (
                                                <span className={`${styles.badge} ${styles.badgeSprite}`}>🎞 Preview</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedVideo && (() => {
                const vt = selectedVideo.videoThumbnails;
                const sprite = vt?.sprite ?? selectedVideo.spriteData ?? selectedVideo.sprite ?? null;

                return (
                    <div className={styles.modalOverlay} onClick={handleCloseModal}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

                            <button
                                className={styles.closeBtn}
                                onClick={(e) => { e.stopPropagation(); handleCloseModal(); }}
                            >
                                ✖
                            </button>

                            <div
                                ref={wrapperRef}
                                className={styles.videoWrapper}
                                onMouseMove={handleHoverThumbnail}
                                onMouseLeave={() => setHoverTime(null)}
                            >

                                <video
                                    ref={videoRef}
                                    src={selectedVideo.cloudinaryUrl}
                                    controls
                                    autoPlay
                                    className={styles.modalVideo}
                                />

                                {/* Custom fullscreen button */}
                                <button
                                    className={styles.fsBtn}
                                    onClick={toggleFullscreen}
                                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? (
                                        // Compress/exit icon
                                        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                                            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                                        </svg>
                                    ) : (
                                        // Expand/enter icon
                                        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                                            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                                        </svg>
                                    )}
                                </button>

                                {/* Hover sprite thumbnail */}
                                {sprite && hoverTime !== null && (
                                    <div
                                        ref={hoverThumbRef}
                                        className={styles.hoverThumbnail}
                                        style={{
                                            backgroundImage: `url('${sprite.path}')`,
                                            width: `${sprite.thumbWidth}px`,
                                            height: `${sprite.thumbHeight}px`,
                                            backgroundSize: `${sprite.spriteWidth}px ${sprite.spriteHeight}px`,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default DashboardVideosPage;