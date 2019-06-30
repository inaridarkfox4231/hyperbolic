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
 step4.3: 赤い点が固定されてるうちは他の点をクリックするたびに然るべく直線が追加される。
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
    this.drawMode = 0; // drawModeはこっちもちでいいんじゃない。
    this.activePointIndex = -1; // activeになってる点のid.(activePointIndexの方がいいかも)
    this.maxPointId = 0; // 次に設定する点のid値
    this.maxLineId = 0; // 次に設定する直線のid値
  }
  getMode(){ return this.drawMode; }
  setMode(newMode){ this.drawMode = newMode; }
  execute(x, y){
    switch(this.drawMode){
      case 0:
        this.addPoint(x, y); return;
      case 1:
        this.removePointMethod(x, y); return;
      case 2:
        this.addLineMethod(x, y); return;
    }
  }
  addPoint(x, y){
    // (x, y)は位置、activeは赤くなる.
    // id値を設定して番号の更新が不要になるようにした。
    this.points.push({x:x, y:y, id:this.maxPointId, active:false});
    this.maxPointId++;
    console.log(x.toString() + "," + y.toString());
  }
  removePointMethod(x, y){
    // (x, y)に最も近い点を探す
    // その点との距離が15以下ならその点を削除する
    let index = getClosestPointId(x, y);
    if(index < 0){ return; } // 点が存在しない時、またはクリック位置に点がない時。
    let p = this.points[index]; // 該当する点を抜き出す処理
    if(!p.active){
      p.active = true;
      if(this.activePointIndex >= 0){ this.points[this.activePointIndex].active = false; }
      this.activePointIndex = index;
    }else{
      this.removePoint(p.id); // id値が'id'の点を削除
      //this.points.splice(id, 1); // 該当する点を削除
      this.activePointIndex = -1;
    }
  }
  removePoint(id){
    for(let index = 0; index < this.points.length; index++){
      if(this.points[index].id === id){
        this.points.splice(index, 1);
        break;
      }
    }
  }
  addLineMethod(x, y){
    let index = getClosestPointId(x, y);
    if(index < 0){ return; } // 点が存在しない時、またはクリック位置に点がない時。
    let p = this.points[index]; // 該当する点を抜き出す処理
    if(!p.active){
      // pがnon-activeのとき
      if(this.activePointIndex < 0){
        // activeな点がない時はその点をactiveにしておしまい
        p.active = true;
        this.activePointIndex = index;
        return;
      }else{
        // activeな点があるときはその点とを結ぶ直線を引く
        let q = this.points[this.activePointIndex];
        addLine(p, q);
        return;
      }
    }else{
      // pがactiveなときはそれを解除する(これがないと他の点を選べない)
      p.active = false;
      this.activePointIndex = -1;
    }
  }
  addLine(p, q){
    // pとqを結ぶ直線を引く。
    // 円弧の場合は中心、直径、始端角度、終端角度を得る(cx, cy, diam, theta, phi)。
    // Euclid線分の場合は両端の座標(x1, y1, x2, y2)。
    // typeとinfoで、infoに先の情報を格納する。
    let newLine = calcLine(p, q);
    this.lines.push(newLine);
    this.maxLineId++;
  }
  inActivate(){
    // activeをキャンセル
    if(this.activePointIndex >= 0){ this.points[this.activePointIndex].active = false; }
  }
  render(){
    fill(0);
    this.points.forEach((p) => {
      if(p.active){ fill(0, 100, 100); }else{ fill(0); }
      ellipse(p.x, p.y, 10, 10);
    })
  }
}

function drawConfig(){
  fill(70);
  rect(-240, 200, 480, 240);
  for(let i = 0; i < MaxButtonId; i++){
    let mode = figSet.getMode();
    if(mode === i){
      image(button_on[i], buttonPos[i].x, buttonPos[i].y);
    }else{
      image(button_off[i], buttonPos[i].x, buttonPos[i].y);
    }
  }
}

function mouseClicked(){
  let x = mouseX - 240, y = mouseY - 200;
  if(Math.pow(x, 2) + Math.pow(y, 2) < 40000){
    // 各種描画処理
    figSet.execute(x, y);
  }else{
    // コンフィグ処理（モード変更処理）
    x = mouseX - 30, y = mouseY - 410;
    if(x < 0 || x > 450 || y < 0 || y > 240){ return; }
    if((x % 150) > 120 || (y % 60) > 40){ return; }
    let buttonId = 4 * Math.floor(x / 150) + Math.floor(y / 60);
    if(buttonId >= MaxButtonId){ return; }
    let mode = figSet.getMode(); // モード取得
    if(mode === buttonId){ return; } // 同じモードになるときは何も起こらない。
    figSet.inActivate(); // モード切替の際にinActivate()して赤い点とか直線とかそういうのリセットする。
    figSet.setMode(buttonId); // モード切替
  }
  return;
}

function getClosestPointId(x, y){
  // (x, y)に最も近い点のindex(points上の通し番号)を取得して返す。点が存在しないか、あってもヒットしなければ-1を返す。
  // 一応、半径の3倍まで反応するようにした。
  let pointSet = figSet.points;
  if(pointSet.length === 0){ return -1; }
  let minDist = 160000;
  let index = -1;
  for(let i = 0; i < pointSet.length; i++){
    let distPow2 = Math.pow(pointSet[i].x - x, 2) + Math.pow(pointSet[i].y - y, 2);
    if(distPow2 < minDist){ minDist = distPow2; index = i; }
  }
  if(index < 0 || minDist > 225){ return -1; }
  return index;
}

function calcLine(p, q){
  // OpenProcessingの方で作った、円弧やEuclid線分を取得するメソッドを移植する。
  // 円弧の場合は{type:'arc', info:{c: ,r: ,diam: ,theta: ,phi: }}って感じ。
  // Euclid線分の場合は{type:'line', info:{x1: ,y1: ,x2: ,y2: }}って感じで。
}
