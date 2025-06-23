import * as mth from "../mth/mth.js"
import * as col from "../mth/collision.ts";
import * as prim from "../anim/rnd/prim.ts";
import * as model from "../anim/rnd/model.ts";
import * as mtl from "../anim/rnd/res/mtl.ts";
import * as time from "../anim/timer.ts";
import { Unit } from "./units.js";

export class UnitModel extends Unit {
  model!: model.Model;
  prim1!: prim.Primitive;
  prim2!: prim.Primitive;

  constructor() {
    super("Model");
  }

  async init() {
    //this.model = await model.modelCreateFromG3DM("bin/models/helic.g3dm");
    this.prim1 = await prim.primCreateFromOBJ("bin/models/t90.obj", mtl.mtlGetDefault(), mth.mat4Identity());
    this.prim2 = await prim.primCreateFromOBJ("bin/models/t90.obj", mtl.mtlGetDefault(), mth.mat4Identity());
  }

  response() { }

  render() {
    let tc = time.getTimeContext();
    prim.primSetMatrTrans(this.prim1, mth.mat4MulMat4(
      mth.mat4RotateZ(tc.localTime * 30),
      mth.mat4Translate(mth.vec3Set(10, 40 + 10 * Math.sin(tc.localTime), 0))));

    prim.primSetMatrTrans(this.prim2, mth.mat4MulMat4(
      mth.mat4RotateX(tc.localTime * 47),
      mth.mat4MulMat4(
        mth.mat4Translate(mth.vec3Set(14, 40 + 5 * Math.sin(tc.localTime), 4)),
        mth.mat4RotateZ(52 * tc.localTime))));

    this.prim1.draw(mth.mat4Identity());
    prim.primDrawOBB(this.prim1, mth.vec3Set(0, 0, 0));

    this.prim2.draw(mth.mat4Identity());
    prim.primDrawOBB(this.prim2, mth.vec3Set(0, 0, 0));

    if (col.obbCollision(this.prim1.BB, this.prim2.BB)) {
      //console.log("Collision detected.");
    }
  }
}