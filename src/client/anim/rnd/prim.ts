/** SE1847: Primitive, 20.06.2025 */
import * as mth from "../../mth/mth.ts"
import * as col from "../../mth/collision.ts"
import * as mtl from "./res/mtl.ts"
import { loadTextFromFile } from "../../utils.js";
import { vec2, vec3, vec4 } from "../../mth/mth.ts"
import { getRenderContext, RenderContext } from "./rnd.ts";
import { getTimeContext, TimeContext } from "../timer.ts";
import { shdGetDefault } from "./res/shd.ts";

export class Vertex {
  position: vec3;
  texCoord: vec2;
  normal: vec3;
  color: vec4;

  constructor(position: vec3, texCoord: vec2, normal: vec3, color: vec4) {
    this.position = structuredClone(position);
    this.texCoord = structuredClone(texCoord);
    this.normal = structuredClone(normal);
    this.color = structuredClone(color);
  }

  toList(): number[] {
    return [this.position.x, this.position.y, this.position.z].concat(
      [this.texCoord.x, this.texCoord.y],
      [this.normal.x, this.normal.y, this.normal.z],
      [this.color.x, this.color.y, this.color.z, this.color.w]
    );
  }

  toArray(): Float32Array {
    const list: number[] = this.position.toList()
      .concat(this.texCoord.toList())
      .concat(this.normal.toList())
      .concat(this.color.toList());
    return new Float32Array(list);
  }
}

function vertexArrayToFloatArray(vertices: Vertex[]): Float32Array {
  let list: number[] = [];
  for (let i: number = 0; i < vertices.length; i++) {
    list = list.concat(vertices[i].toList());
  }
  return new Float32Array(list);
}

export class Primitive {
  glType: number;
  mtl: mtl.Material;
  vA!: WebGLVertexArrayObject;
  vBuf!: WebGLBuffer;
  iBuf!: WebGLBuffer;
  numOfElements: number;
  trans!: mth.mat4;
  saveBB!: col.OBB;
  BB: col.OBB;

  constructor(glType: number, mtl: mtl.Material, vertices: Vertex[], indices: number[]) {
    this.glType = glType;
    this.mtl = mtl;
    this.trans = mth.mat4Identity();

    this.saveBB = col.obbCreateFromAABB(col.evalAABB(vertices.map((v) => v.position)));
    this.BB = structuredClone(this.saveBB);

    if (vertices.length > 0) {
      this.vBuf = window.gl.createBuffer();
      this.vA = window.gl.createVertexArray();

      window.gl.bindVertexArray(this.vA);
      window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.vBuf);
      window.gl.bufferData(window.gl.ARRAY_BUFFER, vertexArrayToFloatArray(vertices), window.gl.STATIC_DRAW);
      window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.vBuf);

      window.gl.enableVertexAttribArray(0);
      window.gl.enableVertexAttribArray(1);
      window.gl.enableVertexAttribArray(2);
      window.gl.enableVertexAttribArray(3);

      window.gl.vertexAttribPointer(0, 3, window.gl.FLOAT, false, 48, 0);  /* p */
      window.gl.vertexAttribPointer(1, 2, window.gl.FLOAT, false, 48, 12); /* t */
      window.gl.vertexAttribPointer(2, 3, window.gl.FLOAT, false, 48, 20); /* n */
      window.gl.vertexAttribPointer(3, 4, window.gl.FLOAT, false, 48, 32); /* c */
    }
    if (indices.length > 0) {
      this.iBuf = window.gl.createBuffer();
      window.gl.bindBuffer(window.gl.ELEMENT_ARRAY_BUFFER, this.iBuf);
      window.gl.bufferData(window.gl.ELEMENT_ARRAY_BUFFER, new Int32Array(indices), window.gl.STATIC_DRAW);
      this.numOfElements = indices.length;
    }
    else {
      this.numOfElements = vertices.length;
    }
  }

  draw(matrW: mth.mat4) {
    this.mtl.apply();

    const rc: RenderContext = getRenderContext();
    window.gl.uniform3fv(window.gl.getUniformLocation(this.mtl.shd.program, "CamLoc"), new Float32Array([rc.camLoc.x, rc.camLoc.y, rc.camLoc.z]), 0, 0);
    window.gl.uniform3fv(window.gl.getUniformLocation(this.mtl.shd.program, "CamDir"), new Float32Array([rc.camDir.x, rc.camDir.y, rc.camDir.z]), 0, 0);
    window.gl.uniform3fv(window.gl.getUniformLocation(this.mtl.shd.program, "CamAt"), new Float32Array([rc.camAt.x, rc.camAt.y, rc.camAt.z]), 0, 0);
    window.gl.uniform3fv(window.gl.getUniformLocation(this.mtl.shd.program, "CamUp"), new Float32Array([rc.camUp.x, rc.camUp.y, rc.camUp.z]), 0, 0);
    window.gl.uniform3fv(window.gl.getUniformLocation(this.mtl.shd.program, "CamRight"), new Float32Array([rc.camRight.x, rc.camRight.y, rc.camRight.z]), 0, 0);
    window.gl.uniform1f(window.gl.getUniformLocation(this.mtl.shd.program, "ProjSize"), rc.projSize);
    window.gl.uniform1f(window.gl.getUniformLocation(this.mtl.shd.program, "ProjDist"), rc.projDist);
    window.gl.uniform1f(window.gl.getUniformLocation(this.mtl.shd.program, "FrameW"), rc.frameW);
    window.gl.uniform1f(window.gl.getUniformLocation(this.mtl.shd.program, "FrameH"), rc.frameH);

    const tc: TimeContext = getTimeContext();
    window.gl.uniform1f(window.gl.getUniformLocation(this.mtl.shd.program, "Time"), tc.localTime);

    matrW = mth.mat4MulMat4(matrW, this.trans);
    window.gl.uniformMatrix4fv(window.gl.getUniformLocation(this.mtl.shd.program, "MatrW"), false,
      matrW.toArray());

    const matrWVP: mth.mat4 = mth.mat4MulMat4(matrW, getRenderContext().matrVP);
    window.gl.uniformMatrix4fv(window.gl.getUniformLocation(this.mtl.shd.program, "MatrWVP"), false,
      matrWVP.toArray());

    window.gl.bindVertexArray(this.vA);

    if (this.iBuf == undefined) {
      window.gl.drawArrays(this.glType, 0, this.numOfElements);
    }
    else {
      window.gl.bindBuffer(window.gl.ELEMENT_ARRAY_BUFFER, this.iBuf);
      window.gl.drawElements(this.glType, this.numOfElements, window.gl.UNSIGNED_INT, 0);
    }
  }
}

export function primCreate(glType: number, mtl: mtl.Material, vertices: Vertex[], indices: number[]): Primitive {
  return new Primitive(glType, mtl, vertices, indices);
}

export function primCreateFromOBJString(primSrc: string, mtl: mtl.Material, m: mth.mat4 = mth.mat4Identity()): Primitive {
  const lines: string[] = primSrc.split("\n");
  const isSpace: Function = function (c: string) { return c == ' ' || c == '\n' || c == '\t'; };

  let nV: number = 0, nF: number = 0, nI: number = 0;
  let v: number = 0, f: number = 0, vn: number = 0, vt: number = 0;

  for (let i: number = 0; i < lines.length; i++) {
    const line: string = lines[i];
    if (line[0] == 'v' && line[1] == ' ') {
      nV++;
    } else if (line[0] == 'f' && line[1] == ' ') {
      let n: number = 0;
      for (let j = 2; j < line.length; j++) {
        if (!isSpace(line[j]) && isSpace(line[j - 1])) {
          n++;
        }
      }
      nF += n - 2;
    }
  }
  nI = nF * 3;
  const vertices = new Array<Vertex>(nV), indices = new Array(nI);

  for (let j = 0; j < lines.length; j++) {
    const line: string = lines[j];
    if (line[0] == 'v' && line[1] == ' ') {
      if (vertices[v] == undefined) {
        vertices[v] = new Vertex(new vec3(0, 0, 0), new vec2(0, 0), new vec3(0, 0, 0), new vec4(1, 1, 1, 1));
      }
      const nums: number[] = line.substring(2).split(' ').map((c) => parseFloat(c));
      vertices[v++].position = mth.vec3MulMat4(mth.vec3Set(nums[0], nums[1], nums[2]), m);
    } else if (line[0] == 'v' && line[1] == 'n' && line[2] == ' ') {
      if (vertices[vn] == undefined) {
        vertices[vn] = new Vertex(new vec3(0, 0, 0), new vec2(0, 0), new vec3(0, 0, 0), new vec4(1, 1, 1, 1));
      }
      const nums: number[] = line.substring(3).split(' ').map((c) => parseFloat(c));
      vertices[vn++].normal = mth.vec3Set(nums[0], nums[1], nums[2]);
    } else if (line[0] == 'v' && line[1] == 't' && line[2] == ' ') {
      if (vertices[vt] == undefined) {
        vertices[vt] = new Vertex(new vec3(0, 0, 0), new vec2(0, 0), new vec3(0, 0, 0), new vec4(1, 1, 1, 1));
      }
      const nums: number[] = line.substring(3).split(' ').map((c) => parseFloat(c));
      vertices[vt++].texCoord = mth.vec2Set(nums[0], nums[1]);
    } else if (line[0] == 'f' && line[1] == ' ') {
      let n: number = 0, c: number = 0, c0: number = 0, c1: number = 0;
      for (let i: number = 2; i < line.length; i++) {
        if (!isSpace(line[i]) && isSpace(line[i - 1])) {
          c = parseInt(line.substring(i).split("(\s|\\\\)")[0]);
          if (c < 0) {
            c += v;
          } else {
            c--;
          }
          if (n == 0) {
            c0 = c;
          } else if (n == 1) {
            c1 = c;
          } else {
            indices[f++] = c0;
            indices[f++] = c1;
            indices[f++] = c;
            c1 = c;
          }
          n++;
        }
      }
    }
  }
  primAutoNormals(vertices, indices);
  return new Primitive(window.gl.TRIANGLES, mtl, vertices, indices);
}

export async function primCreateFromOBJ(url: string, mtl: mtl.Material, m: mth.mat4): Promise<Primitive> {
  const modelSrc: string = await loadTextFromFile(url);
  return primCreateFromOBJString(modelSrc, mtl, m);
}

export function primAutoNormals(vertices: Vertex[], indices: number[]) {
  for (let i = 0; i < vertices.length; i++) {
    vertices[i].normal = mth.vec3Set1(0);
  }
  for (let i = 0; i < indices.length; i += 3) {
    const n0 = indices[i], n1 = indices[i + 1], n2 = indices[i + 2];
    const p0 = vertices[n0].position, p1 = vertices[n1].position, p2 = vertices[n2].position;
    const n = mth.vec3Normalize(
      mth.vec3CrossVec3(mth.vec3SubVec3(p1, p0), mth.vec3SubVec3(p2, p0))
    );
    vertices[n0].normal = mth.vec3AddVec3(vertices[n0].normal, n);
    vertices[n1].normal = mth.vec3AddVec3(vertices[n1].normal, n);
    vertices[n2].normal = mth.vec3AddVec3(vertices[n2].normal, n);
  }
  for (let i = 0; i < vertices.length; i++) {
    vertices[i].normal = mth.vec3Normalize(vertices[i].normal);
  }
}

export function primDrawOBB(prim: Primitive, c: vec3) {
  const vertices: Vertex[] = prim.BB.vertexBounds
    .map((pos) => new Vertex(pos, mth.vec2Set1(0), mth.vec3Set(0, 1, 0), mth.vec4Set1(1)));
  const indices: number[] = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];

  primCreate(window.gl.LINES, mtl.mtlCreate("BB material", c, c, mth.vec3Set1(0), 0, 1, shdGetDefault()), vertices, indices).draw(mth.mat4Identity());
}

export function primRecalcOBB(prim: Primitive) {
  for (let i = 0; i < 8; i++) {
    prim.BB.vertexBounds[i] = mth.pointTransform(prim.saveBB.vertexBounds[i], prim.trans);
  }
}

export function primSetMatrTrans(prim: Primitive, trans: mth.mat4) {
  prim.trans = trans;
  primRecalcOBB(prim);
}