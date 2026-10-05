import * as THREE from 'three';
import {
  BlendFunction,
  BloomEffect,
  Effect,
  EffectComposer,
  EffectPass,
  GodRaysEffect,
  KernelSize,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import type { QualityPreset } from './quality';

/**
 * A gentle filmic grade after tone mapping: cool shadows and warm highlights, slightly lifted blacks, a touch more
 * colour, and fine film grain (stronger in the shadows). Works in display space so the lift and the grain are even.
 */
class GradeEffect extends Effect {
  constructor(grain: number) {
    super('GradeEffect', /* glsl */ `
      uniform float uSeed; uniform float uGrain;
      float gHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
        vec3 c = pow(max(inputColor.rgb, 0.0), vec3(1.0 / 2.2));
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c *= mix(vec3(0.94, 0.99, 1.07), vec3(1.045, 1.0, 0.93), smoothstep(0.12, 0.75, l));
        c = c * 0.955 + vec3(0.024, 0.026, 0.036);
        float l2 = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l2), c, 1.07);
        c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);
        float g = gHash(floor(uv * resolution) + uSeed * 97.0) + gHash(floor(uv * resolution) * 1.37 + uSeed * 31.0) - 1.0;
        c += g * uGrain * (1.0 - 0.75 * l2);
        outputColor = vec4(pow(max(c, 0.0), vec3(2.2)), inputColor.a);
      }`, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, THREE.Uniform>([['uSeed', new THREE.Uniform(0)], ['uGrain', new THREE.Uniform(grain)]]),
    });
  }
  set seed(v: number) { this.uniforms.get('uSeed')!.value = v; }
}

/**
 * HDR scene → mipmap bloom → god rays from the sun at the head of the ladder (medium/high) → ACES filmic tone mapping →
 * filmic grade and grain → vignette (→ SMAA when MSAA is off).
 */
export class Pipeline {
  readonly composer: EffectComposer;
  bloom!: BloomEffect;
  godRays: GodRaysEffect | null = null;
  private grade!: GradeEffect;
  private mainPass: EffectPass | null = null;
  private smaaPass: EffectPass | null = null;
  private frameNo = 0;

  constructor(private readonly renderer: THREE.WebGLRenderer, scene: THREE.Scene, private readonly camera: THREE.Camera, p: QualityPreset, private readonly sun: THREE.Mesh) {
    this.composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: p.msaa });
    this.composer.addPass(new RenderPass(scene, camera));
    this.setQuality(p);
  }

  setQuality(p: QualityPreset): void {
    for (const pass of [this.mainPass, this.smaaPass]) {
      if (!pass) continue;
      this.composer.removePass(pass);
      pass.dispose();
    }
    this.smaaPass = null;
    this.sun.removeFromParent();
    this.composer.multisampling = p.msaa;
    this.bloom = new BloomEffect({ mipmapBlur: true, intensity: 0.9, luminanceThreshold: 0.72, luminanceSmoothing: 0.28, radius: 0.55, levels: p.bloomLevels });
    this.godRays = p.godRays > 0
      ? new GodRaysEffect(this.camera, this.sun, {
        blendFunction: BlendFunction.SCREEN, samples: p.godRays, density: 0.9, decay: 0.925, weight: 0.3, exposure: 0.5,
        clampMax: 0.55, blur: true, kernelSize: KernelSize.SMALL, resolutionScale: 0.5,
      })
      : null;
    this.grade = new GradeEffect(p.grain);
    const effects: Effect[] = [this.bloom];
    if (this.godRays) effects.push(this.godRays);
    effects.push(new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }), this.grade, new VignetteEffect({ offset: 0.28, darkness: 0.62 }));
    this.mainPass = new EffectPass(this.camera, ...effects);
    this.composer.addPass(this.mainPass);
    if (p.msaa === 0) {
      this.smaaPass = new EffectPass(undefined, new SMAAEffect({ preset: SMAAPreset.HIGH }));
      this.composer.addPass(this.smaaPass);
    }
  }

  /** strength of the god rays (0 … 1), e.g. faded out in close-ups */
  setRays(k: number): void {
    if (this.godRays) this.godRays.blendMode.opacity.value = k;
  }

  setSize(w: number, h: number): void {
    this.composer.setSize(w, h, false);
  }

  /** dt: seconds since the last frame; still: freeze the grain (reduced motion) */
  render(dt: number, still = false): void {
    if (!still) this.grade.seed = (++this.frameNo % 64) / 64;
    this.renderer.setRenderTarget(null);
    this.composer.render(dt);
  }
}
