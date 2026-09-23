import { nyanPlayer } from "./nyanCatAudio";

type Listener = (active: boolean) => void;

class GamerEasterEggManager {
  private count = 0;
  private lastTime = 0;
  private active = false;
  private listeners: Set<Listener> = new Set();
  private readonly TARGET_CLICKS = 30;
  private readonly MAX_INTERVAL_MS = 2500; // Máximo tiempo permitido entre clics

  public subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.active);
    return () => this.listeners.delete(fn);
  }

  public getIsActive(): boolean {
    return this.active;
  }

  public getCount(): number {
    return this.count;
  }

  /**
   * Se invoca cada vez que el usuario hace clic en el interruptor de modo claro/oscuro.
   * Si el modo gamer está activo, al cambiar de modo se apaga inmediatamente y se reinicia.
   * Si no está activo, cuenta clics consecutivos hasta 30 para activarlo.
   */
  public registerThemeToggle(): boolean {
    // Si ya estaba activo el modo ARGB GAMER, al cambiar de tema se apaga inmediatamente
    if (this.active) {
      this.deactivate();
      return false;
    }

    const now = Date.now();
    if (now - this.lastTime > this.MAX_INTERVAL_MS) {
      this.count = 1;
    } else {
      this.count += 1;
    }
    this.lastTime = now;

    if (this.count >= this.TARGET_CLICKS) {
      this.activate();
      this.count = 0;
      return true;
    }

    return false;
  }

  public activate() {
    if (this.active) return;
    this.active = true;
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("argb-gamer-mode");
    }
    nyanPlayer.start();
    this.notify();
  }

  public deactivate() {
    if (!this.active) return;
    this.active = false;
    this.count = 0;
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("argb-gamer-mode");
    }
    nyanPlayer.stop();
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.active);
      } catch (err) {
        console.error("Error en listener de Easter Egg:", err);
      }
    });
  }
}

export const gamerEasterEgg = new GamerEasterEggManager();
