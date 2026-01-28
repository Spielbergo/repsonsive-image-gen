'use client';

import { useState, useRef } from 'react';

export default function ImageUploader({ onImageProcess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [format, setFormat] = useState('jpg');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Process image
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('format', format);

    try {
      const { processImage } = await import('../actions');
      const result = await processImage(formData);
      
      if (result.error) {
        alert('Error processing image: ' + result.error);
      } else {
        onImageProcess(result);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      fileInputRef.current.files = dataTransfer.files;
      handleFileChange({ target: { files: dataTransfer.files } });
    }
  };

  return (
    <div className="uploader-container">
      <div className="format-selector">
        <label htmlFor="format-select">Output Format:</label>
        <select 
          id="format-select"
          value={format} 
          onChange={(e) => setFormat(e.target.value)}
          disabled={uploading}
        >
          <option value="jpg">JPG</option>
          <option value="webp">WebP</option>
          <option value="png">PNG</option>
        </select>
      </div>
      <div 
        className="upload-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {preview ? (
          <div className="preview">
            <img src={preview} alt="Preview" />
            {uploading && (
              <div className="uploading-overlay">
                <div className="spinner"></div>
                <p>Processing image...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="upload-prompt">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3>Upload an Image</h3>
            <p>Click to browse or drag and drop</p>
            <p className="supported-formats">Supports JPG, PNG, WebP, etc.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .uploader-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .format-selector {
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
        }

        .format-selector label {
          font-weight: 500;
          color: #333;
        }

        .format-selector select {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          background: white;
        }

        .format-selector select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-area {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .upload-area:hover {
          border-color: #0070f3;
          background: #f8f9fa;
        }

        .upload-prompt {
          color: #666;
        }

        .upload-prompt svg {
          margin: 0 auto 16px;
          color: #999;
        }

        .upload-prompt h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          color: #333;
        }

        .upload-prompt p {
          margin: 4px 0;
          color: #666;
        }

        .supported-formats {
          font-size: 14px;
          color: #999;
        }

        .preview {
          position: relative;
          max-height: 400px;
        }

        .preview img {
          max-width: 100%;
          max-height: 400px;
          border-radius: 4px;
        }

        .uploading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          color: white;
        }

        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
