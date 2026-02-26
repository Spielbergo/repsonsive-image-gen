'use client';

import { useState, useEffect } from 'react';

export default function ResultsDisplay({ result }) {
  const [directoryPath, setDirectoryPath] = useState('');
  const [generatedSrcset, setGeneratedSrcset] = useState('');
  const [selectedImages, setSelectedImages] = useState(new Set());
  
  if (!result) return null;

  const { images, originalName, format, sizesAttr, metadata } = result;

  // Initialize all images as selected when result changes
  useEffect(() => {
    const allIndices = new Set(images.map((_, index) => index));
    setSelectedImages(allIndices);
  }, [images]);

  // Generate srcset whenever directoryPath changes
  useEffect(() => {
    const baseDir = directoryPath.trim() || 'images';
    const srcsetString = images
      .map(img => {
        const filename = `${originalName}-${img.width}x${img.height}.${format}`;
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
    link.download = `${originalName}-${image.width}x${image.height}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    if (selectedImages.size === 0) {
      alert('Please select at least one image to download');
      return;
    }

    try {
      // Dynamic import of JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add selected images to zip
      images.forEach((image, index) => {
        if (selectedImages.has(index)) {
          const filename = `${originalName}-${image.width}x${image.height}.${format}`;
          // Convert base64 to blob
          const binaryData = atob(image.data);
          const arrayBuffer = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            arrayBuffer[i] = binaryData.charCodeAt(i);
          }
          zip.file(filename, arrayBuffer);
        }
      });

      // Generate zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Download zip
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
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  const selectAll = () => {
    const allIndices = new Set(images.map((_, index) => index));
    setSelectedImages(allIndices);
  };

  const toggleSelectAll = () => {
    if (selectedImages.size === images.length) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const allSelected = selectedImages.size === images.length;

  const copySrcset = () => {
    const fullSrcsetCode = `srcset="${generatedSrcset}" sizes="${sizesAttr}"`;
    navigator.clipboard.writeText(fullSrcsetCode);
    alert('Srcset code copied to clipboard!');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Generated Images</h2>
        <div className="header-actions">
          <button className="btn-secondary" onClick={toggleSelectAll}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <button className="btn-primary" onClick={handleDownloadAll}>
            Download Selected ({selectedImages.size})
          </button>
        </div>
      </div>

      <div className="srcset-section">
        <h3>Directory Path (optional)</h3>
        <div className="directory-input-group">
          <input
            type="text"
            placeholder="e.g., https://example.com/wp-content/uploads/2025/10 or images"
            value={directoryPath}
            onChange={(e) => setDirectoryPath(e.target.value)}
            className="directory-input"
          />
          <p className="input-hint">Leave empty to use "images" as default</p>
        </div>
        
        <h3>Srcset Code</h3>
        <div className="code-block">
          <code>srcset="{generatedSrcset}" sizes="{sizesAttr}"</code>
        </div>
        <button className="btn-secondary" onClick={copySrcset}>
          Copy to Clipboard
        </button>
      </div>

      <div className="images-grid">
        {images.map((image, index) => (
          <div key={image.width} className={`image-card ${selectedImages.has(index) ? 'selected' : ''}`}>
            <div className="selection-overlay">
              <input
                type="checkbox"
                checked={selectedImages.has(index)}
                onChange={() => toggleImageSelection(index)}
                className="image-checkbox"
              />
            </div>
            <div className="image-preview">
              <img 
                src={`data:image/${format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpeg'};base64,${image.data}`} 
                alt={`${image.width}x${image.height}`}
              />
            </div>
            <div className="image-info">
              <h4>{image.width}x{image.height}</h4>
              <p className="file-size">{formatFileSize(image.size)}</p>
              <button 
                className="btn-download"
                onClick={() => handleDownload(image)}
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .results-container {
          width: 100%;
          max-width: 1200px;
          margin: 40px auto;
          padding: 0 20px;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .results-header h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .srcset-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 32px;
        }

        .srcset-section h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #333;
        }

        .srcset-section h3:not(:first-child) {
          margin-top: 24px;
        }

        .directory-input-group {
          margin-bottom: 24px;
        }

        .directory-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: 'Courier New', monospace;
        }

        .directory-input:focus {
          outline: none;
          border-color: #0070f3;
        }

        .input-hint {
          margin: 8px 0 0 0;
          font-size: 13px;
          color: #666;
          font-style: italic;
        }

        .code-block {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 12px;
          overflow-x: auto;
        }

        .code-block code {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #d63384;
          word-break: break-all;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }

        .image-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }

        .image-card.selected {
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.1);
        }

        .image-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .selection-overlay {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 10;
        }

        .image-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #0070f3;
        }

        .image-preview {
          width: 100%;
          height: 200px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .image-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .image-info {
          padding: 16px;
        }

        .image-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #333;
        }

        .file-size {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #666;
        }

        .btn-primary {
          background: #0070f3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .btn-primary:hover {
          background: #0051cc;
        }

        .btn-secondary {
          background: white;
          color: #0070f3;
          border: 1px solid #0070f3;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #0070f3;
          color: white;
        }

        .btn-download {
          width: 100%;
          background: #f8f9fa;
          color: #333;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-download:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }
      `}</style>
    </div>
  );
}
