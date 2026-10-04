import * as THREE from 'three';
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';

/** HDR scene → mipmap bloom → ACES filmic tone mapping → vignette (→ SMAA when MSAA is off). */
export class Pipeline {
  readonly composer: EffectComposer;
  readonly bloom: BloomEffect;
  private smaaPass: EffectPass | null = null;

  constructor(private readonly renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, msaa: number, levels: number) {
    this.composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: msaa });
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new BloomEffect({ mipmapBlur: true, intensity: 0.9, luminanceThreshold: 0.7, luminanceSmoothing: 0.25, radius: 0.55, levels });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.6 });
    this.composer.addPass(new EffectPass(camera, this.bloom, tone, vignette));
    this.setMultisampling(msaa);
  }

  setMultisampling(samples: number): void {
    this.composer.multisampling = samples;
    if (samples === 0 && !this.smaaPass) {
      this.smaaPass = new EffectPass(undefined, new SMAAEffect({ preset: SMAAPreset.HIGH }));
      this.composer.addPass(this.smaaPass);
    } else if (samples > 0 && this.smaaPass) {
      this.composer.removePass(this.smaaPass);
      this.smaaPass.dispose();
      this.smaaPass = null;
    }
  }

  setSize(w: number, h: number): void {
    this.composer.setSize(w, h, false);
  }

  render(dt: number): void {
    this.renderer.setRenderTarget(null);
    this.composer.render(dt);
  }
}
