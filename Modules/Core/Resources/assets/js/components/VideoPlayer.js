import Hls from "hls.js";
import React from "react";

const VideoPlayer = ({ src, style }) => {
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch((error) => {
                    console.error("Video playback failed:", error);
                });
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error("HLS error:", event, data);
            });
            return () => {
                hls.destroy();
            };
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
            video.play().catch((error) => {
                console.error("Video playback failed:", error);
            });
        } else {
            console.error("HLS is not supported in this browser");
        }
    }, [src]);

    return (
        <video
            ref={videoRef}
            controls
            style={style}
            type="application/x-mpegURL"
        />
    );
};

export default VideoPlayer;