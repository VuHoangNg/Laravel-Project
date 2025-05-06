import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Hls from "hls.js";

const VideoPlayer = forwardRef(({ src, style, onPause, autoPlay = false, playsInline = true }, ref) => {
    const videoRef = useRef(null);

    // Expose seekTo method to parent
    useImperativeHandle(ref, () => ({
        seekTo: (time) => {
            if (videoRef.current) {
                videoRef.current.currentTime = time;
                videoRef.current.play().catch((error) => {
                    console.error("Seek playback failed:", error);
                });
            }
        },
    }));

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Handle pause event
        const handlePause = () => {
            if (onPause) {
                onPause(video.currentTime);
            }
        };

        video.addEventListener("pause", handlePause);

        // HLS setup
        let hls;
        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) {
                    video.play().catch((error) => {
                        console.error("Video playback failed:", error);
                    });
                }
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error("HLS error:", event, data);
            });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
            if (autoPlay) {
                video.play().catch((error) => {
                    console.error("Video playback failed:", error);
                });
            }
        } else {
            console.error("HLS is not supported in this browser");
        }

        return () => {
            video.removeEventListener("pause", handlePause);
            if (hls) {
                hls.destroy();
            }
        };
    }, [src, autoPlay, onPause]);

    return (
        <video
            ref={videoRef}
            controls
            style={style}
            type="application/x-mpegURL"
            autoPlay={autoPlay}
            playsInline={playsInline}
        />
    );
});

export default VideoPlayer;