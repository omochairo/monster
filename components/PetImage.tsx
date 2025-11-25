
import React, { useState, useEffect } from 'react';
import { getFallbackImageUrl } from '../services/geminiService';

interface PetImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  prompt: string; // Required for smart fallback generation
  alt: string;
}

export const PetImage: React.FC<PetImageProps> = ({ src, prompt, alt, className, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset on prop change
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const fallback = getFallbackImageUrl(prompt);
      console.warn(`[PetImage] Load failed for "${prompt}". Switching to fallback.`);
      setImgSrc(fallback);
    }
  };

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
};
