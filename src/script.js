'use strict';
/*
 step1: 円を表示する
 step2: クリックした場所に円を描く（直径はとりあえず10でいい）
 step3: クリックで点を排除できるようにする。
 step3.1: 点を追加するモードと点を削除するモードの切り替えができるようにし、
          点を削除するモードの時はクリックしても点が追加されないようにする。
 step3.2: 点を削除するメソッドを追加する。
 step4: 線を引く・・点を二つ選んでそれらを結ぶ直線が追加されるようにする。
        ここは点から線への参照が欲しいところ。もちろん線から点への参照も。
        重複して直線が登録されないようにする工夫が必要。

 arc関数の復習：(中心のx, 中心のy, 横幅、縦幅、始端角度、終端角度). あとはnoFillにしといてね。
 角度ごちゃごちゃするのやめた。どうせ黒だから円弧でいいや。

 step4.1: 点をクリックすると赤くなる
 step4:2: 他の点をクリックすると赤い点とその点を結ぶ直線が追加される。
 step4.3: 赤い点が固定されてるうちは他の点をクリックするたびに直線が追加される。
 step4.4: 赤い点をクリックするとキャンセルになり赤い点を選ぶところからやり直し。
 step4.5: 他のモードに変更すると点が赤いのとかリセットになる。
 step5: 線を消す・・点と直線の距離の公式（ポアンカレ平面版）を使って消す。その上の点とかは残る。
        参照も消さないといけない。
 step6: 線上に点を打つ。直線の上に点を追加するということ。
 step7: 直線上の点をドラッグドロップで移動できるようにしたい。
 step8: 点をドラッグドロップして、その点と他の点とを結ぶ直線もいっしょに動くようにしたい。

 んー、removeの際にも、いったん選択した点が赤くなって、それから消すようにした方がいいかも。うっかり消して
 しまわないように。人的ミスを考慮するみたいな。で、赤い時にもっかいクリックで消去。
*/
let figSet;
let drawMode = 0;
let button_off = [];
let button_on = [];
const buttonPos = [{x:-210, y:210}, {x:-210, y:270}, {x:-210, y:330}, {x:-210, y:390}];
const MaxButtonId = 3;

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
    this.lines = [];
    this.activePointId = -1; // activeになってる点のid.
  }
  addPoint(x, y){
    // (x, y)は位置、activeは赤くなる、connectedLinesは直線のidを入れる。
    this.points.push({x:x, y:y, active:false, connectedLines:[]});
  }
  addLine(type, info){
    // activePointIdとidの間に直線を追加する。中心とangleの範囲の組が追加されることになる予定・・
    // connectedPointsは接続している点のidを入れる。
    // typeは'arc'か'line'. 'arc'の場合のinfoは中心と半径(cx, cy, r)、'line'の場合のinfoは両端の座標(x1, y1, x2, y2).
    if(type === 'arc'){
      this.lines.push({type:type, info:info, connectedPoints:[]});
    }
  }
  removePoint(x, y){
    // (x, y)に最も近い点を探す
    // その点との距離が5以下ならその点を削除する
    let id = this.calcClosestPoint(x, y);
    if(id < 0){ return; } // 点が存在しない時、これがないとエラーになる。
    let distPow2 = Math.pow(this.points[id].x - x, 2) + Math.pow(this.points[id].y - y, 2);
    if(distPow2 > 25){ return; }
    this.points.splice(id, 1); // 該当する点を削除
  }
  inActivate(){
    // activeをキャンセル
    if(this.activePointId >= 0){ this.points[this.activePointId].active = false; }
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
    }else if(drawMode === 2){
      // 選択した点がactiveでなく、かつactiveな点がない→activeにする
      // 選択した点がactiveでなく、かつactiveな点が存在する→それらを結ぶ円弧または直線を追加
      // 選択した点がactive→activeを解除する
      return;
    }
  }else{
    x = mouseX - 30, y = mouseY - 410;
    if(x < 0 || x > 450 || y < 0 || y > 240){ return; }
    if((x % 150) > 120 || (y % 60) > 40){ return; }
    let buttonId = 4 * Math.floor(x / 150) + Math.floor(y / 60);
    if(drawMode === buttonId){ return; } // 同じモードになるときは何も起こらない。
    // モード切替の際にinActivate()して赤い点とか直線とかそういうのリセットする。
    drawMode = buttonId;
  }
  return;
}

function getClosestPointId(x, y){
  // (x, y)に最も近い点のidを取得して返す。点が存在しないか、あってもヒットしなければ-1を返す。
  let minDist = 160000;
  let id = -1;
  let pointSet = figSet.points;
  for(let i = 0; i < pointSet.length; i++){
    let distPow2 = Math.pow(pointSet[i].x - x, 2) + Math.pow(pointSet[i].y - y, 2);
    if(distPow2 < minDist){ minDist = distPow2; id = i; }
  }
  if(id < 0 || minDist > 25){ return -1; }
  return id;
}
