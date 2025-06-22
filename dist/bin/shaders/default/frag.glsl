layout(location = 0) out vec4 OutColor;

in vec3 DrawPos;
in vec2 DrawTexCoord;
in vec3 DrawNormal;
in vec4 DrawColor;

uniform vec3 Ka;
uniform vec4 KdTrans;
uniform vec4 KsPh;

uniform float ProjSize, ProjDist;
uniform float FrameW, FrameH;

uniform vec3 CamDir, CamUp, CamRight, CamLoc, CamAt;

uniform sampler2D Tex0;
uniform bool IsTexture0;

uniform float Time;

vec3 Shade( vec3 Pos, vec3 N, vec3 Kd, vec3 Ks, float Ph, vec3 L, vec3 LC ) {
  vec3 color = vec3(0), V = normalize(Pos - CamLoc);
 
  N = faceforward(N, V, N);
  color += 0.8 * max(0.1, dot(N, L) * dot(N, L)) * Kd * LC;

  vec3 R = reflect(V, N);
  color += pow(max(0.1, dot(R, L)), Ph) * Ks * LC;
  
  return color;
}   

void main()
{                                 
  vec4 color;       
  if (IsTexture0) {
    color = texture(Tex0, DrawTexCoord); 
  } else {
    color = vec4(Ka * DrawColor.xyz, 1.0);
  }

  if (KdTrans.w < 1.0) 
  {
    discard;
  }

  color.xyz *= 1.02 * Shade(DrawPos, normalize(DrawNormal), 
      KdTrans.xyz, KsPh.xyz, KsPh.w, normalize(vec3(0.0, 1.0, 0.0)), vec3(1.0, 1.0, 1.0));
  
  OutColor = vec4(color.xyz, 1.0); 
}