import * as mth from "../mth/mth.js"
import * as prim from "../anim/rnd/prim.ts";
import * as mtl from "../anim/rnd/res/mtl.ts";
import * as shd from "../anim/rnd/res/shd.ts";
import { Unit, unitDelete } from "./units.js";
import { getRenderContext } from "../anim/rnd/rnd.ts";
import { getTimeContext, TimeContext } from "../anim/timer.ts";
import { mrkDrawSphere } from "../anim/rnd/res/mrk.ts";
import { playersMap } from "../anim/anim.ts";
import { socket, username } from "../main.js";
import { getPointHeight } from "./u_grid.ts";

function collision(bulletLoc: mth.vec3): boolean {
  if (bulletLoc.y <= getPointHeight(bulletLoc.x, bulletLoc.z)) {
    return true;
  }
  if (playersMap != undefined) {
    for (let name of playersMap.keys()) {
      const playerContext = playersMap.get(name) || { online: false, loc: mth.vec3Set1(0), dir: mth.vec3Set1(0), hit: false };
      //console.log(name, playerContext);

      if (name != username && playerContext.online && playerContext.loc != undefined) {
        if (mth.vec3Len(mth.vec3SubVec3(bulletLoc, playerContext.loc)) < 3) {
          playerContext.hit = true;
          socket.emit("bulletCollision", {
            target: name,
            shooter: username,
          });
          return true;
        }
      }
    }
  }
  return false;
}

export class UnitBullet extends Unit {
  prim!: prim.Primitive;
  pos: mth.vec3;
  vel: mth.vec3;

  constructor(pos: mth.vec3, vel: mth.vec3) {
    super("Bullet");
    this.pos = structuredClone(pos);
    this.vel = structuredClone(vel);
  }

  async init() {
    ;
  }

  response() {
    const tc: TimeContext = getTimeContext();

    this.vel = mth.vec3AddVec3(this.vel, mth.vec3MulNum(mth.vec3Set(0, -9.81, 0), tc.localDeltaTime));
    this.pos = mth.vec3AddVec3(this.pos, mth.vec3MulNum(this.vel, tc.localDeltaTime));

    if (collision(this.pos)) {
      unitDelete(this);
    }
  }

  render() {
    mrkDrawSphere(this.pos, mth.vec3Set1(0.47), mth.vec4Set(0.5, 0.25, 0, 1), mth.mat4Identity());
  }
}