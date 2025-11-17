import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoCarouselProps {
  images: string[];
  autoPlayInterval?: number;
  showControls?: boolean;
  className?: string;
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  images,
  autoPlayInterval = 5000,
  showControls = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const nextImage = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 1000);
  };

  const previousImage = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 1000);
  };

  const goToImage = (index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 1000);
  };

  useEffect(() => {
    if (images.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [images.length, autoPlayInterval]);

  if (images.length === 0) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          style={{
            animation: index === currentIndex ? 'kenBurns 20s ease-out infinite' : 'none',
          }}
        >
          <img
            src={image}
            alt={`WEC Championship Photo ${index + 1}`}
            className="w-full h-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 z-20 pointer-events-none" />

      {/* Navigation Controls */}
      {showControls && images.length > 1 && (
        <>
          {/* Previous/Next Buttons - Larger for mobile */}
          <button
            onClick={previousImage}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-primary/90 hover:bg-primary text-primary-foreground p-3 md:p-4 rounded-full transition-all hover:scale-110 active:scale-95 shadow-lg"
            aria-label="Previous image"
            data-testid="button-carousel-previous"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-primary/90 hover:bg-primary text-primary-foreground p-3 md:p-4 rounded-full transition-all hover:scale-110 active:scale-95 shadow-lg"
            aria-label="Next image"
            data-testid="button-carousel-next"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Dot Indicators - Larger and easier to tap on mobile */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 md:gap-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary w-8 md:w-10 h-3 md:h-4 scale-110'
                    : 'bg-white/60 hover:bg-white/90 w-3 md:w-4 h-3 md:h-4'
                }`}
                aria-label={`Go to image ${index + 1}`}
                data-testid={`button-carousel-dot-${index}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 z-30 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Global styles for Ken Burns effect */}
      <style>{`
        @keyframes kenBurns {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default PhotoCarousel;
