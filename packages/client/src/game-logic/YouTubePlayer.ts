/**
 * Wrapper around the YouTube IFrame API.
 * Loads the API script once, then creates a hidden player.
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: Array<() => void> = [];

function loadYouTubeAPI(): Promise<void> {
  if (apiReady) return Promise.resolve();
  if (apiLoaded) {
    return new Promise((resolve) => readyCallbacks.push(resolve));
  }

  apiLoaded = true;
  return new Promise((resolve) => {
    readyCallbacks.push(resolve);

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      readyCallbacks.forEach((cb) => cb());
      readyCallbacks.length = 0;
    };
  });
}

export class YouTubePlayer {
  private player: any = null;
  private containerId: string;
  private ready = false;
  private pendingVideoId: string | null = null;
  private onTitleLoaded?: (title: string) => void;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  async init(): Promise<void> {
    await loadYouTubeAPI();

    // Create a hidden container if it doesn't exist
    let el = document.getElementById(this.containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = this.containerId;
      el.style.position = "absolute";
      el.style.top = "-9999px";
      el.style.left = "-9999px";
      el.style.width = "1px";
      el.style.height = "1px";
      el.style.overflow = "hidden";
      document.body.appendChild(el);
    }

    return new Promise((resolve) => {
      this.player = new window.YT.Player(this.containerId, {
        height: "1",
        width: "1",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            this.ready = true;
            if (this.pendingVideoId) {
              this.loadVideo(this.pendingVideoId);
              this.pendingVideoId = null;
            }
            resolve();
          },
          onStateChange: (event: any) => {
            // When video starts playing, grab the title
            if (event.data === window.YT.PlayerState.PLAYING) {
              const data = this.player?.getVideoData?.();
              if (data?.title && this.onTitleLoaded) {
                this.onTitleLoaded(data.title);
              }
            }
            // Auto-advance when track ends
            if (event.data === window.YT.PlayerState.ENDED) {
              this.onTrackEnded?.();
            }
          },
        },
      });
    });
  }

  private onTrackEnded?: () => void;
  setOnTrackEnded(cb: () => void) { this.onTrackEnded = cb; }

  setOnTitleLoaded(cb: (title: string) => void) { this.onTitleLoaded = cb; }

  loadVideo(youtubeId: string) {
    if (!this.ready) {
      this.pendingVideoId = youtubeId;
      return;
    }
    this.player?.loadVideoById(youtubeId);
  }

  play() {
    this.player?.playVideo();
  }

  pause() {
    this.player?.pauseVideo();
  }

  setVolume(volume: number) {
    this.player?.setVolume(volume);
  }

  getTitle(): string {
    return this.player?.getVideoData?.()?.title || "";
  }

  destroy() {
    this.player?.destroy();
    this.player = null;
  }
}
