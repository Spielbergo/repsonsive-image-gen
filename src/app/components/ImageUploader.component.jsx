'use client';

import { useState, useRef } from 'react';
import styles from './ImageUploader.module.css';

export default function ImageUploader({ onImageProcess }) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [format, setFormat] = useState('webp');
  const allSizes = ['small-mobile','mobile','card','tablet','desktop','large'];
  const [selectedSizes, setSelectedSizes] = useState(new Set(allSizes));
  const [mode, setMode] = useState('full'); // 'full' or 'streamlined'
  const fileInputRef = useRef(null);

  const handleFileSelection = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Show previews
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ name: file.name, dataUrl: reader.result });
        reader.readAsDataURL(file);
      });
    });

    const previewResults = await Promise.all(readers);
    setPreviews(previewResults);
    setSelectedFiles(files);
  };

  const handleProcess = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select one or more files first');
      return;
    }

    setUploading(true);
    try {
      const { processImage } = await import('../actions');

      const sizesPayload = Array.from(selectedSizes).join(',');

      const processPromises = selectedFiles.map(file => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('format', format);
        if (sizesPayload) formData.append('selectedSizes', sizesPayload);
        return processImage(formData);
      });

      const results = await Promise.all(processPromises);

      const errors = results.filter(r => r && r.error);
      if (errors.length) {
        console.error('Some images failed:', errors);
        alert('One or more images failed to process. Check the console for details.');
      }

      onImageProcess(results);
      // clear selections after processing
      setSelectedFiles([]);
      setPreviews([]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading images');
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
    
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) {
      const dataTransfer = new DataTransfer();
      files.forEach(f => dataTransfer.items.add(f));
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelection({ target: { files: dataTransfer.files } });
    }
  };

  return (
    <div className={styles.uploaderContainer}>
      <div className={styles.formatSelector}>
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
        className={styles.uploadArea}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelection}
          className={styles.hiddenInput}
        />

        {previews && previews.length > 0 ? (
          <div className={styles.previewGrid}>
            {previews.map((p, idx) => (
              <div className={styles.previewItem} key={p.name + idx}>
                <img src={p.dataUrl} alt={p.name} />
              </div>
            ))}
            {uploading && (
              <div className={styles.uploadingOverlay}>
                <div className={styles.spinner}></div>
                <p>Processing images...</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.uploadPrompt}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3>Upload an Image</h3>
            <p>Click to browse or drag and drop</p>
            <p className={styles.supportedFormats}>Supports JPG, PNG, WebP, etc.</p>
          </div>
        )}
      </div>

      <div className={styles.optionsRow}>
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'full' ? styles.active : ''}`}
            onClick={() => {
              setMode('full');
              setSelectedSizes(new Set(allSizes));
            }}
          >
            Full set
          </button>
            <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'streamlined' ? styles.active : ''}`}
            onClick={() => {
              setMode('streamlined');
              setSelectedSizes(new Set(['mobile','tablet','card']));
            }}
          >
            Streamlined
          </button>
        </div>

        <div className={styles.sizeOptions}>
          <strong>Sizes:</strong>
          {mode === 'full' ? (
            <div className={styles.smallNote}>Full set selected — all standard sizes will be generated.</div>
          ) : (
            allSizes.map((s) => (
              <label key={s} className={styles.customCheck}>
                <input
                  type="checkbox"
                  checked={selectedSizes.has(s)}
                  onChange={(e) => {
                    const next = new Set(selectedSizes);
                    if (e.target.checked) next.add(s); else next.delete(s);
                    setSelectedSizes(next);
                  }}
                />
                <span className={styles.customBox} />
                <span className={styles.sizeLabel}>{s.replace('-', ' ')}</span>
              </label>
            ))
          )}
        </div>

        <div className={styles.actionRow}>
          <button className={styles.btnPrimary} onClick={handleProcess} disabled={uploading || selectedFiles.length === 0}>
            {uploading ? 'Processing...' : 'Process Selected Images'}
          </button>
        </div>
      </div>
    </div>
  );
}
