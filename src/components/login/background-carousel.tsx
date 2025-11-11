import { useState, useEffect, memo, useMemo, useCallback } from 'react';

export const BackgroundCarousel = memo(() => {
  // Memoize the background images array to prevent recreation
  const backgroundImages = useMemo(
    () => [
      '/assets/bg1-travel.png',
      '/assets/bg2-vintage.png',
      '/assets/bg3-galaxy.png',
      '/assets/bg4-polaroid.png',
      '/assets/bg6-christmas.png',
      '/assets/bg7-dark-polaroid.jpg',
      '/assets/bg8-retro-film.png',
      '/assets/bg10-friends.png',
      '/assets/bg11-scrapbook.png'
    ],
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledImages, setShuffledImages] = useState(backgroundImages);

  // Memoize shuffle function to prevent recreation
  const shuffleArray = useCallback((array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  useEffect(() => {
    // Initial shuffle
    setShuffledImages(shuffleArray(backgroundImages));
  }, [shuffleArray, backgroundImages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % shuffledImages.length;

        // When we complete a full cycle, shuffle again
        if (nextIndex === 0) {
          setShuffledImages(shuffleArray(backgroundImages));
        }

        return nextIndex;
      });
    }, 5000); // 5 seconds per image

    return () => clearInterval(interval);
  }, [shuffledImages.length, shuffleArray, backgroundImages]);

  return (
    <>
      {shuffledImages.map((image, index) => {
        const isActive = index === currentIndex;

        return (
          <div
            key={`${image}-${index}`}
            className='absolute inset-0 transition-opacity duration-[2000ms] ease-in-out'
            style={{
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 1 : 0
            }}
          >
            {/* Background image */}
            <div
              className='absolute inset-0 bg-cover bg-center bg-no-repeat'
              style={{
                backgroundImage: `url(${image})`
              }}
            />
            {/* Dark tint overlay */}
            <div className='absolute inset-0 glass-morphism' />
          </div>
        );
      })}

      {/* Preload next image to prevent gaps */}
      <div className='absolute inset-0 opacity-0' style={{ zIndex: -1 }}>
        <div
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{
            backgroundImage: `url(${
              shuffledImages[(currentIndex + 1) % shuffledImages.length]
            })`
          }}
        />
        <div className='absolute inset-0 glass-morphism' />
      </div>
    </>
  );
});

BackgroundCarousel.displayName = 'BackgroundCarousel';

