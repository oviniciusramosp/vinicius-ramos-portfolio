/**
 * Device3D progressive enhancement + scroll-driven rotation.
 *
 * DOM: [data-device-3d] with poster + canvas[data-device-3d-canvas]
 * - Poster always present (fallback)
 * - WebGL enhances when in view; fails silent to poster
 * - Rotation driven by page scroll (element progress through viewport)
 * - No pointer tracking
 */

import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  VideoTexture,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { whenPageVisible } from './page-reveal';

/** Screen glass mesh in Sketchfab iPhone 15 Pro Max (adrianhajdin/iphone) */
const SCREEN_MESH = 'xXDHkMplTIDAXLN';
const HOST_SEL = '[data-device-3d]';
const VIDEO_EXT = /\.(mp4|webm|mov)(\?|$)/i;

/**
 * Base model orientation (radians).
 * Identity shows the back of this GLB; y=π faces the screen to the camera.
 * Do not set z=π — that tips the phone into a top-down view.
 */
const BASE_ROT = { x: 0, y: Math.PI, z: 0 };

type Host = HTMLElement & {
  __device3dBound?: boolean;
  __device3dDispose?: () => void;
  __device3dReplayIntro?: () => void;
  __device3dIo?: IntersectionObserver;
};

type Pose = { rx: number; ry: number; rz: number; scale: number };

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
}

/**
 * Progress of the host through the viewport: 0 when entering from bottom, 1 when leaving top.
 */
function viewportProgress(host: HTMLElement): number {
  const rect = host.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const travel = vh + rect.height;
  if (travel <= 0) return 0;
  return clamp((vh - rect.top) / travel);
}

/** Scroll 0→1 maps to a product-style yaw (side → face → side). Keep X/Z mild so it stays upright. */
function poseFromScroll(progress: number): Pose {
  const p = smoothstep(progress);
  return {
    rx: lerp(4, 8, p),
    ry: lerp(-38, 32, p),
    rz: 0,
    scale: 1,
  };
}

/**
 * Intro offset: same direction as scroll-down yaw (ry increases −38 → +32).
 * Start slightly "behind" the scroll pose so the phone eases into place on load.
 */
const INTRO_RY_DELTA = -16;
const INTRO_RX_DELTA = -1.5;
/** Frames of slower ease after ready, then settle into normal scroll tracking */
const INTRO_EASE_FRAMES = 48;

const REDUCED_POSE: Pose = { rx: 8, ry: -14, rz: 0, scale: 1 };

/**
 * First-frame pose of the 3D model (intro start, or reduced static).
 * Poster fallback is a one-shot snapshot of this so the flat bezel matches WebGL.
 */
function initialPose(host: HTMLElement): Pose {
  if (prefersReducedMotion()) return { ...REDUCED_POSE };
  const target = poseFromScroll(viewportProgress(host));
  return {
    rx: target.rx + INTRO_RX_DELTA,
    ry: target.ry + INTRO_RY_DELTA,
    rz: target.rz,
    scale: target.scale,
  };
}

/** Write CSS vars consumed by Device3D poster bezel (snapshot, not scroll-linked). */
function snapshotPosterPose(host: HTMLElement, pose?: Pose) {
  if (host.dataset.poseSnapshotted === '1' && !pose) return;
  const p = pose ?? initialPose(host);
  host.style.setProperty('--device-rx', `${roundPose(p.rx)}deg`);
  host.style.setProperty('--device-ry', `${roundPose(p.ry)}deg`);
  host.style.setProperty('--device-rz', `${roundPose(p.rz)}deg`);
  host.dataset.poseSnapshotted = '1';
}

function roundPose(n: number) {
  return Math.round(n * 100) / 100;
}

function isVideoUrl(url: string) {
  return VIDEO_EXT.test(url);
}

/** Correct UV for this GLB screen mesh (face-front after y=π): 180° + un-mirror on X. */
function prepareScreenTexture(texture: Texture) {
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI;
  // Flip across vertical axis (fixes left/right mirror on this mesh)
  texture.repeat.set(-1, 1);
  texture.needsUpdate = true;
  return texture;
}

function loadScreenTexture(url: string): Promise<{ texture: Texture; dispose: () => void }> {
  if (isVideoUrl(url)) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = 'auto';

      const onReady = () => {
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('error', onError);
        void video.play().catch(() => undefined);
        const texture = prepareScreenTexture(new VideoTexture(video));
        resolve({
          texture,
          dispose: () => {
            texture.dispose();
            video.pause();
            video.removeAttribute('src');
            video.load();
          },
        });
      };
      const onError = () => {
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('error', onError);
        reject(new Error(`Video failed: ${url}`));
      };
      video.addEventListener('loadeddata', onReady);
      video.addEventListener('error', onError);
    });
  }

  return new Promise((resolve, reject) => {
    new TextureLoader().load(
      url,
      (texture) => {
        prepareScreenTexture(texture);
        resolve({ texture, dispose: () => texture.dispose() });
      },
      undefined,
      () => reject(new Error(`Image failed: ${url}`)),
    );
  });
}

function applyScreenMedia(model: Group, texture: Texture) {
  let applied = false;
  model.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    if (obj.name !== SCREEN_MESH && !obj.name.startsWith(SCREEN_MESH)) return;
    obj.material = new MeshStandardMaterial({
      map: texture,
      emissiveMap: texture,
      emissive: new Color(0xffffff),
      emissiveIntensity: 0.35,
      roughness: 0.85,
      metalness: 0,
    });
    applied = true;
  });
  return applied;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Base orientation: y=π so screen faces camera (+Z). */
function applyBaseOrientation(pivot: Group) {
  pivot.rotation.order = 'YXZ';
  pivot.rotation.set(BASE_ROT.x, BASE_ROT.y, BASE_ROT.z);
}

async function enhance(host: Host) {
  if (host.__device3dBound) return;
  host.__device3dBound = true;

  const canvas = host.querySelector<HTMLCanvasElement>('[data-device-3d-canvas]');
  const poster = host.querySelector<HTMLElement>('.device-3d__poster');
  const modelUrl = host.dataset.model || '/devices/three/iphone-ready.glb';
  const screenUrl = host.dataset.screen || '';
  const timeoutMs = Number(host.dataset.loadTimeout || 8000);

  const fail = (reason?: unknown) => {
    if (reason) console.warn('[device-3d] fallback to poster', reason);
    // Keep / refresh poster at the intended initial pose
    snapshotPosterPose(host, initialPose(host));
    host.classList.add('is-fallback');
    host.classList.remove('is-loading', 'is-ready', 'is-awaiting-3d');
    if (canvas) canvas.hidden = true;
  };

  if (!canvas) {
    fail('missing canvas');
    return;
  }
  if (!supportsWebGL()) {
    fail('no WebGL');
    return;
  }

  host.classList.add('is-loading');
  host.classList.remove('is-awaiting-3d');

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    fail(err);
    host.__device3dBound = false;
    return;
  }

  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  // Same framing idea as adrianhajdin ModelView (camera on +Z, look at origin)
  const camera = new PerspectiveCamera(35, 1, 0.01, 100);
  camera.position.set(0, 0, 4);
  camera.lookAt(0, 0, 0);

  scene.add(new AmbientLight(0xffffff, 0.85));
  const key = new DirectionalLight(0xffffff, 1.35);
  key.position.set(2.2, 3.5, 4);
  scene.add(key);
  const fill = new DirectionalLight(0xffc8a0, 0.5);
  fill.position.set(-2.8, 1.2, 1.5);
  scene.add(fill);
  const rim = new DirectionalLight(0xa0c4ff, 0.28);
  rim.position.set(0, 1, -3);
  scene.add(rim);

  const root = new Group();
  scene.add(root);
  const pivot = new Group();
  applyBaseOrientation(pivot);
  root.add(pivot);

  const reduced = prefersReducedMotion();
  let target = poseFromScroll(viewportProgress(host));
  let current = { ...target };
  let mediaDispose: (() => void) | undefined;
  let raf = 0;
  let disposed = false;
  /** >0 while playing load intro (slower ease toward scroll pose) */
  let introFramesLeft = 0;
  /** Hold pose at intro offset until page-mask reveals (avoids animating under cover) */
  let entranceArmed = false;
  let cancelPageWait: (() => void) | null = null;

  const resize = () => {
    const w = Math.max(1, host.clientWidth || 320);
    const h = Math.max(1, host.clientHeight || 320);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  resize();

  const applyScrollPose = () => {
    // Don't track scroll until entrance has started — keeps intro offset stable
    if (!entranceArmed && !reduced) return;
    if (reduced) {
      target = { ...REDUCED_POSE };
      return;
    }
    target = poseFromScroll(viewportProgress(host));
  };

  const tick = () => {
    if (disposed) return;
    // Slightly softer lerp during intro so the entrance rotation reads as ease, not snap
    const t = introFramesLeft > 0 ? 0.055 : 0.1;
    if (introFramesLeft > 0) introFramesLeft -= 1;

    current.rx = MathUtils.lerp(current.rx, target.rx, t);
    current.ry = MathUtils.lerp(current.ry, target.ry, t);
    current.rz = MathUtils.lerp(current.rz, target.rz, t);
    current.scale = MathUtils.lerp(current.scale, target.scale, t);

    root.rotation.x = MathUtils.degToRad(current.rx);
    root.rotation.y = MathUtils.degToRad(current.ry);
    root.rotation.z = MathUtils.degToRad(current.rz);
    root.scale.setScalar(current.scale);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  let scrollTicking = false;
  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      scrollTicking = false;
      applyScrollPose();
    });
  };

  /** Called every page open: fade canvas in + ease from intro offset. */
  const playEntrance = () => {
    if (disposed) return;
    entranceArmed = true;
    canvas.hidden = false;
    host.classList.remove('is-loading', 'is-awaiting-3d');
    host.classList.add('is-ready');
    if (poster) poster.setAttribute('aria-hidden', 'true');

    // Real scroll target, then start from intro offset so the ease is visible
    if (reduced) {
      target = { ...REDUCED_POSE };
      current = { ...target };
      introFramesLeft = 0;
    } else {
      target = poseFromScroll(viewportProgress(host));
      current = {
        rx: target.rx + INTRO_RX_DELTA,
        ry: target.ry + INTRO_RY_DELTA,
        rz: target.rz,
        scale: target.scale,
      };
      introFramesLeft = INTRO_EASE_FRAMES;
    }
    snapshotPosterPose(host, current);
  };

  host.__device3dReplayIntro = playEntrance;

  const ro = new ResizeObserver(() => resize());
  ro.observe(host);

  try {
    const loader = new GLTFLoader();
    const gltf = await withTimeout(loader.loadAsync(modelUrl), timeoutMs, 'Model');
    if (disposed) return;
    const model = gltf.scene;
    pivot.add(model);

    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    model.position.sub(box.getCenter(new Vector3()));
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // Large scale so only the upper half of the phone fills the bento cell
    model.scale.setScalar(3.9 / maxDim);
    const box2 = new Box3().setFromObject(model);
    model.position.sub(box2.getCenter(new Vector3()));
    // Shift down: keep Dynamic Island / top of screen in frame, crop the bottom
    const size2 = box2.getSize(new Vector3());
    model.position.y -= size2.y * 0.28;

    if (screenUrl) {
      try {
        const media = await withTimeout(loadScreenTexture(screenUrl), timeoutMs, 'Screen');
        mediaDispose = media.dispose;
        if (!applyScreenMedia(model, media.texture)) {
          console.warn(`[device-3d] screen mesh "${SCREEN_MESH}" missing`);
        }
      } catch (mediaErr) {
        console.warn('[device-3d] screen media failed, model without UI', mediaErr);
      }
    }

    if (disposed) return;

    // Hold at intro pose while mask may still cover; canvas stays opacity 0 until playEntrance
    canvas.hidden = false;
    host.classList.remove('is-awaiting-3d');
    // Keep is-loading until entrance so CSS does not flash canvas early
    const holdTarget = reduced
      ? { ...REDUCED_POSE }
      : poseFromScroll(viewportProgress(host));
    if (reduced) {
      current = { ...holdTarget };
    } else {
      current = {
        rx: holdTarget.rx + INTRO_RX_DELTA,
        ry: holdTarget.ry + INTRO_RY_DELTA,
        rz: holdTarget.rz,
        scale: holdTarget.scale,
      };
    }
    // Freeze: target === current until reveal
    target = { ...current };
    introFramesLeft = 0;
    snapshotPosterPose(host, current);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    tick();

    // Defer entrance until page-mask opens (or next frame on full reload)
    cancelPageWait = whenPageVisible(playEntrance);

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      cancelPageWait?.();
      cancelPageWait = null;
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mediaDispose?.();
      renderer.dispose();
      host.__device3dBound = false;
      host.__device3dDispose = undefined;
      host.__device3dReplayIntro = undefined;
      delete host.dataset.device3dWatching;
      host.classList.remove('is-ready', 'is-loading', 'is-awaiting-3d');
    };

    host.__device3dDispose = dispose;

    const mo = new MutationObserver(() => {
      if (document.contains(host)) return;
      dispose();
      mo.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    renderer.dispose();
    ro.disconnect();
    cancelPageWait?.();
    host.__device3dBound = false;
    host.__device3dDispose = undefined;
    host.__device3dReplayIntro = undefined;
    delete host.dataset.device3dWatching;
    fail(err);
  }
}

function observe(host: Host) {
  if (host.__device3dBound) return;
  if (host.dataset.device3dWatching === '1') return;

  // Flat poster pose ready for permanent fallback only (hidden during WebGL path)
  snapshotPosterPose(host);

  if (prefersReducedMotion() && host.dataset.staticOnReduce !== undefined) {
    host.classList.remove('is-awaiting-3d', 'is-loading');
    host.classList.add('is-fallback');
    return;
  }

  if (!supportsWebGL()) {
    host.classList.remove('is-awaiting-3d', 'is-loading');
    host.classList.add('is-fallback');
    return;
  }

  /*
   * Hide the Cosmic Orange bezel immediately — do not show it under the GLB.
   * Poster only reappears via `.is-fallback` if enhance() fails.
   */
  host.dataset.device3dWatching = '1';
  host.classList.add('is-awaiting-3d');
  host.classList.remove('is-fallback');

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.disconnect();
        host.__device3dIo = undefined;
        void enhance(host);
      }
    },
    { rootMargin: '120px 0px', threshold: 0.05 },
  );
  host.__device3dIo = io;
  io.observe(host);
}

export function bootDevice3D() {
  document.querySelectorAll<Host>(HOST_SEL).forEach((host) => {
    if (!document.contains(host)) return;

    // Same DOM node already enhanced (rare) — replay entrance for this visit
    if (host.__device3dBound && host.__device3dReplayIntro) {
      host.__device3dReplayIntro();
      return;
    }

    observe(host);
  });
}

export const bootDeviceThree = bootDevice3D;
