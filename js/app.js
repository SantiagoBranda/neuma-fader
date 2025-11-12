/* ========================================
   Neuma Fader - Application Logic
   ======================================== */

// DOM Elements
const video = document.getElementById("video-player");
const musicAudio = document.getElementById("music-audio");
const sfxAudio = document.getElementById("sfx-audio");
const audioFader = document.getElementById("audio-fader");
const videoContainer = document.getElementById("video-container");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const loadingSpinner = document.getElementById("loading-spinner");

// Loading state
let isVideoReady = false;

// ========================================
// PRELOAD & LOADING
// ========================================

// Set preload for better performance
video.preload = "auto";
musicAudio.preload = "auto";
sfxAudio.preload = "auto";

/**
 * Show loading spinner
 */
function showLoading() {
  if (loadingSpinner) {
    loadingSpinner.classList.remove("hidden");
    console.log("⏳ Loading...");
  }
}

/**
 * Hide loading spinner
 */
function hideLoading() {
  if (loadingSpinner) {
    loadingSpinner.classList.add("hidden");
    isVideoReady = true;
    console.log("✅ Video ready");
  }
}

/**
 * Handle video loading states
 */
video.addEventListener("loadstart", () => {
  console.log("📥 Video loading started...");
  showLoading();
});

video.addEventListener("canplay", () => {
  console.log("✅ Video can play");
  hideLoading();
});

video.addEventListener("canplaythrough", () => {
  console.log("✅ Video can play through");
  hideLoading();
});

video.addEventListener("waiting", () => {
  console.log("⏸️ Video buffering...");
  showLoading();
  // Pause audio while buffering
  musicAudio.pause();
  sfxAudio.pause();
});

video.addEventListener("playing", () => {
  console.log("▶️ Video playing");
  hideLoading();
});

// ========================================
// CUSTOM VIDEO CONTROLS
// ========================================

/**
 * Update play/pause button UI
 */
function updatePlayPauseUI() {
  if (video.paused) {
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
    videoContainer.classList.remove("playing");
  } else {
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
    videoContainer.classList.add("playing");
  }
}

/**
 * Toggle play/pause
 */
function togglePlayPause() {
  // Don't allow play if video is not ready
  if (!isVideoReady && video.paused) {
    console.log("⚠️ Video not ready yet");
    return;
  }
  
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

// Click/Touch on video container
videoContainer.addEventListener("click", togglePlayPause);
videoContainer.addEventListener("touchend", (e) => {
  e.preventDefault();
  togglePlayPause();
});

// Update UI when video state changes
video.addEventListener("play", updatePlayPauseUI);
video.addEventListener("pause", updatePlayPauseUI);

// Initialize UI
updatePlayPauseUI();

// ========================================
// SYNCHRONIZATION LOGIC
// ========================================

/**
 * Full synchronization when seeking
 */
function fullSync() {
  const videoTime = video.currentTime;
  musicAudio.currentTime = videoTime;
  sfxAudio.currentTime = videoTime;
  
  console.log(`🔄 Full sync at ${videoTime.toFixed(2)}s`);
}

/**
 * Play handler - sync all media
 */
video.addEventListener("play", () => {
  console.log("▶️ Play triggered");
  
  // Only play if video is ready
  if (!isVideoReady) {
    console.log("⚠️ Video not ready, pausing...");
    video.pause();
    return;
  }
  
  // Sync before playing
  fullSync();
  
  // Play audios
  musicAudio.play().catch(err => {
    console.warn("⚠️ Music autoplay blocked by browser. User interaction required:", err);
  });
  
  sfxAudio.play().catch(err => {
    console.warn("⚠️ SFX autoplay blocked by browser. User interaction required:", err);
  });
});

/**
 * Pause handler
 */
video.addEventListener("pause", () => {
  console.log("⏸️ Pause triggered");
  musicAudio.pause();
  sfxAudio.pause();
});

/**
 * Seeked handler
 */
video.addEventListener("seeked", () => {
  console.log("⏩ Seeked");
  fullSync();
});

/**
 * Ended handler - reset all
 */
video.addEventListener("ended", () => {
  console.log("⏹️ Video ended");
  musicAudio.pause();
  musicAudio.currentTime = 0;
  sfxAudio.pause();
  sfxAudio.currentTime = 0;
});

/**
 * Time update handler - tolerance-based sync
 */
video.addEventListener("timeupdate", () => {
  const tolerance = 0.15; // Only update if drift > 0.15 seconds
  const videoTime = video.currentTime;
  
  // Check music drift
  const musicDrift = Math.abs(musicAudio.currentTime - videoTime);
  if (musicDrift > tolerance) {
    musicAudio.currentTime = videoTime;
  }
  
  // Check SFX drift
  const sfxDrift = Math.abs(sfxAudio.currentTime - videoTime);
  if (sfxDrift > tolerance) {
    sfxAudio.currentTime = videoTime;
  }
});

// ========================================
// FADER LOGIC
// ========================================

/**
 * Set fader value and update volumes
 * @param {number} value - Fader value between 0 and 1
 */
function setFaderValue(value) {
  audioFader.value = value;
  
  // Fader logic:
  // - When fader <= 0.5: Music = 0.5, SFX scales from 0 to 0.5
  // - When fader > 0.5: SFX = 0.5, Music scales from 0.5 to 0
  if (value <= 0.5) {
    musicAudio.volume = 0.5;
    sfxAudio.volume = (value / 0.5) * 0.5;
  } else {
    sfxAudio.volume = 0.5;
    musicAudio.volume = ((1 - value) / 0.5) * 0.5;
  }
}

/**
 * Fader input handler
 */
audioFader.addEventListener("input", () => {
  const faderValue = parseFloat(audioFader.value);
  setFaderValue(faderValue);
});

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the application
 */
function init() {
  console.log("🎬 Neuma Fader initialized");
  
  // Set initial fader position (0.5 = 50% music, 50% SFX)
  setFaderValue(0.5);
  
  // Start loading media
  console.log("⏳ Loading media...");
}

// Start the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
