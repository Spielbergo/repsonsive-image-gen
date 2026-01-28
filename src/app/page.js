'use client';

import { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultsDisplay from './components/ResultsDisplay';

export default function Home() {
  const [result, setResult] = useState(null);

  const handleImageProcess = (processedResult) => {
    setResult(processedResult);
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>SrcSetify</h1>
        <p>Generate optimized images for responsive web design</p>
      </header>

      <main className="main">
        {!result ? (
          <ImageUploader onImageProcess={handleImageProcess} />
        ) : (
          <>
            <div className="reset-section">
              <button className="btn-reset" onClick={handleReset}>
                ← Upload New Image
              </button>
            </div>
            <ResultsDisplay result={result} />
          </>
        )}
      </main>

      <footer className="footer">
        <p>SrcSetify - Built with Next.js and Sharp</p>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          text-align: center;
          padding: 60px 20px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .header h1 {
          margin: 0 0 12px 0;
          font-size: 36px;
          font-weight: 700;
        }

        .header p {
          margin: 0;
          font-size: 18px;
          opacity: 0.9;
        }

        .main {
          flex: 1;
          padding: 40px 20px;
          background: #f5f5f5;
        }

        .reset-section {
          max-width: 1200px;
          margin: 0 auto 20px;
          padding: 0 20px;
        }

        .btn-reset {
          background: white;
          color: #667eea;
          border: 1px solid #667eea;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-reset:hover {
          background: #667eea;
          color: white;
        }

        .footer {
          text-align: center;
          padding: 20px;
          background: #333;
          color: #999;
        }

        .footer p {
          margin: 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
