import { useEffect, useRef, useState } from 'react';

// Sensitivity settings
const MOTION_THRESHOLD = 20; // Pixel difference threshold
const DOWNSAMPLE_W = 64; // Processing resolution width
const DOWNSAMPLE_H = 48; // Processing resolution height
const MIRROR = true; // Mirror the camera for natural feel

export const useMotionTracker = (isActive: boolean) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playerX, setPlayerX] = useState<number>(50); // 0 to 100%
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;
    let previousImageData: Uint8ClampedArray | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setPermissionGranted(true);
            processFrame();
          };
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setPermissionGranted(false);
      }
    };

    const processFrame = () => {
      if (!isActive) return;
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) return;

      // Draw downscaled frame
      ctx.drawImage(video, 0, 0, DOWNSAMPLE_W, DOWNSAMPLE_H);
      
      const frame = ctx.getImageData(0, 0, DOWNSAMPLE_W, DOWNSAMPLE_H);
      const data = frame.data;
      const length = data.length;

      let movementSumX = 0;
      let movementPixelCount = 0;

      if (previousImageData) {
        // Iterate through pixels (step by 4 for RGBA)
        for (let i = 0; i < length; i += 4) {
          // Simple grayscale difference: (R+G+B)/3
          const rDiff = Math.abs(data[i] - previousImageData[i]);
          const gDiff = Math.abs(data[i + 1] - previousImageData[i + 1]);
          const bDiff = Math.abs(data[i + 2] - previousImageData[i + 2]);
          
          const avgDiff = (rDiff + gDiff + bDiff) / 3;

          if (avgDiff > MOTION_THRESHOLD) {
            // Calculate x coordinate (pixel index / 4) % width
            let x = (i / 4) % DOWNSAMPLE_W;
            
            // If mirrored, flip X
            if (MIRROR) {
              x = DOWNSAMPLE_W - x;
            }

            movementSumX += x;
            movementPixelCount++;
          }
        }
      }

      // Update previous frame
      previousImageData = new Uint8ClampedArray(data);

      // Calculate center of motion
      if (movementPixelCount > 5) { // Minimum noise filter
        const avgX = movementSumX / movementPixelCount;
        const normalizedX = (avgX / DOWNSAMPLE_W) * 100;
        
        // Smooth transition (Lerp)
        setPlayerX(prev => prev + (normalizedX - prev) * 0.15);
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (isActive) {
      startCamera();
    } else {
      // Cleanup if game stops
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  return { videoRef, canvasRef, playerX, permissionGranted };
};
