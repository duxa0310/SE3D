import * as mth from "../mth/mth.js"
import { Unit } from "./units.js";
import * as prim from "../anim/rnd/prim.ts";
import * as mtl from "../anim/rnd/res/mtl.ts";
import * as tex from "../anim/rnd/res/tex.ts";
import * as shd from "../anim/rnd/res/shd.ts";

export class UnitSkybox extends Unit {
  prim!: prim.Primitive;

  constructor() {
    super("Skybox");
  }

  async init() {
    let skyshader: shd.Shader = shd.shdGetByName("skybox");
    let skyMtl: mtl.Material = mtl.mtlCreate("Skybox material", mth.vec3Set1(0.5), mth.vec3Set1(0.8), mth.vec3Set1(0.3), 30, 1, skyshader);
    skyMtl.textures[0] = tex.texCreateCubeMap("bin/textures/skyboxes/SkyStd", "png");
    let vertices: prim.Vertex[] = [
      new prim.Vertex(mth.vec3Set(-1, -1, 0), mth.vec2Set(1, 0), mth.vec3Set(0, 0, 0), mth.vec4Set(1, 1, 1, 1)),
      new prim.Vertex(mth.vec3Set(3, -1, 0), mth.vec2Set(0, 1), mth.vec3Set(0, 0, 0), mth.vec4Set(1, 1, 1, 1)),
      new prim.Vertex(mth.vec3Set(-1, 3, 0), mth.vec2Set(1, 1), mth.vec3Set(0, 0, 0), mth.vec4Set(1, 1, 1, 1)),
    ];
    this.prim = prim.primCreate(window.gl.TRIANGLES, skyMtl, vertices, []);
  }

  response() { }

  render() {
    window.gl.depthMask(false);
    this.prim.draw(mth.mat4Identity());
    window.gl.depthMask(true);
  }
}