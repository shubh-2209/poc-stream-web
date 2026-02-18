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
  const [errors, setErrors] = useState({});

  const MAX_FILE_SIZE = 90 * 1024 * 1024; 
  const ALLOWED_FORMATS = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm'];
  const ALLOWED_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];

  const validateFile = (file) => {
    const fileErrors = {};

    if (!ALLOWED_FORMATS.includes(file.type) && !ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      fileErrors.file = 'Invalid file format. Only MP4, AVI, MOV, MKV, and WEBM are allowed';
      return fileErrors;
    }

    if (file.size > MAX_FILE_SIZE) {
      fileErrors.file = `File size must not exceed 90MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
      return fileErrors;
    }

    if (file.size < 1024) {
      fileErrors.file = 'File is too small. Please select a valid video file';
      return fileErrors;
    }

    return fileErrors;
  };

  const validateTitle = (title) => {
    const titleErrors = {};

    if (!title.trim()) {
      titleErrors.title = 'Video title is required';
    } else if (title.trim().length < 3) {
      titleErrors.title = 'Title must be at least 3 characters';
    } else if (title.trim().length > 100) {
      titleErrors.title = 'Title must not exceed 100 characters';
    }

    return titleErrors;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileErrors = validateFile(file);
      
      if (Object.keys(fileErrors).length > 0) {
        setErrors(fileErrors);
        setUploadFile(null);
        return;
      }

      setErrors({});
      setUploadFile(file);
      
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setUploadTitle(value);
    
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    const titleErrors = validateTitle(uploadTitle);
    if (Object.keys(titleErrors).length > 0) {
      setErrors(titleErrors);
      return;
    }

    if (!uploadFile) {
      setErrors({ file: 'Please select a video file' });
      return;
    }

    const fileErrors = validateFile(uploadFile);
    if (Object.keys(fileErrors).length > 0) {
      setErrors(fileErrors);
      return;
    }

    setErrors({});
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", uploadFile);
      formData.append("title", uploadTitle.trim());

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
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Upload failed';
      setErrors({ submit: errorMessage });
      setUploading(false);
      setUploadProgress(0);
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
          
          {errors.submit && (
            <div className={styles.errorMsg}>{errors.submit}</div>
          )}
          
          <form onSubmit={handleUploadSubmit}>
            <div className={styles.dropZone}>
              <input
                type="file"
                id="videoFile"
                accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm,.mp4,.avi,.mov,.mkv,.webm"
                onChange={handleFileChange}
                disabled={uploading}
                className={styles.fileInput}
              />
              <label htmlFor="videoFile" className={`${styles.dropLabel} ${errors.file ? styles.dropLabelError : ''}`}>
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
              {errors.file && (
                <span className={styles.fieldError}>{errors.file}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">Video Title</label>
              <input
                type="text"
                id="title"
                value={uploadTitle}
                onChange={handleTitleChange}
                placeholder="Enter video title (3-100 characters)"
                disabled={uploading}
                maxLength="100"
                className={`${styles.titleInput} ${errors.title ? styles.inputError : ''}`}
              />
              {errors.title && (
                <span className={styles.fieldError}>{errors.title}</span>
              )}
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
