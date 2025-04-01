export const themeVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const themeFragmentShader = `
  uniform sampler2D uDayTexture;
  uniform sampler2D uNightTexture;
  uniform float uMixRatio;
  varying vec2 vUv;

  void main() {
    vec4 dayColor = texture2D(uDayTexture, vUv);
    vec4 nightColor = texture2D(uNightTexture, vUv);
    gl_FragColor = mix(dayColor, nightColor, uMixRatio);
    gl_FragColor = linearToOutputTexel(mix(dayColor, nightColor, uMixRatio));
  }
`;
