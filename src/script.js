'use strict';
// step1: 円を表示する
// step2: クリックした場所に円を描く（直径はとりあえず10でいい）
let figSet;

function setup(){
  createCanvas(480, 480);
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
}

class figureSet{
  constructor(){
    this.points = [];
  }
  addPoint(x, y){
    this.points.push({x:x, y:y});
  }
  removePoint(){}
  render(){
    fill(0);
    this.points.forEach((p) => {ellipse(p.x, p.y, 10, 10);})
  }
}

function mouseClicked(){
  let x = mouseX - 240, y = mouseY - 200;
  if(Math.pow(x, 2) + Math.pow(y, 2) < 40000){
    figSet.addPoint(x, y);
    console.log(x.toString() + "," + y.toString());
    return;
  }
  return;
}
