'use strict';
/*
 step1: 円を表示する
 step2: クリックした場所に円を描く（直径はとりあえず10でいい）
 step3: クリックで点を排除できるようにする。
 step3.1: 点を追加するモードと点を削除するモードの切り替えができるようにし、
          点を削除するモードの時はクリックしても点が追加されないようにする。
 step3.2: 点を削除するメソッドを追加する。
*/
let figSet;
let drawMode = 0;
let button_off = [];
let button_on = [];
const buttonPos = [{x:-210, y:210}, {x:-210, y:270}];
const MaxButtonId = 2;

function preload(){
  for(let i = 0; i < MaxButtonId; i++){
    button_off.push(loadImage("./assets/fig_" + i + "_off.png"));
    button_on.push(loadImage("./assets/fig_" + i + "_on.png"));
  }
}

function setup(){
  createCanvas(480, 640);
  colorMode(HSB, 100);
  figSet = new figureSet();
}

function draw(){
  background(0);
  translate(240, 200);
  noStroke();
  fill(70);
  ellipse(0, 0, 400, 400);
  figSet.render();
  drawConfig();
}

class figureSet{
  constructor(){
    this.points = [];
  }
  addPoint(x, y){
    this.points.push({x:x, y:y});
  }
  removePoint(x, y){
    // (x, y)に最も近い点を探す
    // その点との距離が5以下ならその点を削除する
    let id = this.calcClosestPoint(x, y);
    let distPow2 = Math.pow(this.points[id].x - x, 2) + Math.pow(this.points[id].y - y, 2);
    if(distPow2 > 25){ return; }
    this.points.splice(id, 1); // 該当する点を削除
  }
  calcClosestPoint(x, y){
    let minDist = 40000;
    let id = -1;
    for(let i = 0; i < this.points.length; i++){
      let distPow2 = Math.pow(this.points[i].x - x, 2) + Math.pow(this.points[i].y - y, 2);
      if(distPow2 < minDist){ minDist = distPow2; id = i; }
    }
    return id;
  }
  render(){
    fill(0);
    this.points.forEach((p) => {ellipse(p.x, p.y, 10, 10);})
  }
}

function drawConfig(){
  fill(70);
  rect(-240, 200, 480, 240);
  for(let i = 0; i < MaxButtonId; i++){
    if(drawMode === i){
      image(button_on[i], buttonPos[i].x, buttonPos[i].y);
    }else{
      image(button_off[i], buttonPos[i].x, buttonPos[i].y);
    }
  }
}

function mouseClicked(){
  let x = mouseX - 240, y = mouseY - 200;
  if(Math.pow(x, 2) + Math.pow(y, 2) < 40000){
    if(drawMode === 0){
      figSet.addPoint(x, y);
      console.log(x.toString() + "," + y.toString());
      return;
    }else if(drawMode === 1){
      figSet.removePoint(x, y);
    }
  }else{
    x = mouseX - 30, y = mouseY - 410;
    if(x < 0 || x > 450 || y < 0 || y > 240){ return; }
    if((x % 150) > 120 || (y % 60) > 40){ return; }
    let buttonId = 4 * Math.floor(x / 150) + Math.floor(y / 60);
    drawMode = buttonId;
  }
  return;
}
