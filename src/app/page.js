'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageUploader from './components/ImageUploader.component';
import ResultsDisplay from './components/ResultsDisplay.component';
import pageStyles from './Home.module.css';

export default function Home() {
  const [results, setResults] = useState([]);
  const [selections, setSelections] = useState([]); // array of Sets per result
  const [tocQuery, setTocQuery] = useState('');

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

  const handleImageProcess = (processedResults) => {
    // Expecting an array of processed results from bulk upload
    const arr = Array.isArray(processedResults) ? processedResults : [processedResults];
    setResults(arr);
    // initialize selections (all selected)
    setSelections(arr.map(r => new Set(r.images.map((_, i) => i))));
  };

  const handleReset = () => {
    setResults([]);
    setSelections([]);
  };

  const deselectAllAcrossResults = () => {
    setSelections(results.map(() => new Set()));
  };

  const toggleSelection = (resultIdx, imageIdx) => {
    setSelections(prev => {
      const copy = prev.slice();
      const setForResult = new Set(copy[resultIdx] || []);
      if (setForResult.has(imageIdx)) setForResult.delete(imageIdx); else setForResult.add(imageIdx);
      copy[resultIdx] = setForResult;
      return copy;
    });
  };

  const toggleSelectAllForResult = (resultIdx, selectAll) => {
    setSelections(prev => {
      const copy = prev.slice();
      if (selectAll) {
        const all = new Set(results[resultIdx].images.map((_, i) => i));
        copy[resultIdx] = all;
      } else {
        copy[resultIdx] = new Set();
      }
      return copy;
    });
  };

  const downloadAllAcrossResults = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      results.forEach(res => {
        const folder = zip.folder(res.originalName) || zip;
        res.images.forEach(image => {
          const suffix = mapLabelToSuffix(image.label || (image.width + 'x' + image.height));
          const filename = `${res.originalName}-${suffix}.${res.format}`;
          const binaryData = atob(image.data);
          const arrayBuffer = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) arrayBuffer[i] = binaryData.charCodeAt(i);
          folder.file(filename, arrayBuffer);
        });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipName = results.length === 1 ? `${results[0].originalName}-batch-${timestamp}.zip` : `srcsetify-batch-${timestamp}.zip`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating zip for all results:', error);
      alert('Error creating zip file');
    }
  };

  const downloadSelectedAcrossResults = async () => {
    try {
      // Ensure there is at least one selection
      const anySelected = selections.some(set => set && set.size > 0);
      if (!anySelected) {
        alert('Please select at least one image across results');
        return;
      }

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      results.forEach((res, rIdx) => {
        const sel = selections[rIdx] || new Set();
        if (sel.size === 0) return;
        const folder = zip.folder(res.originalName) || zip;
        res.images.forEach((image, i) => {
          if (sel.has(i)) {
            const suffix = mapLabelToSuffix(image.label || (image.width + 'x' + image.height));
            const filename = `${res.originalName}-${suffix}.${res.format}`;
            const binaryData = atob(image.data);
            const arrayBuffer = new Uint8Array(binaryData.length);
            for (let k = 0; k < binaryData.length; k++) arrayBuffer[k] = binaryData.charCodeAt(k);
            folder.file(filename, arrayBuffer);
          }
        });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipName = results.length === 1 ? `${results[0].originalName}-selected-${timestamp}.zip` : `srcsetify-selected-${timestamp}.zip`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating zip for selected results:', error);
      alert('Error creating zip file');
    }
  };

  return (
    <div className={pageStyles.container}>
      <header className={pageStyles.header}>
        <h1>SrcSetify</h1>
        <p>Generate optimized images for responsive web design</p>
      </header>

      <main className={pageStyles.main}>
        {results.length === 0 ? (
          <ImageUploader onImageProcess={handleImageProcess} />
        ) : (
          <>
            <div className={pageStyles.resetSection}>
              <button className={pageStyles.btnReset} onClick={handleReset}>
                ← Upload New Image
              </button>
              <button className={pageStyles.btnSecondary} onClick={deselectAllAcrossResults}>
                Deselect All
              </button>
              <div className={pageStyles.bulkActions}>
                <button className={pageStyles.btnSecondary} onClick={downloadSelectedAcrossResults}>
                  Download Selected (All)
                </button>
                <button className={pageStyles.btnPrimary} onClick={downloadAllAcrossResults}>
                  Download All (All Results)
                </button>
              </div>
            </div>
            <div className={pageStyles.toc}>
              <div className={pageStyles.tocHeader}>
                <strong>Jump to:</strong>
                <input
                  type="search"
                  placeholder="Filter by filename..."
                  value={tocQuery}
                  onChange={(e) => setTocQuery(e.target.value)}
                  className={pageStyles.tocSearch}
                />
              </div>
              <ul className={pageStyles.tocList}>
                {results
                  .map((r, i) => ({ r, i }))
                  .filter(({ r }) => r.originalName.toLowerCase().includes(tocQuery.trim().toLowerCase()))
                  .map(({ r, i }) => (
                    <li key={`toc-${i}`} className={pageStyles.tocItem}>
                      <input
                        type="checkbox"
                        checked={selections[i] && selections[i].size === (r.images ? r.images.length : 0)}
                        onChange={(e) => toggleSelectAllForResult(i, e.target.checked)}
                        className={pageStyles.tocCheckbox}
                      />
                      {r.images && r.images[0] ? (
                        <img
                          src={`data:image/${r.format === 'png' ? 'png' : r.format === 'webp' ? 'webp' : 'jpeg'};base64,${r.images[0].data}`}
                          alt={r.originalName}
                          className={pageStyles.tocThumb}
                        />
                      ) : (
                        <div className={pageStyles.tocThumbPlaceholder} />
                      )}
                      <a href={`#result-${i}`} title={`Jump to ${r.originalName}`} className={pageStyles.tocLink}>
                        <div className={pageStyles.tocName}>{r.originalName}</div>
                        <div className={pageStyles.tocCount}>{r.images.length} images</div>
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
            {results.map((res, idx) => (
              <ResultsDisplay
                key={idx}
                resultIndex={idx}
                result={res}
                selectedImages={selections[idx]}
                onToggleSelection={toggleSelection}
                onToggleSelectAll={toggleSelectAllForResult}
              />
            ))}
          </>
        )}
      </main>

      <footer className={pageStyles.footer}>
        <p>@ 2026 - SrcSetify - Built with Next.js and Sharp - <Link href="https://webcheddar.ca" target="_blank" rel="noopener noreferrer">A Web Cheddar project</Link></p>
      </footer>

      
    </div>
  );
}
