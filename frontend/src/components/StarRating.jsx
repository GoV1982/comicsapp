import { Star } from 'lucide-react';

export default function StarRating({
    rating = 0,
    interactive = false,
    onChange,
    size = 'md',
    showCount = false,
    count = 0
}) {
    const stars = [1, 2, 3, 4, 5];

    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    const iconSize = sizeClasses[size] || sizeClasses.md;

    return (
        <div className="flex items-center gap-1">
            <div className="flex">
                {stars.map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onChange && onChange(star)}
                        className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
                    >
                        <Star
                            className={`${iconSize} ${star <= rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                        />
                    </button>
                ))}
            </div>
            {showCount && (
                <span className="text-xs text-gray-500 ml-1">
                    ({count})
                </span>
            )}
        </div>
    );
}
