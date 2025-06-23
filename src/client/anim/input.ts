import * as mth from "../mth/mth.ts";
import { UnitBullet } from "../units/u_bullet.ts";
import { getPointHeight } from "../units/u_grid.ts";
import { unitAdd } from "../units/units.ts";
import { AnimContext, getAnimContext } from "./anim.ts";
import { getRenderContext, RenderContext, rndCamSet } from "./rnd/rnd";
import { getTimeContext, TimeContext } from "./timer.ts";

export class InputContext {
  keysOld: boolean[] = new Array(256).fill(false);
  keys: boolean[] = new Array(256).fill(false);
  keysClick: boolean[] = new Array(256).fill(false);
  shiftKey: boolean = false;
  altKey: boolean = false;
  ctrlKey: boolean = false;

  mLeft: boolean = false;
  mMiddle: boolean = false;
  mRight: boolean = false;

  mx: number = 0; my: number = 0; mz: number = 0;
  mdx: number = 0; mdy: number = 0; mdz: number = 0;

  constructor() { }
}

const input: InputContext = new InputContext();

function inputChangeCamPos(deltaLoc: mth.vec3, deltaAt: mth.vec3) {
  const rc: RenderContext = getRenderContext();

  rndCamSet(mth.vec3AddVec3(rc.camLoc, deltaLoc), mth.vec3AddVec3(rc.camAt, deltaAt), mth.vec3Set(0, 1, 0));
}

function inputChangeCamRot(deltaAzimuth: number, deltaElevator: number, deltaDist: number) {
  const rc: RenderContext = getRenderContext();

  let dist: number = mth.vec3Len(mth.vec3SubVec3(rc.camAt, rc.camLoc));
  const
    cosT: number = (rc.camLoc.y - rc.camAt.y) / dist,
    sinT: number = Math.pow(1 - cosT * cosT, 0.5),
    plen: number = dist * sinT,
    cosP: number = (rc.camLoc.z - rc.camAt.z) / plen,
    sinP: number = (rc.camLoc.x - rc.camAt.x) / plen;
  let
    azimuth: number = mth.radiansToDegrees(Math.atan2(sinP, cosP)),
    elevator: number = mth.radiansToDegrees(Math.atan2(sinT, cosT));

  azimuth += deltaAzimuth;
  elevator += deltaElevator;
  dist += deltaDist;

  if (elevator < 0.08) {
    elevator = 0.08;
  } else if (elevator > 178.90) {
    elevator = 178.90;
  }
  if (dist < 0.1) {
    dist = 0.1;
  }

  rndCamSet(
    mth.pointTransform(
      mth.vec3Set(0, dist, 0),
      mth.mat4MulMat4MulMat4(mth.mat4RotateX(elevator),
        mth.mat4RotateY(azimuth), mth.mat4Translate(rc.camAt))),
    rc.camAt, mth.vec3Set(0, 1, 0));
}

function onKeyDown(e: KeyboardEvent) {
  input.keysOld[e.key.charCodeAt(0)] = input.keys[e.key.charCodeAt(0)];
  input.keys[e.key.charCodeAt(0)] = true;
  input.keysClick[e.key.charCodeAt(0)] = !input.keysOld[e.key.charCodeAt(0)] && input.keys[e.key.charCodeAt(0)];

  input.shiftKey = e.shiftKey;
  input.altKey = e.altKey;
  input.ctrlKey = e.ctrlKey;
}

function onKeyUp(e: KeyboardEvent) {
  input.keysOld[e.key.charCodeAt(0)] = input.keys[e.key.charCodeAt(0)];
  input.keys[e.key.charCodeAt(0)] = false;
  input.keysClick[e.key.charCodeAt(0)] = false;

  input.shiftKey = e.shiftKey;
  input.altKey = e.altKey;
  input.ctrlKey = e.ctrlKey;
}

function onMouseMove(e: MouseEvent) {
  if (input.mx == 0 && input.my == 0) {
    input.mx = e.clientX;
    input.my = e.clientY;
  }
  input.mdx = e.clientX - input.mx;
  input.mdy = e.clientY - input.my;
  input.mx = e.clientX;
  input.my = e.clientY;
  if (input.mLeft) {
    inputChangeCamRot(-0.30 * input.mdx, -0.30 * input.mdy, 0);
  }
}

function onMouseWheel(e: WheelEvent) {
  input.mdz = e.deltaY;
  input.mz += input.mdz;
  inputChangeCamRot(0, 0, 0.102 * input.mdz);
}

function onMouseUp(e: MouseEvent) {
  switch (e.button) {
    case 0:
      input.mLeft = false;
      break;
    case 1:
      input.mMiddle = false;
      break;
    case 2:
      input.mRight = false;
      break;
  }
}

function onMouseDown(e: MouseEvent) {
  switch (e.button) {
    case 0:
      input.mLeft = true;
      break;
    case 1:
      input.mMiddle = true;
      break;
    case 2:
      input.mRight = true;
      break;
  }
}

export function inputInit() {
  window.addEventListener('keydown', (e) => onKeyDown(e));
  window.addEventListener('keyup', (e) => onKeyUp(e));
  window.addEventListener('mousemove', (e) => onMouseMove(e));
  window.addEventListener('wheel', (e) => onMouseWheel(e));
  window.addEventListener('mouseup', (e) => onMouseUp(e));
  window.addEventListener('mousedown', (e) => onMouseDown(e));
}

export function inputResponse() {
  const tc: TimeContext = getTimeContext();
  const rc: RenderContext = getRenderContext();
  const ac: AnimContext = getAnimContext();

  if (input.keysClick[" ".charCodeAt(0)]) {
    input.keysClick[" ".charCodeAt(0)] = false;

    unitAdd(new UnitBullet(
      mth.vec3AddVec3(mth.vec3AddVec3(ac.playerPos, mth.vec3Set(4.7 * ac.playerDir.x, 0, 4.7 * ac.playerDir.z)), mth.vec3Set(0, 3.0, 0)),
      mth.vec3MulNum(ac.playerDir, 80))
    );
  }
  let deltaPos: mth.vec3 = mth.vec3MulNum(ac.playerDir, 3.0 * tc.localDeltaTime * (1 + Number(input.shiftKey)));
  if (input.keys["w".charCodeAt(0)] || input.keys["s".charCodeAt(0)]) {
    if (input.keys["s".charCodeAt(0)]) deltaPos = mth.vec3Neg(deltaPos);
    //if ()
    ac.playerPos = mth.vec3AddVec3(ac.playerPos, deltaPos);
    const newY: number = getPointHeight(ac.playerPos.x, ac.playerPos.z);
    const deltaY: number = newY - ac.playerPos.y;
    ac.playerPos.y = newY;
    deltaPos.y = deltaY;
    rndCamSet(mth.vec3AddVec3(rc.camLoc, deltaPos), mth.vec3AddVec3(ac.playerPos, mth.vec3Set(0, 0, 0)), mth.vec3Set(0, 1, 0));
  }
  let deltaAngle: number = 30 * tc.localDeltaTime;
  if (input.keys["a".charCodeAt(0)] || input.keys["d".charCodeAt(0)]) {
    if (input.keys["d".charCodeAt(0)]) deltaAngle *= -1;
    ac.playerDir = mth.vec3MulMat4(ac.playerDir, mth.mat4RotateY(deltaAngle));
  }
}

export function getInputContext(): InputContext {
  return input;
}