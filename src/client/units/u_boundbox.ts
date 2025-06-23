import * as mth from "../mth/mth.js"
import * as prim from "../anim/rnd/prim.ts";
import * as mdl from "../anim/rnd/model.ts";
import * as mtl from "../anim/rnd/res/mtl.ts";
import * as mrk from "../anim/rnd/res/mrk.ts";
import * as time from "../anim/timer.ts";
import { Unit } from "./units.js";
import { getRenderContext } from "../anim/rnd/rnd.ts";

export class UnitBoundBox extends Unit {
  model!: mdl.Model;
  prim!: prim.Primitive;

  constructor() {
    super("Bound box");
  }

  vertices!: prim.Vertex[];
  indices!: number[];

  async init() {
    this.model = await mdl.modelCreateFromG3DM("bin/models/helic.g3dm");
    //this.model = mdl.modelGetByName("bin/models/helic.g3dm");
    this.vertices = [
      new prim.Vertex(mth.vec3Set(this.model.bb[0].x, this.model.bb[0].y, this.model.bb[0].z), mth.vec2Set(0, 0), mth.vec3Set(0, 0, 1), mth.vec4Set(1, 1, 1, 1)),
      new prim.Vertex(mth.vec3Set(this.model.bb[0].x, this.model.bb[6].y, this.model.bb[0].z), mth.vec2Set(0, 0), mth.vec3Set(0, 0, 1), mth.vec4Set(1, 1, 1, 1)),
      new prim.Vertex(mth.vec3Set(this.model.bb[0].x, this.model.bb[6].y, this.model.bb[6].z), mth.vec2Set(0, 0), mth.vec3Set(0, 0, 1), mth.vec4Set(1, 1, 1, 1)),
      new prim.Vertex(mth.vec3Set(this.model.bb[0].x, this.model.bb[0].y, this.model.bb[6].z), mth.vec2Set(0, 0), mth.vec3Set(0, 0, 1), mth.vec4Set(1, 1, 1, 1)),

      new prim.Vertex(mth.vec3Set(this.model.bb[6].x, this.model.bb[0].y, this.model.bb[0].z), mth.vec2Set(0, 0), mth.vec3Set(0, 0, 1), mth.vec4Set(1, 1, 1, 1)),
      new prim.Vertex(mth.vec3Set(this.model.bb[6].x, this.model.bb[6].y, this.model.bb[0].z), mth.vec2Set(0, 0), mth.vec3Set(0, 0, 1), mth.vec4Set(1, 1, 1, 1)),
      new prim.Vertex(mth.vec3Set(this.model.bb[6].x, this.model.bb[6].y, this.model.bb[6].z), mth.vec2Set(0, 0), mth.vec3Set(0, 0, 1), mth.vec4Set(1, 1, 1, 1)),
      new prim.Vertex(mth.vec3Set(this.model.bb[6].x, this.model.bb[0].y, this.model.bb[6].z), mth.vec2Set(0, 0), mth.vec3Set(0, 0, 1), mth.vec4Set(1, 1, 1, 1))];
    this.indices = [
      0, 1,
      1, 2,
      2, 3,
      3, 0,

      4, 5,
      5, 6,
      6, 7,
      7, 4,

      0, 4,
      1, 5,
      2, 6,
      3, 7];

    this.prim = prim.primCreate(window.gl.LINES, mtl.mtlGetDefault(), this.vertices, this.indices);
  };

  response() { }

  render() {
    let tc = time.getTimeContext();
    let m: mth.mat4 = mth.mat4MulMat4(mth.mat4RotateX(-90), mth.mat4Translate(mth.vec3Set(10 * tc.localTime, 30, 0)));
    this.model.trans = m;
    this.model.draw(mth.mat4Identity());
  }
}