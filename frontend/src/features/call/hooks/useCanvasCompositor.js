import { useRef } from "react";
const RECORD_FPS = 30;
const PIP_WIDTH_RATIO = 0.25;
const PIP_MARGIN = 16;
export function useCanvasCompositor() {
    const canvasRef = useRef(null);
    const rafIdRef = useRef(null);

    function start(localVideoEl, remoteVideoEl, width = 1280, height = 720) {
        if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        function drawFrame() {
            // Background
            ctx.fillStyle = "#0b0d10";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Remote video — full frame, cover-fit
            if (remoteVideoEl && remoteVideoEl.readyState >= 2) {
                drawCover(ctx, remoteVideoEl, 0, 0, canvas.width, canvas.height);
            }
            // Local video — chhota PiP box, bottom-right
            if (localVideoEl && localVideoEl.readyState >= 2) {
                const pipW = canvas.width * PIP_WIDTH_RATIO;
                const pipH = (pipW * localVideoEl.videoHeight) / localVideoEl.videoWidth || pipW * 0.5625;
                const x = canvas.width - pipW - PIP_MARGIN;
                const y = canvas.height - pipH - PIP_MARGIN;

                ctx.save();
                roundedRect(ctx, x, y, pipW, pipH, 10);
                ctx.clip();
                drawCover(ctx, localVideoEl, x, y, pipW, pipH);
                ctx.restore();
            }

            rafIdRef.current = requestAnimationFrame(drawFrame);
        }

        rafIdRef.current = requestAnimationFrame(drawFrame);

        // captureStream se canvas ka live video track milta hai, har frame update ke saath
        return canvas.captureStream(RECORD_FPS);
    }
    function stop() {
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }

    return { start, stop };
}
// object-fit: cover jaisa draw karta hai — video ko crop karke poore box mein bharta hai
// bina aspect ratio distort kiye.
function drawCover(ctx, videoEl, x, y, w, h) {
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) return;

    const videoRatio = vw / vh;
    const boxRatio = w / h;

    let sx, sy, sw, sh;
    if (videoRatio > boxRatio) {
        sh = vh;
        sw = vh * boxRatio;
        sx = (vw - sw) / 2;
        sy = 0;
    } else {
        sw = vw;
        sh = vw / boxRatio;
        sx = 0;
        sy = (vh - sh) / 2;
    }

    ctx.drawImage(videoEl, sx, sy, sw, sh, x, y, w, h);
}

function roundedRect(ctx, x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}