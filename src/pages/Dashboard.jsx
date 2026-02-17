import { useEffect, useRef, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchVideos,
  selectVideos,
  selectVideosLoading,
  selectVideosError,
  selectCurrentPage,
  selectHasMore,
} from "../features/videos/videosSlice";
import Navbar from "../components/Navbar";
import ReelCard from "../components/ReelCard";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const videos = useSelector(selectVideos);
  const loading = useSelector(selectVideosLoading);
  const error = useSelector(selectVideosError);
  const currentPage = useSelector(selectCurrentPage);
  const hasMore = useSelector(selectHasMore);

  const [visibleVideoIndex, setVisibleVideoIndex] = useState(0);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchVideos({ page: 1, limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    if (videos.length > 0) {
      console.log('Videos loaded:', videos);
      console.log('First video:', videos[0]);
    }
  }, [videos]);

  const lastVideoRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          dispatch(fetchVideos({ page: currentPage + 1, limit: 1000 }));
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, currentPage, dispatch]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index);
            setVisibleVideoIndex(index);
          }
        });
      },
      { threshold: 0.7 }
    );

    const videoElements = container.querySelectorAll("[data-index]");
    videoElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [videos]);

  return (
    <div className={styles.dashboard}>
      <Navbar />

     
     <div className="up_btn">
      <button 
        className={styles.uploadBtn} 
        onClick={() => navigate("/upload")}
      >
        + Upload Reel
      </button>
      </div>

      <div className={styles.reelsContainer} ref={containerRef}>
        {videos.map((video, index) => (
          <div
            key={video.id || index}
            data-index={index}
            ref={index === videos.length - 1 ? lastVideoRef : null}
            style={{ paddingTop: index === 0 ? '70px' : '0' }}
          >
            <ReelCard video={video} isVisible={visibleVideoIndex === index} />
          </div>
        ))}

        {loading && (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <p>Loading more reels...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <p>❌ {error}</p>
          </div>
        )}

        {!loading && !hasMore && videos.length > 0 && (
          <div className={styles.endMessage}>
            <p>🎉 You've reached the end!</p>
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className={styles.empty}>
            <p>📹 No videos available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
