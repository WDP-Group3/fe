import { useState, useEffect } from 'react';
import { Button } from './index';

const Carousel = ({
  items = [],
  autoPlay = true,
  interval = 2000,
  showDots = true,
  showArrows = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  if (items.length === 0) return null;

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
      {/* Carousel Container */}
      <div className="relative h-64 sm:h-80 md:h-96">
        {items.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${item.image})`,
              }}
            >
              <div className="flex h-full items-center justify-center bg-gradient-to-r from-black/60 via-black/40 to-transparent">
                <div className="mx-auto max-w-4xl px-6 text-white">
                  {item.title && (
                    <h2 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">
                      {item.title}
                    </h2>
                  )}
                  {item.description && (
                    <p className="mb-4 text-sm sm:text-base md:text-lg text-white/90">
                      {item.description}
                    </p>
                  )}
                  {item.button && (
                    <Button
                      variant="primary"
                      onClick={item.button.onClick}
                      className="!rounded-lg"
                    >
                      {item.button.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition hover:bg-white"
            aria-label="Previous slide"
          >
            <svg className="h-6 w-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition hover:bg-white"
            aria-label="Next slide"
          >
            <svg className="h-6 w-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
