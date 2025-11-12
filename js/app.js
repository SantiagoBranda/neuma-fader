/* ========================================
   Neuma Fader - Application Logic
   ======================================== */

// DOM Elements
const video = document.getElementById("video-player");
const videoSource = document.getElementById("video-source");
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
// DEVICE DETECTION & VIDEO SELECTION
// ========================================

/**
 * Detect if device is mobile (improved detection)
 */
function isMobileDevice() {
  // Check user agent
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(navigator.userAgent);
  
  // Check touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen width (only if touch is available)
  const isSmallScreen = window.innerWidth <= 768;
  
  // Mobile if: (has touch AND small screen) OR mobile user agent
  return (hasTouch && isSmallScreen) || isMobileUA;
}

/**
 * Load appropriate video based on device
 */
function loadVideoForDevice() {
  const isMobile = isMobileDevice();
  const videoPath = isMobile 
    ? 'assets/video/teaser.mp4'     // 18 MB para mobile
    : 'assets/video/teaser2.mp4';   // 44 MB para desktop
  
  videoSource.src = videoPath;
  video.load(); // Reload video with new source
  
  console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
  console.log(`🎬 Loading video: ${videoPath}`);
}

// Load video on init
loadVideoForDevice();

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
// FADER HINT (burbuja que indica el control)
// ========================================

let faderHint = null;
let faderInteracted = false;
let faderHintTimeout = null;
let videoStarted = false; // Track if video has started playing

function createFaderHint() {
  const container = document.querySelector('.fader-controls');
  if (!container || !audioFader) return null;

  // Prevent duplicate
  if (container.querySelector('.fader-hint')) {
    faderHint = container.querySelector('.fader-hint');
    return faderHint;
  }

  // Create hint structure with better text
  const hint = document.createElement('div');
  hint.className = 'fader-hint pulsing';
  
  hint.innerHTML = `
    <div class="fader-hint-bubble">
      <span class="fader-hint-label">MUSIC</span>
      <svg class="fader-hint-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h18m-7.5-12L21 9m0 0L16.5 4.5M21 9H3" />
      </svg>
      <span class="fader-hint-separator">Slide to mix</span>
      <svg class="fader-hint-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h18m-7.5-12L21 9m0 0L16.5 4.5M21 9H3" />
      </svg>
      <span class="fader-hint-label">SFX</span>
      <div class="fader-hint-arrow"></div>
    </div>
  `;
  
  container.appendChild(hint);
  faderHint = hint;
  return hint;
}

function updateFaderHintPosition() {
  if (!faderHint || !audioFader) return;
  const rect = audioFader.getBoundingClientRect();
  const containerRect = audioFader.parentElement.getBoundingClientRect();
  const min = parseFloat(audioFader.min) || 0;
  const max = parseFloat(audioFader.max) || 1;
  const val = parseFloat(audioFader.value);
  const pct = (val - min) / (max - min);

  // Calculate left inside container (center of thumb)
  const left = rect.left - containerRect.left + pct * rect.width;
  faderHint.style.left = `${left}px`;
}

function showFaderHint() {
  if (!faderHint) createFaderHint();
  if (!faderHint || faderInteracted) return;
  updateFaderHintPosition();
  requestAnimationFrame(() => faderHint.classList.add('visible'));
}

function hideFaderHint() {
  if (!faderHint) return;
  faderHint.classList.remove('visible');
  faderHint.classList.remove('pulsing');
}

function scheduleFaderHint(delay = 6000) {
  if (faderInteracted) return;
  // create early so it exists for positioning
  createFaderHint();
  clearTimeout(faderHintTimeout);
  faderHintTimeout = setTimeout(() => {
    if (!faderInteracted) showFaderHint();
  }, delay);
}

function onFaderInteraction() {
  faderInteracted = true;
  clearTimeout(faderHintTimeout);
  hideFaderHint();
}

// Hide hint on user actions
audioFader.addEventListener('mousedown', onFaderInteraction);
audioFader.addEventListener('touchstart', onFaderInteraction);
audioFader.addEventListener('input', () => {
  onFaderInteraction();
  if (faderHint && faderHint.classList.contains('visible')) updateFaderHintPosition();
});

// Keep position updated on resize
window.addEventListener('resize', () => {
  if (faderHint && faderHint.classList.contains('visible')) updateFaderHintPosition();
});

// Schedule hint 6 seconds AFTER video starts playing (not on page load)
video.addEventListener('play', () => {
  if (!videoStarted && !faderInteracted) {
    videoStarted = true;
    scheduleFaderHint(6000); // 6 seconds after first play
  }
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
