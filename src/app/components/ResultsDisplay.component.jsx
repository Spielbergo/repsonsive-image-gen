 'use client';

import { useState, useEffect } from 'react';
import styles from './ResultsDisplay.module.css';

export default function ResultsDisplay({ result, resultIndex, selectedImages: selectedImagesProp, onToggleSelection, onToggleSelectAll }) {
  const [directoryPath, setDirectoryPath] = useState('');
  const [generatedSrcset, setGeneratedSrcset] = useState('');
  const [localSelectedImages, setLocalSelectedImages] = useState(new Set());

  if (!result) return null;

  const { images = [], originalName = 'image', format = 'jpg', sizesAttr = '' } = result;

  function mapLabelToSuffix(label) {
    if (!label) return '';
    const map = {
      'small-mobile': 'mob-sm',
      'mobile': 'mob',
      'tablet': 'tablet',
      'desktop': 'desktop',
      'large': 'mob-lg'
    };
    if (map[label]) return map[label];
    // Try to map numeric widths (e.g., '640' or '640x360') to nearest logical label
    const numMatch = String(label).match(/(\d+)(?:x\d+)?$/);
    if (numMatch) {
      const w = parseInt(numMatch[1], 10);
      if (w <= 360) return 'mob-sm';
      if (w <= 480) return 'mob';
      if (w <= 768) return 'tablet';
      if (w <= 1366) return 'desktop';
      return 'large';
    }
    return String(label).replace(/\s+/g, '-');
  }

  useEffect(() => {
    const allIndices = new Set(images.map((_, index) => index));
    if (selectedImagesProp === undefined) setLocalSelectedImages(allIndices);
  }, [images, selectedImagesProp]);

  useEffect(() => {
    const baseDir = directoryPath.trim() || 'images';
    const srcsetString = images
      .map((img) => {
        const suffix = mapLabelToSuffix(img.label || `${img.width}x${img.height}`);
        const filename = `${originalName}-${suffix}.${format}`;
        const fullPath = `${baseDir}/${filename}`;
        return `${fullPath} ${img.width}w`;
      })
      .join(', ');
    setGeneratedSrcset(srcsetString);
  }, [directoryPath, images, originalName, format]);

  const handleDownload = (image) => {
    const mimeType = format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg';
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${image.data}`;
    const suffix = mapLabelToSuffix(image.label || `${image.width}x${image.height}`);
    link.download = `${originalName}-${suffix}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    const sel = selectedImagesProp !== undefined ? selectedImagesProp : localSelectedImages;
    if (!sel || sel.size === 0) {
      alert('Please select at least one image to download');
      return;
    }

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < images.length; i++) {
        if (sel.has(i)) {
          const image = images[i];
          const suffix = mapLabelToSuffix(image.label || `${image.width}x${image.height}`);
          const filename = `${originalName}-${suffix}.${format}`;
          const binaryString = atob(image.data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let j = 0; j < len; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          zip.file(filename, bytes);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${originalName}-responsive-images.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating zip:', error);
      alert('Error creating zip file');
    }
  };

  const toggleImageSelection = (index) => {
    if (onToggleSelection) {
      onToggleSelection(resultIndex, index);
      return;
    }
    setLocalSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  const deselectAll = () => {
    if (onToggleSelectAll) {
      onToggleSelectAll(resultIndex, false);
      return;
    }
    setLocalSelectedImages(new Set());
  };

  const selectAll = () => {
    if (onToggleSelectAll) {
      onToggleSelectAll(resultIndex, true);
      return;
    }
    const allIndices = new Set(images.map((_, index) => index));
    setLocalSelectedImages(allIndices);
  };

  const toggleSelectAll = () => {
    const sel = selectedImagesProp !== undefined ? selectedImagesProp : localSelectedImages;
    if (sel.size === images.length) deselectAll();
    else selectAll();
  };

  const selSet = selectedImagesProp !== undefined ? selectedImagesProp : localSelectedImages;
  const allSelected = selSet.size === images.length;

  const copySrcset = () => {
    const fullSrcsetCode = `srcset="${generatedSrcset}" sizes="${sizesAttr}"`;
    navigator.clipboard.writeText(fullSrcsetCode);
    alert('Srcset code copied to clipboard!');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={styles.resultsContainer} id={`result-${resultIndex}`}>
      <h3 className={styles.originalName}>{originalName}</h3>
      <div className={styles.resultsHeader}>
        <h2>Generated Images</h2>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={toggleSelectAll}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <button className={styles.btnPrimary} onClick={handleDownloadAll}>
            Download Selected ({selSet.size})
          </button>
        </div>
      </div>

      <div className={styles.srcsetSection}>
        <h3>Directory Path (optional)</h3>
        <div className={styles.directoryInputGroup}>
          <input
            type="text"
            placeholder="e.g., https://example.com/wp-content/uploads/2025/10 or images"
            value={directoryPath}
            onChange={(e) => setDirectoryPath(e.target.value)}
            className={styles.directoryInput}
          />
          <p className={styles.inputHint}>Leave empty to use "images" as default</p>
        </div>

        <h3>Srcset Code</h3>
        <div className={styles.codeBlock}>
          <code>srcset="{generatedSrcset}" sizes="{sizesAttr}"</code>
        </div>
        <button className={styles.btnSecondary} onClick={copySrcset}>
          Copy to Clipboard
        </button>
      </div>

      <div className={styles.imagesGrid}>
        {images.map((image, index) => (
          <div key={image.width + '-' + index} className={`${styles.imageCard} ${selSet.has(index) ? styles.imageCardSelected : ''}`}>
            <div className={styles.selectionOverlay}>
              <input
                type="checkbox"
                checked={selSet.has(index)}
                onChange={() => toggleImageSelection(index)}
                className={styles.imageCheckbox}
              />
            </div>
            <div className={styles.imagePreview}>
              <img
                src={`data:image/${format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpeg'};base64,${image.data}`}
                alt={`${image.width}x${image.height}`}
              />
            </div>
            <div className={styles.imageInfo}>
              <h4>{`${originalName}-${mapLabelToSuffix(image.label || `${image.width}x${image.height}`)}`}</h4>
              <p className={styles.fileSize}>{formatFileSize(image.size)} — {image.width}×{image.height}</p>
              <button
                className={styles.btnDownload}
                onClick={() => handleDownload(image)}
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

