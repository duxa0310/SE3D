/** SE1847: Textures, 17.06.2025 */
export class Texture {
  name: string;
  w!: number;
  h!: number;
  id!: WebGLTexture;
  glType!: number;
  isMipmap!: boolean;

  constructor(name: string, w: number, h: number, id: WebGLTexture, glType: number, isMipmap: boolean) {
    this.name = name;
    this.w = w;
    this.h = h;
    this.id = id;
    this.glType = glType;
    this.isMipmap = isMipmap;
  }
}

export function texCreateImage(name: string, url: string, w: number, h: number): Texture {
  const tex: Texture = new Texture(name, w, h, window.gl.TEXTURE_2D, window.gl.RGBA, true);
  console.log(`Loading texture: ${name} ${w} * ${h}`);

  tex.id = window.gl.createTexture()
  tex.glType = window.gl.TEXTURE_2D;

  window.gl.bindTexture(window.gl.TEXTURE_2D, tex.id);
  window.gl.texImage2D(window.gl.TEXTURE_2D, 0, window.gl.RGBA, 1, 1, 0,
    window.gl.RGBA, window.gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

  const image: HTMLImageElement = new Image();
  image.src = url;
  image.onload = () => {
    tex.w = image.width;
    tex.h = image.height;
    window.gl.bindTexture(tex.glType, tex.id);
    window.gl.pixelStorei(window.gl.UNPACK_FLIP_Y_WEBGL, true);
    window.gl.texImage2D(window.gl.TEXTURE_2D, 0, window.gl.RGBA, window.gl.RGBA, window.gl.UNSIGNED_BYTE, image);
    window.gl.generateMipmap(window.gl.TEXTURE_2D);
    window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_S, window.gl.REPEAT);
    window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_T, window.gl.REPEAT);
    window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MIN_FILTER, window.gl.LINEAR_MIPMAP_LINEAR);
    window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MAG_FILTER, window.gl.LINEAR);
  };

  return tex;
}

export function texCreateCubeMap(url: string, ext: string): Texture {
  const tex: Texture = new Texture(url.split("/").at(-1) || "", 1, 1, window.gl.TEXTURE_CUBE_MAP, window.gl.RGBA, true);

  tex.id = window.gl.createTexture();
  tex.glType = window.gl.TEXTURE_CUBE_MAP;

  const sideInfos: { target: number; fileName: string }[] = [
    { target: window.gl.TEXTURE_CUBE_MAP_POSITIVE_X, fileName: "/PosX." + ext },
    { target: window.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, fileName: "/NegX." + ext },
    { target: window.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, fileName: "/PosY." + ext },
    { target: window.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, fileName: "/NegY." + ext },
    { target: window.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, fileName: "/PosZ." + ext },
    { target: window.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, fileName: "/NegZ." + ext },
  ];
  window.gl.bindTexture(tex.glType, tex.id);
  sideInfos.forEach((side: { target: number; fileName: string }) => {
    window.gl.texImage2D(side.target, 0, window.gl.RGBA, 1, 1, 0, window.gl.RGBA, window.gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 0]));
  });
  window.gl.generateMipmap(window.gl.TEXTURE_CUBE_MAP);

  let is_first: boolean = true;
  sideInfos.forEach((side: { target: number; fileName: string }) => {
    window.gl.bindTexture(tex.glType, tex.id);
    const img = new Image();
    img.src = url + side.fileName;
    img.onload = () => {
      window.gl.bindTexture(tex.glType, tex.id);
      if (is_first) {
        is_first = false;
        sideInfos.forEach((side: { target: number; fileName: string }) => {
          window.gl.texImage2D(side.target, 0, window.gl.RGBA, img.width, img.height, 0, window.gl.RGBA, window.gl.UNSIGNED_BYTE, null);
        });
        window.gl.generateMipmap(window.gl.TEXTURE_CUBE_MAP);
      }
      window.gl.pixelStorei(window.gl.UNPACK_FLIP_Y_WEBGL, false);
      window.gl.texImage2D(side.target, 0, window.gl.RGBA, window.gl.RGBA, window.gl.UNSIGNED_BYTE, img);
      window.gl.generateMipmap(window.gl.TEXTURE_CUBE_MAP);
    };
  });
  window.gl.generateMipmap(window.gl.TEXTURE_CUBE_MAP);
  window.gl.texParameteri(window.gl.TEXTURE_CUBE_MAP, window.gl.TEXTURE_MIN_FILTER, window.gl.LINEAR_MIPMAP_LINEAR);
  window.gl.texParameteri(window.gl.TEXTURE_CUBE_MAP, window.gl.TEXTURE_MAG_FILTER, window.gl.LINEAR);
  window.gl.texParameteri(window.gl.TEXTURE_CUBE_MAP, window.gl.TEXTURE_WRAP_S, window.gl.CLAMP_TO_EDGE);
  window.gl.texParameteri(window.gl.TEXTURE_CUBE_MAP, window.gl.TEXTURE_WRAP_T, window.gl.CLAMP_TO_EDGE);
  window.gl.texParameteri(window.gl.TEXTURE_CUBE_MAP, window.gl.TEXTURE_WRAP_R, window.gl.CLAMP_TO_EDGE);

  return tex;
}

export function texCreateBinary(name: string, w: number, h: number, c: number, bytes: Uint8Array): Texture {
  const tex: Texture = new Texture(name, w, h, window.gl.TEXTURE_2D, window.gl.RGBA, true);
  console.log(`Loading texture: ${name} ${w} * ${h}`);

  tex.id = window.gl.createTexture();
  tex.glType = window.gl.TEXTURE_2D;
  window.gl.bindTexture(tex.glType, tex.id);

  let mips: number = Math.log(w > h ? w : h) / Math.log(2);
  mips = mips < 1 ? 1 : mips;

  window.gl.texStorage2D(window.gl.TEXTURE_2D, mips,
    c == 4 ? window.gl.RGBA8 : c == 3 ? window.gl.RGB8 : window.gl.R8, w, h);

  for (let i: number = 0; i < bytes.length; i += 4) {
    let tmp: number = bytes[i];
    bytes[i] = bytes[i + 2];
    bytes[i + 2] = tmp;
  }

  if (bytes != null) {
    window.gl.bindTexture(window.gl.TEXTURE_2D, tex.id);
    window.gl.pixelStorei(window.gl.UNPACK_ALIGNMENT, 1);
    window.gl.texSubImage2D(window.gl.TEXTURE_2D, 0, 0, 0, w, h,
      c == 4 ? window.gl.RGBA : c == 3 ? window.gl.RGB : window.gl.LUMINANCE, window.gl.UNSIGNED_BYTE, bytes);
  }

  window.gl.generateMipmap(window.gl.TEXTURE_2D);
  window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MIN_FILTER, window.gl.LINEAR_MIPMAP_LINEAR);
  window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MAG_FILTER, window.gl.LINEAR);
  window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_S, window.gl.REPEAT);
  window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_T, window.gl.REPEAT);

  tex.name = name;

  return tex;
}