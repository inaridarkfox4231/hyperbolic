'use strict';

let figSet;
let button_off = [];
let button_on = [];
const buttonPos = [{x:-210, y:210}, {x:-210, y:270}, {x:-210, y:330}, {x:-210, y:390}, {x:-60, y:210}];
const MaxButtonId = 5;

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
  console.log(getHypoTranslate(1, 0, {x:200, y:0}));
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
    this.activePointIndex = -1; // activeになってる点のindex.(activePointIndexの方がいいかも)
    this.activeLineIndex = -1;  // activeになってる直線のindex.(あれ・・idとどっちがいいんだろ・・)
    this.maxPointId = 0; // 次に設定する点のid値(偶数)
    this.maxLineId = 1; // 次に設定する直線のid値(奇数)
  }
  getMode(){ return this.drawMode; }
  setMode(newMode){
    if(newMode === this.drawMode){ return; }
    // activeとか解除する。
    this.inActivate();
    this.drawMode = newMode;
  }
  execute(x, y){
    switch(this.drawMode){
      case 0:
        this.addPoint(x, y); return;
      case 1:
        this.removePointMethod(x, y); return;
      case 2:
        this.addLineMethod(x, y); return;
      case 3:
        this.removeLineMethod(x, y); return;
      case 4:
        this.hyperbolicTranslate(); return;
    }
  }
  addPoint(x, y){
    // (x, y)は位置、activeは赤くなる.
    // id値を設定して番号の更新が不要になるようにした。
    let newPoint = new hPoint(x, y);
    newPoint.setId(this.maxPointId);
    this.maxPointId += 2;
    this.points.push(newPoint);
    console.log("(" + x.toString() + ", " + y.toString() + ")");
  }
  removePointMethod(x, y){
    // (x, y)に最も近い点を探す
    // その点との距離が15以下ならその点を削除する
    let index = getClosestFigureIndex(x, y, this.points);
    if(index < 0){ return; } // 点が存在しない時、またはクリック位置に点がない時。
    let p = this.points[index]; // 該当する点を抜き出す処理
    if(!p.active){
      p.activate();
      //p.active = true;
      if(this.activePointIndex >= 0){ this.points[this.activePointIndex].active = false; }
      this.activePointIndex = index;
    }else{
      this.removePoint(p.id); // id値が'id'の点を削除
      //this.points.splice(id, 1); // 該当する点を削除
      this.activePointIndex = -1;
    }
  }
  removePoint(id){
    let index = this.getPointIndexById(id);
    if(index >= 0){ this.points.splice(index, 1); }
  }
  addLineMethod(x, y){
    let index = getClosestFigureIndex(x, y, this.points);
    if(index < 0){ return; } // 点が存在しない時、またはクリック位置に点がない時。
    let p = this.points[index]; // 該当する点を抜き出す処理
    if(!p.active){
      // pがnon-activeのとき
      if(this.activePointIndex < 0){
        // activeな点がない時はその点をactiveにしておしまい
        p.activate();
        this.activePointIndex = index;
        return;
      }else{
        // activeな点があるときはその点とを結ぶ直線を引く
        let q = this.points[this.activePointIndex];
        this.addLine(p, q);
        return;
      }
    }else{
      // pがactiveなときはそれを解除する(これがないと他の点を選べない)
      p.inActivate();
      //p.active = false;
      this.activePointIndex = -1;
    }
  }
  addLine(p, q){
    // pとqを結ぶ直線を引く。
    // 円弧の場合は中心、直径、始端角度、終端角度を得る(cx, cy, diam, theta, phi)。
    // Euclid線分の場合は両端の座標(x1, y1, x2, y2)。
    // typeとinfoで、infoに先の情報を格納する。
    let newLine = new hLine(p, q);
    newLine.setId(this.maxLineId);
    this.maxLineId += 2;
    this.lines.push(newLine);
    console.log(newLine);
  }
  removeLineMethod(x, y){
    // 直線を消す。
    let index = getClosestFigureIndex(x, y, this.lines);
    //console.log(index);
    if(index < 0){ return; } // 直線が存在しない時、またはクリック位置に近い直線がない時。
    let l = this.lines[index]; // 該当する直線を抜き出す処理
    if(!l.active){
      l.activate();
      if(this.activeLineIndex >= 0){ this.lines[this.activeLineIndex].active = false; }
      this.activeLineIndex = index;
    }else{
      this.removeLine(l.id);
      this.activeLineIndex = -1;
    }
    //return;
  }
  removeLine(id){
    let index = this.getLineIndexById(id);
    if(index >= 0){ this.lines.splice(index, 1); }
  }
  inActivate(){
    // activeをキャンセル
    if(this.activePointIndex >= 0){
      this.points[this.activePointIndex].active = false;
      this.activePointIndex = -1;
    }
  }
  render(){
    push();
    this.points.forEach((p) => {
      // 点の描画
      p.render();
    })
    pop();
    push();
    noFill();
    stroke(0);
    strokeWeight(1.0);
    this.lines.forEach((l) => {
      // 円弧、又はEuclid線分の描画
      l.render();
    })
    pop();
  }
  hyperbolicTranslate(){
    // とりあえずxとyの方向に10, 20だけずらす実験するかな。
    this.points.forEach((p) => {p.move(1, 0); console.log("(" + p.x + ", " + p.y + ")");})
    this.lines.forEach((l) => {l.move(1, 0);})
  }
  getPointIndexById(id){
    // idから該当する点の通し番号を取得
    for(let index = 0; index < this.points.length; index++){
      if(this.points[index].id === id){ return index; }
    }
    return -1;
  }
  getLineIndexById(id){
    // idから該当する直線の通し番号を取得
    for(let index = 0; index < this.lines.length; index++){
      if(this.lines[index].id === id){ return index; }
    }
    return -1;
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
    // buttonIdがMaxButtonIdの場合はモードチェンジを呼び出す
    // それ以外の場合はたとえば線分モードとの切り替えとかに使うかも
    if(buttonId < MaxButtonId){ figSet.setMode(buttonId); }
  }
  return;
}

function getClosestFigureIndex(x, y, targetSet){
  // ひとつにまとめたい(targetSetに点の配列や直線の配列を入れる).
  if(targetSet.length === 0){ return -1; }
  let minDist = 400;
  let index = -1;
  for(let i = 0; i < targetSet.length; i++){
    let dist = targetSet[i].getDist(x, y);
    if(dist < minDist){ minDist = dist; index = i; }
  }
  if(index < 0 || minDist > 10){ return -1; }
  return index;
}

// lのところ、pとか、一般化するべきかな・・
function calcDist(l, x, y){
  let data = l.info;
  if(l.type === 'line'){
    // 点と直線の距離の公式で(x0, y0)と(x1, y1)を結ぶ直線との距離を出す。
    let norm_p = Math.sqrt(Math.pow(data.x0, 2) + Math.pow(data.y0, 2));
    let norm_q = Math.sqrt(Math.pow(data.x1, 2) + Math.pow(data.y1, 2));
    if(norm_p > 0){
      return abs(data.y0 * x - data.x0 * y) / norm_p;
    }else{
      return abs(data.y1 * x - data.x1 * y) / norm_q;
    }
  }else{
    // arcの場合は中心(cx, cy)との距離と半径との差の絶対値。
    let distCenter = Math.sqrt(Math.pow(data.cx - x, 2) + Math.pow(data.cy - y, 2));
    return abs(distCenter - (data.diam / 2));
  }
}

function getHypoLine(p, q){
  // OpenProcessingの方で作った、円弧やEuclid線分を取得するメソッドを移植する。
  // 円弧の場合は{type:'arc', info:{c: ,r: ,diam: ,theta: ,phi: }}って感じ。
  // Euclid線分の場合は{type:'line', info:{x0: ,y0: ,x1: ,y1: }}って感じで。
  let a = p.x, b = p.y, c = q.x, d = q.y;
  let det = a * d - b * c;
  if(det === 0){
    // 直線のケース
    let norm_p = a * a + b * b, norm_q = c * c + d * d;
    let x0, y0, x1, y1;
    if(norm_p > 0){
      x0 = 200 * a / Math.sqrt(norm_p); y0 = 200 * b / Math.sqrt(norm_p); x1 = -x0; y1 = -y0;
    }else{
      x0 = 200 * c / Math.sqrt(norm_q); y0 = 200 * d / Math.sqrt(norm_q); x1 = -x0; y1 = -y0;
    }
    return {type:'line', info:{x0:x0, y0:y0, x1:x1, y1:y1}};
  }
  // 円の中心と半径
  let cx = (d * (40000 + a * a + b * b) - b * (40000 + c * c + d * d)) / (2 * det);
	let cy = (a * (40000 + c * c + d * d) - c * (40000 + a * a + b * b)) / (2 * det);
	let diam = Math.sqrt(cx * cx + cy * cy - 40000) * 2;
  // 円と外周の交点の情報を取得
  let info = getCrossPoints(p, q);
  let angles = getEndAngle(cx, cy, info.z, info.w);
  return {type:'arc', info:{cx:cx, cy:cy, diam:diam, theta:angles.theta, phi: angles.phi}};
}

function getUpperPoint(p){
	// ポアンカレの方の点pに対応する上半平面の点を取得する
	let a = p.x / 200, b = p.y / 200;
	let n = Math.pow(1 - a, 2) + Math.pow(b, 2);
	return {x: -2 * b / n, y: (1 - a * a - b * b) / n};
}

function getCenterAndRadius(u, v){
	// 上半平面の2点u, vを通る直線の円としての中心と半径を取得する
	// ぶっささる場合はr:-1.
	let a = u.x, b = u.y, c = v.x, d = v.y;
	if(abs(a - c) === 0){ return {c:a, r:-1}; }
	let center = (a * a + b * b - c * c - d * d) / (2 * (a - c));
	let radius = Math.sqrt(a * a + b * b + center * center - 2 * a * center);
	return {c:center, r:radius};
}

function getCrossPoints(p, q){
	// ポアンカレモデル上の2点p, q（ただし原点を通る直線上にはない）に対し、
	// それらを通る円弧と外周の交点の座標を取得する。
	// 時計回りで小さい順。
	// そうだ、角度の情報もないとどっちからどっちかが指定できないんだった。
	let u = getUpperPoint(p);
	let v = getUpperPoint(q);
	let info = getCenterAndRadius(u, v);
	if(info.r < 0){
		return {z:{x:200, y:0, angle:0}, w:getPoincare(info.c)};
	}else{
		return {z:getPoincare(info.c - info.r), w:getPoincare(info.c + info.r)};
	}
}

function getPoincare(t){
	// 上半平面の実数tに対応するポアンカレモデル上の点の位置と角度を取得。
	let n = t * t + 1;
	return {x:200 * (t * t - 1) / n, y:200 * (-2 * t) / n, angle:2 * getAngle(-1, t)};
}

function getEndAngle(cx, cy, z, w){
	// (cx, cy)を中心としz, w（外周の点）を通る円弧のうち円に収まる部分を描画するための
	// 角度情報を与える。
	let theta = getAngle(z.y - cy, z.x - cx);
	let phi = getAngle(w.y - cy, w.x - cx);
	if(w.angle - z.angle > Math.PI){ return {theta:theta, phi:phi}; }
	else{ return {theta:phi, phi:theta}; }
}

function getAngle(y, x){
	// atan2の計算（0～2*PI）
	let angle = atan2(y, x);
	if(angle >= 0){ return angle; }
	else{ return angle + 2 * Math.PI; }
}

// ---------------------------------------------------- //
// 図形（点と直線、今んとこ。）。

// 双曲平面上の点
class hPoint{
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.id = -1;
    this.active = false;
  }
  setId(newId){ this.id = newId; }
  activate(){ this.active = true; }
  inActivate(){ this.active = false; }
  getDist(x, y){
    // (x, y)との距離を返す(Euclid距離)
    return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
  }
  move(dx, dy){
    let p = getHypoTranslate(dx, dy, this);
    this.x = p.x;
    this.y = p.y;
  }
  render(){
    // 点の描画
    if(this.active){ fill(0, 100, 100); }else{ fill(0); }
    ellipse(this.x, this.y, 10, 10);
  }
}

// 双曲平面上の直線
// generatorとしてp, qの情報を保存しといて、変換がかかったらそのp, qを移して新しくデータを計算し、
// typeとinfoはそこから取得して、idは変えないで、generatorは変換先でOK.
class hLine{
  constructor(p, q){
    let lineData = getHypoLine(p, q);
    this.type = lineData.type;
    this.info = lineData.info;
    this.id = -1;
    this.active = false;
    this.generator = {p:{x:p.x, y:p.y}, q:{x:q.x, y:q.y}}; // 作った時に使った点（位置情報オンリー）
  }
  setId(newId){ this.id = newId; }
  activate(){ this.active = true; }
  inActivate(){ this.active = false; }
  getDist(x, y){
    // (x, y)との距離を返す（なおEuclid距離である）
    let data = this.info;
    if(this.type === 'line'){
      // 点と直線の距離の公式で(x0, y0)と(x1, y1)を結ぶ直線との距離を出す。
      let norm_p = Math.sqrt(Math.pow(data.x0, 2) + Math.pow(data.y0, 2));
      let norm_q = Math.sqrt(Math.pow(data.x1, 2) + Math.pow(data.y1, 2));
      if(norm_p > 0){
        return abs(data.y0 * x - data.x0 * y) / norm_p;
      }else{
        return abs(data.y1 * x - data.x1 * y) / norm_q;
      }
    }else{
      // arcの場合は中心(cx, cy)との距離と半径との差の絶対値。
      let distCenter = Math.sqrt(Math.pow(data.cx - x, 2) + Math.pow(data.cy - y, 2));
      return abs(distCenter - (data.diam / 2));
    }
  }
  move(dx, dy){
    let p = getHypoTranslate(dx, dy, this.generator.p);
    let q = getHypoTranslate(dx, dy, this.generator.q);
    let newData = getHypoLine(p, q);
    this.type = newData.type;
    this.info = newData.info;
    this.generator = {p:p, q:q};
  }
  render(){
    // 円弧、又はEuclid線分の描画
    let data = this.info;
    if(this.active){ stroke(70, 100, 100); }else{ stroke(0); }
    if(this.type === 'line'){
      line(data.x0, data.y0, data.x1, data.y1);
    }else{
      arc(data.cx, data.cy, data.diam, data.diam, data.theta, data.phi);
    }
  }
}

// 点については、そのまま変換するだけ。
// 線については、generatorを・・なんか変だなこれ‥んー？
function getHypoTranslate(dx, dy, p){
  // dx = mouseX - pmouseX, dy = mouseY - pmouseYだけ中心点が動く、
  // それによる双曲平面の平行移動により、p(.x, .yをもつ)がどうなるかを調べて{x:, y:}を返す。
  // 一次変換の式は(dx + i * dy) * (z + r) / (r^2 * z + r) (ただしr = sqrt(dx^2 + dy^2.))(z = p.x + i * p.y)
  // ただし、マウスを早く動かしすぎて外に出ることが無いように、
  // 絶対値が200を越えるようならその絶対値で割って199を掛けるとかしようね。
  let u = p.x, v = p.y;
  let n = 40000;
  let a = u + dx, b = v + dy, c = u * dx + v * dy, d = v * dx - u * dy;
  let divider = (n + c) * (n + c) + d * d;
  console.log(divider);
  let x = n * (n * a + (a * c + b * d)) / divider;
  let y = n * (n * b + b * c - a * d) / divider;
  return {x:x, y:y};
}
