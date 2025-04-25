import React, { useEffect, useState } from "react";
import { Skeleton } from "antd";

const ImageWithSkeleton = ({ src, alt, style }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const img = new Image();
        img.src = src;

        if (img.complete && img.naturalWidth !== 0) {
            // Already cached
            if (isMounted) setLoaded(true);
        } else {
            img.onload = () => isMounted && setLoaded(true);
            img.onerror = () => isMounted && setError(true);
        }

        return () => {
            isMounted = false;
        };
    }, [src]);

    if (error) {
        return (
            <img
                src="https://placehold.co/150x100?text=Not+Found"
                alt={alt}
                style={style}
            />
        );
    }

    return (
        <>
            {!loaded && (
                <Skeleton.Image
                    style={{
                        width: style?.maxWidth || 400,
                        height: style?.maxHeight || 250,
                    }}
                    active
                />
            )}
            {loaded && (
                <img
                    src={src}
                    alt={alt}
                    style={style}
                    loading="lazy"
                />
            )}
        </>
    );
};

export default ImageWithSkeleton;
