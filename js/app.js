const video = document.getElementById("video-player");
const videoSource = document.getElementById("video-source");
const musicAudio = document.getElementById("music-audio");
const sfxAudio = document.getElementById("sfx-audio");
const audioFader = document.getElementById("audio-fader");
const audioFaderFullscreen = document.getElementById("audio-fader-fullscreen");
const videoContainer = document.getElementById("video-container");
const playIcon = document.getElementById("play-icon");
const loadingSpinner = document.getElementById("loading-spinner");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const videoTimeline = document.getElementById("video-timeline");
const timelineProgress = document.getElementById("timeline-progress");
const timelineBuffered = document.getElementById("timeline-buffered");
const timelineTooltip = document.getElementById("timeline-tooltip");

let isVideoReady = false;
let hideControlsTimeout = null;
let mouseMoveTimeout = null;
let faderFullscreenTimeout = null;
let faderHint = null;
let faderInteracted = false;
let faderHintTimeout = null;
let videoStarted = false;
let lastSyncTime = 0;

function isMobileDevice() {
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(navigator.userAgent);
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  return (hasTouch && isSmallScreen) || isMobileUA;
}

function loadVideoForDevice() {
  const isMobile = isMobileDevice();
  const videoPath = isMobile ? 'assets/video/teaser.mp4' : 'assets/video/teaser2.mp4';
  videoSource.src = videoPath;
  video.load();
}

loadVideoForDevice();

musicAudio.load();
sfxAudio.load();
musicAudio.volume = 0.5;
sfxAudio.volume = 0.5;

function showLoading() {
  loadingSpinner?.classList.remove("hidden");
}

function hideLoading() {
  if (loadingSpinner) {
    loadingSpinner.classList.add("hidden");
    isVideoReady = true;
  }
}

video.addEventListener("loadstart", showLoading);
video.addEventListener("canplay", hideLoading);
video.addEventListener("canplaythrough", hideLoading);
video.addEventListener("waiting", () => {
  showLoading();
  musicAudio.pause();
  sfxAudio.pause();
});
video.addEventListener("playing", hideLoading);

function updatePlayPauseUI() {
  if (video.paused) {
    playIcon.style.display = "block";
    videoContainer.classList.remove("playing");
  } else {
    playIcon.style.display = "none";
    videoContainer.classList.add("playing");
  }
}

function togglePlayPause() {
  if (!isVideoReady && video.paused) return;
  
  if (video.paused) {
    musicAudio.load();
    sfxAudio.load();
    video.play();
  } else {
    video.pause();
  }
}

videoContainer.addEventListener("click", (e) => {
  if (e.target.closest('#audio-fader') || e.target.closest('.fullscreen-button')) return;
  togglePlayPause();
});

videoContainer.addEventListener("touchend", (e) => {
  if (e.target.closest('#audio-fader') || e.target.closest('.fullscreen-button')) return;
  e.preventDefault();
  togglePlayPause();
});

video.addEventListener("play", updatePlayPauseUI);
video.addEventListener("pause", updatePlayPauseUI);
updatePlayPauseUI();

function scheduleHideControls() {
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout);
  videoContainer.classList.remove('hide-controls');
  hideControlsTimeout = setTimeout(() => {
    if (!video.paused) videoContainer.classList.add('hide-controls');
  }, 1000);
}

function showControls() {
  if (!mouseMoveTimeout) {
    videoContainer.classList.remove('hide-controls');
    scheduleHideControls();
    mouseMoveTimeout = setTimeout(() => mouseMoveTimeout = null, 100);
  }
}

video.addEventListener("play", scheduleHideControls);
video.addEventListener("pause", () => {
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout);
  videoContainer.classList.remove('hide-controls');
});

videoContainer.addEventListener("mousemove", () => {
  if (!video.paused) showControls();
});

videoContainer.addEventListener("touchstart", () => {
  if (!video.paused) {
    videoContainer.classList.remove('hide-controls');
    scheduleHideControls();
  }
}, { passive: true });

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateTimeline() {
  if (!video.duration) return;
  const progress = (video.currentTime / video.duration) * 100;
  timelineProgress.style.width = `${progress}%`;
  
  if (video.buffered.length > 0) {
    const buffered = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
    timelineBuffered.style.width = `${buffered}%`;
  }
}

// ========================================
// SYNCHRONIZATION - Simplified & Optimized
// ========================================

const SYNC_TOLERANCE = 0.2; // Single tolerance value
let isSeeking = false;

function syncAudio() {
  if (isSeeking) return; // Don't sync while seeking
  
  const videoTime = video.currentTime;
  
  // Only sync if ready and drift is significant
  if (musicAudio.readyState >= 2) {
    const drift = Math.abs(musicAudio.currentTime - videoTime);
    if (drift > SYNC_TOLERANCE) {
      musicAudio.currentTime = videoTime;
    }
  }
  
  if (sfxAudio.readyState >= 2) {
    const drift = Math.abs(sfxAudio.currentTime - videoTime);
    if (drift > SYNC_TOLERANCE) {
      sfxAudio.currentTime = videoTime;
    }
  }
}

// Seeking: Let browser handle it, don't manually sync
function seekFromTimeline(event, timelineElement) {
  const rect = timelineElement.getBoundingClientRect();
  const pos = (event.clientX - rect.left) / rect.width;
  const newTime = pos * video.duration;
  
  if (!isNaN(newTime) && newTime >= 0 && newTime <= video.duration) {
    isSeeking = true;
    video.currentTime = newTime; // Only set video time, let 'seeked' event handle the rest
  }
}

function updateTooltip(event) {
  const rect = videoTimeline.getBoundingClientRect();
  const pos = (event.clientX - rect.left) / rect.width;
  const time = pos * video.duration;
  const tooltipX = event.clientX - rect.left;
  timelineTooltip.style.left = `${tooltipX}px`;
  timelineTooltip.textContent = formatTime(time);
}

videoTimeline.addEventListener('click', (e) => {
  e.stopPropagation();
  seekFromTimeline(e, videoTimeline);
});

videoTimeline.addEventListener('mousedown', (e) => e.stopPropagation());
videoTimeline.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
videoTimeline.addEventListener('touchend', (e) => {
  e.stopPropagation();
  e.preventDefault();
  seekFromTimeline(e.changedTouches[0], videoTimeline);
});

videoTimeline.addEventListener('mousemove', updateTooltip);
video.addEventListener('timeupdate', updateTimeline);
video.addEventListener('progress', updateTimeline);
video.addEventListener('loadedmetadata', updateTimeline);

video.addEventListener("play", () => {
  if (!isVideoReady) {
    video.pause();
    return;
  }
  
  if (musicAudio.readyState < 3) musicAudio.load();
  if (sfxAudio.readyState < 3) sfxAudio.load();
  
  syncAudio(); // Initial sync
  
  const playAudio = (audio) => {
    let retryCount = 0;
    const attemptPlay = () => {
      audio.play().catch(err => {
        retryCount++;
        if (retryCount < 3 && !video.paused) { // Reduced retries
          setTimeout(() => { if (!video.paused) attemptPlay(); }, 150);
        }
      });
    };
    attemptPlay();
  };
  
  playAudio(musicAudio);
  playAudio(sfxAudio);
});

video.addEventListener("pause", () => {
  musicAudio.pause();
  sfxAudio.pause();
});

video.addEventListener("seeked", () => {
  isSeeking = false; // Re-enable auto-sync
  
  // Immediate sync
  const videoTime = video.currentTime;
  musicAudio.currentTime = videoTime;
  sfxAudio.currentTime = videoTime;
  
  // Resume audio if video is playing (with shorter delay)
  if (!video.paused) {
    setTimeout(() => {
      if (musicAudio.paused) musicAudio.play().catch(() => {});
      if (sfxAudio.paused) sfxAudio.play().catch(() => {});
    }, 10); // Very short delay, just enough for sync to complete
  }
});

video.addEventListener("ended", () => {
  musicAudio.pause();
  musicAudio.currentTime = 0;
  sfxAudio.pause();
  sfxAudio.currentTime = 0;
});

// Throttled continuous sync during playback
video.addEventListener("timeupdate", () => {
  const now = Date.now();
  if (now - lastSyncTime < 200) return; // Check every 200ms (was 300ms)
  lastSyncTime = now;
  
  syncAudio(); // Use unified sync function
});

function setFaderValue(value) {
  audioFader.value = value;
  audioFaderFullscreen.value = value;
  
  if (value <= 0.5) {
    musicAudio.volume = 0.5;
    sfxAudio.volume = (value / 0.5) * 0.5;
  } else {
    sfxAudio.volume = 0.5;
    musicAudio.volume = ((1 - value) / 0.5) * 0.5;
  }
}

audioFader.addEventListener("input", () => setFaderValue(parseFloat(audioFader.value)));

audioFaderFullscreen.addEventListener("input", () => {
  if (!faderFullscreenTimeout) {
    setFaderValue(parseFloat(audioFaderFullscreen.value));
    faderFullscreenTimeout = setTimeout(() => faderFullscreenTimeout = null, 16);
  }
});

audioFaderFullscreen.addEventListener('mousedown', (e) => e.stopPropagation(), { passive: true });
audioFaderFullscreen.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
audioFaderFullscreen.addEventListener('touchend', (e) => e.stopPropagation(), { passive: true });
audioFaderFullscreen.addEventListener('click', (e) => e.stopPropagation());

function createFaderHint() {
  const container = document.querySelector('.fader-controls');
  if (!container || !audioFader) return null;
  if (container.querySelector('.fader-hint')) {
    faderHint = container.querySelector('.fader-hint');
    return faderHint;
  }

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

audioFader.addEventListener('mousedown', onFaderInteraction);
audioFader.addEventListener('touchstart', onFaderInteraction);
audioFader.addEventListener('touchend', (e) => e.stopPropagation(), { passive: true });
audioFader.addEventListener('input', () => {
  onFaderInteraction();
  if (faderHint && faderHint.classList.contains('visible')) updateFaderHintPosition();
});

window.addEventListener('resize', () => {
  if (faderHint && faderHint.classList.contains('visible')) updateFaderHintPosition();
});

video.addEventListener('play', () => {
  if (!videoStarted && !faderInteracted) {
    videoStarted = true;
    scheduleFaderHint(6000);
  }
});

// ========================================
// FULLSCREEN - iOS/Safari Compatible
// ========================================

async function toggleFullscreen() {
  // Check if already in fullscreen (cross-browser)
  const isFullscreen = document.fullscreenElement || 
                       document.webkitFullscreenElement || 
                       document.mozFullScreenElement;
  
  if (!isFullscreen) {
    try {
      // Try standard API first
      if (videoContainer.requestFullscreen) {
        await videoContainer.requestFullscreen();
      } 
      // Safari iOS/macOS
      else if (videoContainer.webkitRequestFullscreen) {
        await videoContainer.webkitRequestFullscreen();
      }
      // Firefox
      else if (videoContainer.mozRequestFullScreen) {
        await videoContainer.mozRequestFullScreen();
      }
      // Safari on iPhone - use video element
      else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen error:", err);
    }
  } else {
    // Exit fullscreen (cross-browser)
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (video.webkitExitFullscreen) {
      video.webkitExitFullscreen();
    }
  }
}

fullscreenBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  e.preventDefault();
  toggleFullscreen();
});

fullscreenBtn.addEventListener('touchend', (e) => {
  e.stopPropagation();
  e.preventDefault();
  toggleFullscreen();
});

// Listen to fullscreen changes (cross-browser)
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'].forEach(event => {
  document.addEventListener(event, () => {
    const isFullscreen = document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement;
    
    if (isFullscreen) {
      fullscreenBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>
      `;
    } else {
      fullscreenBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>
      `;
    }
  });
});

function init() {
  setFaderValue(0.5);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
