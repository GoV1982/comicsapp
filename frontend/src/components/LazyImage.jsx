import { useState, useRef, useEffect } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

export default function LazyImage({ src, alt, className, onError, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Función para obtener la URL proxied si es externa
  const getProxiedSrc = (src) => {
    if (src && src.startsWith('http')) {
      return `/api/public/proxy-image?url=${encodeURIComponent(src)}`;
    }
    return src;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('Error loading image:', src);
    setHasError(true);
    if (onError) onError();
  };

  if (hasError) {
    return (
      <div className={`bg-gray-100 rounded flex items-center justify-center ${className}`}>
        <ImageOff className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isInView && (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          )}
          <img
            src={getProxiedSrc(src) || null}
            alt={alt}
            className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </>
      )}
      {!isInView && (
        <div className="bg-gray-100 rounded flex items-center justify-center w-full h-full">
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      )}
    </div>
  );
}
