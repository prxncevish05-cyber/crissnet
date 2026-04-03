import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useToastNotify } from "@/hooks/useToastNotify";

const SOSVideoRecorder = () => {
  const notify = useToastNotify();
  const setSosVideoUrl = useAppStore((s) => s.setSosVideoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startRecording = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 640, height: 480 },
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          setSosVideoUrl(url);
          setDone(true);
          notify("📹 Video recorded", "10s clip sent to ambulance crew", "ok");
          // Stop all tracks
          stream?.getTracks().forEach((t) => t.stop());
        };

        recorder.start();
        setRecording(true);

        // Countdown
        let sec = 10;
        const timer = setInterval(() => {
          sec--;
          setCountdown(sec);
          if (sec <= 0) {
            clearInterval(timer);
            recorder.stop();
            setRecording(false);
          }
        }, 1000);
      } catch (err) {
        setError("Camera access denied");
        notify("Camera not available", "Video evidence skipped", "warn");
      }
    };

    startRecording();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (error) {
    return (
      <div className="mx-4 mt-3 p-3 rounded-[13px] border-[1.5px] border-border bg-card text-center">
        <div className="text-2xl">📷</div>
        <div className="text-sm text-muted-foreground mt-1">Camera unavailable — video skipped</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-4 mt-3 p-3 rounded-[13px] border-[1.5px]" style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}>
        <div className="flex items-center gap-2">
          <div className="text-xl">✅</div>
          <div>
            <div className="font-bold text-sm text-cn-green">Video Evidence Captured</div>
            <div className="text-xs text-muted-foreground">10s clip sent to ambulance crew for verification</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3 rounded-[13px] overflow-hidden border-[2px] border-cn-red relative">
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full h-[200px] object-cover bg-black"
      />
      {recording && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cn-red animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wider">REC</span>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-cn-red text-white text-xs font-bold">
            {countdown}s
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
        <div
          className="h-full bg-cn-red transition-all duration-1000"
          style={{ width: `${((10 - countdown) / 10) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default SOSVideoRecorder;
