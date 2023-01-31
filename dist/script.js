let s;

class Box{
  constructor(){
    this.x = random(100);
    this.y = random(100);
    this.z = random(100);
    this.r = random(10, 25);
    this.dr = random(.05, .1);
    this.dir = createVector(random(-1, 1), random(-1, 1), random(-1, 1)).normalize().mult(.05);
  }
  update(){
    this.x += this.dir.x;
    this.y += this.dir.y;
    this.z += this.dir.z;
    this.r += this.dr;
    
    if (this.x < 0  || this.x > 100) this.dir.x *= -1;
    if (this.y < 0  || this.y > 100) this.dir.y *= -1;
    if (this.z < 0  || this.z > 100) this.dir.z *= -1;
    if (this.r < 10 || this.r > 25)  this.dr    *= -1;
  }
  toArray(){
    return [this.x, this.y, this.z, this.r];
  }
}

function setup (){
  pixelDensity(1);
  createCanvas(0, 0, WEBGL);
  colorMode(HSB, 1, 1, 1);
  
  s = createShader(`
    precision highp float; varying vec2 vPos;
    attribute vec3 aPosition;
    void main(){vPos = (gl_Position = vec4(aPosition,1.0)).xy;}
  `,`
    precision highp float; varying vec2 vPos;
    uniform vec2 res;
    uniform float time;
    
    uniform vec4 box0;
    uniform vec4 box1;
    uniform vec4 box2;
    uniform vec4 box3;
    
    //from https://iquilezles.org/articles/distfunctions/
    float sdBox( vec3 p, vec3 b){
      vec3 q = abs(p) - b;
      return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
    }
    
    float BoxDE(vec3 p, float mult){
      p *= mult;
      p = abs(mod(p, vec3(200)) - 100.0);
      return min(
        min(sdBox(p-box0.xyz, vec3(box0.w*1.5)), sdBox(p-box1.xyz, vec3(box1.w*1.5))),
        min(sdBox(p-box2.xyz, vec3(box2.w*1.5)), sdBox(p-box3.xyz, vec3(box3.w*1.5)))
      );    
    }
    
    float DE(vec3 p){
      float d = BoxDE(p, 0.5);
      for (float i = 0.0; i < 3.0; i++){
        float m = pow(2.0, i);
        d = max(d, -BoxDE(p, m));
      }
      return d;
    }
    
    void main(){
      vec2 pixel = (vPos+1.0)*res/2.0;
      
      vec3 eye = vec3(0, max(res.x, res.y), 0);
      vec3 ro  = vec3(pixel.x-res.x/2.0, 0.0, pixel.y-res.y/2.0);
      vec3 dir = normalize(ro-eye);
      ro += vec3(200.0, 100.0-time*60.0, 0);
      
      float d = DE(ro);
      float step = 0.0;
      for (int i = 0; i < 150; i++){
        if (d < 0.1) break;
        ro += dir*d*.6;
        d = DE(ro);
        step += 1.0;
      }
      
      gl_FragColor = vec4(vec3(1.0-step/150.0), 1.0);
    }
  `);
  
  windowResized();
  init();
}

let boxes = [];
let startTime;
let init = () => {
  boxes = [];
  for (let i = 0; i < 4; i++) boxes.push(new Box());
  startTime = performance.now();
}

function draw(){
  for (let i = 0; i < boxes.length; i++){
    boxes[i].update();
    s.setUniform("box"+i, boxes[i].toArray());
  }
  
  s.setUniform("res", [width, height]);
  s.setUniform("time", (performance.now()-startTime)/1000.0);
  
  shader(s);
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}