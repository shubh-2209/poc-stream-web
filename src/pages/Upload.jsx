import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/apiHelper";
import Navbar from "../components/Navbar";
import styles from "./Upload.module.css";

const Upload = () => {
  const navigate = useNavigate();
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", uploadFile);
      formData.append("title", uploadTitle || uploadFile.name);

      await api.post("/videos/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setUploadSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + (err?.response?.data?.message || err.message));
      setUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className={styles.uploadPage}>
        <Navbar />
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>✓</div>
          <h2>Upload Successful!</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.uploadPage}>
      <Navbar />
      
      <div className={styles.uploadContainer}>
        <div className={styles.uploadCard}>
          <h1>Upload New Reel</h1>
          
          <form onSubmit={handleUploadSubmit}>
            <div className={styles.dropZone}>
              <input
                type="file"
                id="videoFile"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploading}
                required
                className={styles.fileInput}
              />
              <label htmlFor="videoFile" className={styles.dropLabel}>
                {uploadFile ? (
                  <>
                    <div className={styles.fileIcon}>📹</div>
                    <p className={styles.fileName}>{uploadFile.name}</p>
                    <p className={styles.fileSize}>
                      {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <div className={styles.uploadIcon}>☁️</div>
                    <p>Click to select video or drag and drop</p>
                    <p className={styles.hint}>MP4, AVI, MOV, MKV, WEBM (Max 90MB)</p>
                  </>
                )}
              </label>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">Video Title</label>
              <input
                type="text"
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={uploading}
                required
                className={styles.titleInput}
              />
            </div>

            {uploading && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className={styles.progressText}>{uploadProgress}% Uploading</p>
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                disabled={uploading}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className={styles.submitBtn}
              >
                {uploading ? "Uploading..." : "Upload Video"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;
