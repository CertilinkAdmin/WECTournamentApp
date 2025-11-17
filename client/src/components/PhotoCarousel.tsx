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

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      nextImage();
    }, autoPlayInterval);

    return () => {
      clearInterval(interval);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [currentIndex, images.length, autoPlayInterval]);

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 1000);
  };

  const previousImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 1000);
  };

  const goToImage = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 1000);
  };

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
          {/* Previous/Next Buttons */}
          <button
            onClick={previousImage}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-primary/80 hover:bg-primary text-primary-foreground p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
            aria-label="Previous image"
            data-testid="button-carousel-previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-primary/80 hover:bg-primary text-primary-foreground p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
            aria-label="Next image"
            data-testid="button-carousel-next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                disabled={isTransitioning}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary w-8 scale-110'
                    : 'bg-white/50 hover:bg-white/80'
                } disabled:cursor-not-allowed`}
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
