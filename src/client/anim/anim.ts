import * as mth from "../mth/mth.ts";
import * as prim from "./rnd/prim.ts";
import * as mdl from "./rnd/model.ts";
import * as rnd from "./rnd/rnd.ts";
import * as time from "./timer.ts";
import * as input from "./input.ts";
import * as shd from "./rnd/res/shd.ts";
import * as mtl from "./rnd/res/mtl.ts";
import * as units from "../units/units.ts";
import * as mrk from "./rnd/res/mrk.ts";
import { UnitSkybox } from "../units/u_skybox.ts";
import { UnitAxis } from "../units/u_axis.ts";
import { UnitModel } from "../units/u_model.ts";
import { getPointHeight, UnitGrid } from "../units/u_grid.ts";
import { texCreateImage } from "./rnd/res/tex.ts";
import { UnitPrim } from "../units/u_prim.ts";

declare global {
  interface Window {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
  }
}

export let playersMap: Map<String, {
  online: boolean,
  loc: mth.vec3,
  dir: mth.vec3,
  hit: boolean
}>;

export function setPlayersMap(map: Map<String, { online: boolean, loc: mth.vec3, dir: mth.vec3, hit: boolean }>) {
  playersMap = map;
}

export class AnimContext {
  playerPos: mth.vec3;
  playerDir: mth.vec3;

  constructor(playerPos: mth.vec3, playerDir: mth.vec3) {
    this.playerPos = playerPos;
    this.playerDir = playerDir;
  }
}

const ac: AnimContext = new AnimContext(mth.vec3Set(0, getPointHeight(0, 0), 0), mth.vec3Set(0, 0, 1));

let playerPrim: prim.Primitive;

export async function animInit() {
  rnd.rndInit();
  time.timerInit();
  input.inputInit();
  await shd.shdInit();
  mtl.mtlInit();
  mrk.mrkInit();
  units.unitAdd(new UnitSkybox());
  //units.unitAdd(new UnitAxis());
  units.unitAdd(new UnitGrid());
  //units.unitAdd(new UnitModel());
  //units.unitAdd(new UnitPrim());
  await units.unitsInit();

  const mtlPlayer: mtl.Material = new mtl.Material("Player material", mth.vec3Set1(1), mth.vec3Set1(1), mth.vec3Set1(1), 30, 1,
    shd.shdGetDefault());
  mtlPlayer.textures[0] = texCreateImage("Square texture", "bin/textures/t90diff.png", 1, 1);
  playerPrim = await prim.primCreateFromOBJ("bin/models/t90.obj", mtlPlayer, mth.mat4Identity());
}

function animDrawPlayer(loc: mth.vec3, dir: mth.vec3) {
  const landNormal: mth.vec3 = mth.vec3Normalize(mth.vec3CrossVec3(
    mth.vec3SubVec3(mth.vec3Set(loc.x, getPointHeight(loc.x, loc.z + 0.001), loc.z + 0.001), loc),
    mth.vec3SubVec3(mth.vec3Set(loc.x + 0.001, getPointHeight(loc.x + 0.001, loc.z), loc.z), loc),
  ));
  const normCrossUp: mth.vec3 = mth.vec3Normalize(mth.vec3CrossVec3(landNormal, mth.vec3Set(0, 1, 0)));
  prim.primSetMatrTrans(playerPrim,
    mth.mat4MulMat4(
      mth.mat4MulMat4(
        mth.mat4RotateY(mth.radiansToDegrees(Math.atan2(dir.x, dir.z))),
        mth.mat4Rotate(mth.radiansToDegrees(-Math.acos(mth.vec3DotVec3(landNormal, mth.vec3Set(0, 1, 0)))), mth.vec3Normalize(normCrossUp))
      ),
      mth.mat4Translate(mth.vec3AddVec3(loc, mth.vec3Set(0, 1.30, 0))))
  );
  playerPrim.draw(mth.mat4Identity());
  //prim.primDrawOBB(playerPrim, mth.vec3Set1(1));
}

export function animRender() {
  time.timerResponse();
  input.inputResponse();
  rnd.rndStart();
  units.unitsResponse();
  units.unitsRender();

  if (playersMap != undefined) {
    for (let name of playersMap.keys()) {
      const playerContext = playersMap.get(name) || { online: false, loc: mth.vec3Set1(0), dir: mth.vec3Set1(0), hit: false };
      //console.log(name, playerContext);

      if (playerContext.online && playerContext.loc != undefined) {
        animDrawPlayer(playerContext.loc, playerContext.dir)
      }
    }
  }
}

export function getAnimContext(): AnimContext {
  return ac;
}