import React, { useState, useEffect } from 'react';
import { GeneratedPet } from '../types';
import { generatePetImage, getFallbackImageUrl } from '../services/geminiService';
import { bodyIndexOf, formOfLevel, isBossPrompt } from '../services/species';
import { MonsterArt } from './MonsterArt';

interface PetImageProps {
  pet: GeneratedPet;
  alt?: string;
  className?: string;
  silhouette?: boolean;
}

// Monsters are drawn locally; only the family bosses use photos (with an embedded fallback).
export const PetImage: React.FC<PetImageProps> = ({ pet, alt, className, silhouette }) => {
  const isPhoto = isBossPrompt(pet.imagePrompt);
  const photoUrl = isPhoto ? generatePetImage(pet.imagePrompt) : '';
  const [imgSrc, setImgSrc] = useState(photoUrl);

  useEffect(() => {
    setImgSrc(photoUrl);
  }, [photoUrl]);

  if (isPhoto) {
    return (
      <img
        src={imgSrc}
        alt={alt || pet.name}
        className={className}
        onError={() => setImgSrc(getFallbackImageUrl(pet.imagePrompt))}
        loading="lazy"
      />
    );
  }

  return (
    <MonsterArt
      seed={pet.imagePrompt}
      bodyIndex={bodyIndexOf(pet)}
      elementId={pet.element.id}
      form={formOfLevel(pet.level)}
      shiny={pet.shiny}
      silhouette={silhouette}
      className={className}
      title={alt || pet.name}
    />
  );
};
