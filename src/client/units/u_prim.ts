import * as mth from "../mth/mth.js"
import * as col from "../mth/collision.ts";
import * as prim from "../anim/rnd/prim.ts";
import * as mtl from "../anim/rnd/res/mtl.ts";
import * as time from "../anim/timer.ts";
import { Unit } from "./units.js";
import { texCreateImage } from "../anim/rnd/res/tex.ts";
import { shdGetDefault } from "../anim/rnd/res/shd.ts";
import { Model, modelCreateFromG3DM } from "../anim/rnd/model.ts";
import { getInputContext, InputContext } from "../anim/input.ts";

export class UnitPrim extends Unit {
  prim!: prim.Primitive;
  pr!: prim.Primitive;
  model!: Model;
  flag: boolean = false;
  color: mth.vec3 = mth.vec3Set1(1);

  constructor() {
    super("Prim");
  }

  async init() {
    const mat: mtl.Material = new mtl.Material("Test material", mth.vec3Set(0.8, 0.47, 0.30), mth.vec3Set1(1), mth.vec3Set1(0), 0, 1,
      shdGetDefault());
    const mt: mtl.Material = new mtl.Material("Test material", mth.vec3Set(0.8, 0.8, 0.8), mth.vec3Set1(1), mth.vec3Set1(0), 0, 1,
      shdGetDefault());
    this.prim = await prim.primCreateFromOBJ("bin/models/cow.obj", mtl.mtlGetDefault(), mth.mat4Identity());
    this.pr = await prim.primCreateFromOBJ("bin/models/sova30.obj", mtl.mtlGetDefault(), mth.mat4Translate(mth.vec3Set(0, 0, -5)));
    this.prim.mtl = mat;
    this.pr.mtl = mt;
  }

  response() {
    const ic: InputContext = getInputContext();

    if (ic.keysClick["Y".charCodeAt(0)]) {
      this.flag = !this.flag;
      ic.keysClick["Y".charCodeAt(0)] = false;
    }

  }

  render() {
    const tc = time.getTimeContext();

    prim.primSetMatrTrans(this.prim, mth.mat4MulMat4MulMat4(
      mth.mat4RotateY(tc.localTime * 30),
      mth.mat4RotateX(90 + tc.localTime * 47),
      mth.mat4Translate(mth.vec3Set(0, 12 * Math.sin(0.5 * tc.localTime), 0)),
    ));

    prim.primSetMatrTrans(this.pr, mth.mat4MulMat4MulMat4(
      mth.mat4Scale(mth.vec3Set1(1.6)),
      mth.mat4RotateX(-tc.localTime * 30),
      mth.mat4Translate(mth.vec3Set(12 * Math.sin(tc.localTime - 3.0), 0, 0)),
    ));

    this.prim.draw(mth.mat4Identity());
    this.pr.draw(mth.mat4Identity())

    if (col.obbCollision(this.prim.BB, this.pr.BB)) {
      this.color = mth.vec3Set(1, 0, 0);
    } else {
      this.color = mth.vec3Set1(1);
    }

    if (!this.flag) {
      prim.primDrawOBB(this.prim, this.color);
      prim.primDrawOBB(this.pr, this.color);
    }
  }
}