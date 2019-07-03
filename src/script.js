'use strict';

let figSet;
let button_off = [];
let button_on = [];
const RADIUS = 200; // 使うかも
const RADIUS_DOUBLE = 40000; // 使うかも
let buttonPos = [];
for(let i = 0; i < 10; i++){ buttonPos.push({x:200, y:40 * i - 200}); }
for(let i = 0; i < 10; i++){ buttonPos.push({x:320, y:40 * i - 200}); }
const MaxButtonId = 11;

function preload(){
  for(let i = 0; i < MaxButtonId; i++){
    button_off.push(loadImage("./assets/fig_" + i + "_off.png"));
    button_on.push(loadImage("./assets/fig_" + i + "_on.png"));
  }
}

function setup(){
  createCanvas(640, 400);
  colorMode(HSB, 100);
  figSet = new figureSet();
  //console.log(getHypoTranslate(1, 0, {x:200, y:0}));
}

function draw(){
  background(0);
  translate(200, 200);
  noStroke();
  fill(70);
  ellipse(0, 0, 400, 400);
  // translateモードは毎フレーム。
  if(figSet.getMode() === 4){ figSet.hyperbolicTranslateMethod(); }
  if(figSet.getMode() === 6){ figSet.rotateMethod(); }
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
      case 5:
        this.centeringMethod(x, y); return;
      case 7:
        this.addIntersectionMethod(x, y); return;
      case 8:
        this.addMiddlePointMethod(x, y); return;
      case 9:
        this.addNormalLineMethod(x, y); return;
      case 10:
        this.allClear(); return;
    }
  }
  addPoint(x, y){
    // (x, y)は位置、activeは赤くなる.
    // id値を設定して番号の更新が不要になるようにした。
    let newPoint = new hPoint(x, y);
    newPoint.setId(this.maxPointId);
    this.maxPointId += 2;
    this.points.push(newPoint);
    console.log("(" + x + ", " + y + ")");
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
  centeringMethod(x, y){
    // 指定した点が中央に来るようにtranslateが成される。これがあれば中央に点を置くメソッド要らないね・・
    let index = getClosestFigureIndex(x, y, this.points);
    if(index < 0){ return; }
    let p = this.points[index];
    this.hyperbolicTranslate(-p.x, -p.y);
  }
  inActivate(){
    // activeをキャンセル
    this.activePointIndex = -1;
    this.activeLineIndex = -1;
    this.points.forEach((p) => {p.inActivate();})
    this.lines.forEach((l) => {l.inActivate();})
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
  hyperbolicTranslateMethod(){
    // とりあえずxとyの方向に10, 20だけずらす実験するかな。
    if(!mouseIsPressed || mouseX > 400){ return; }
    let dx = mouseX - pmouseX, dy = mouseY - pmouseY;
    if(dx * dx + dy * dy > 40000){
      let norm = Math.sqrt(dx * dx + dy * dy);
      dx *= 199 / norm, dy *= 199 / norm;
    }
    this.hyperbolicTranslate(dx, dy);
  }
  hyperbolicTranslate(dx, dy){
    this.points.forEach((p) => {p.move(['t', dx, dy, 'end']);})
    this.lines.forEach((l) => {l.move(['t', dx, dy, 'end']);})
    //this.points.forEach((p) => {p.move([{type:'translate', info:{dx:dx, dy:dy}}]);})
    //this.lines.forEach((l) => {l.move([{type:'translate', info:{dx:dx, dy:dy}}]);})
  }
  rotateMethod(){
    // 回転（中心の右と左、それぞれについて、上下にドラッグしてそのように回転させる。）
    if(!mouseIsPressed || mouseX > 400){ return; }
    // dyを回転角に変換する。
    let dtheta = (mouseY - pmouseY) * 0.02;
    if(mouseX < 200){ dtheta = -dtheta; } // 左でドラッグした時は逆に回す。
    this.hyperbolicRotate(dtheta);
  }
  hyperbolicRotate(dtheta){
    this.points.forEach((p) => {p.move(['r', dtheta, 'end']);})
    this.lines.forEach((l) => {l.move(['r', dtheta, 'end']);})
    //this.points.forEach((p) => {p.move([{type:'rotate', info:{dtheta:dtheta}}]);})
    //this.lines.forEach((l) => {l.move([{type:'rotate', info:{dtheta:dtheta}}]);})
  }
  addIntersectionMethod(x, y){
    // クリックした直線がactiveになり、他の直線をクリックすることで交点が出現する
    let index = getClosestFigureIndex(x, y, this.lines);
    if(index < 0){ return; } // 直線が存在しない時、またはクリック位置に近い直線がない時。
    let l1 = this.lines[index]; // 該当する直線を抜き出す処理
    if(!l1.active){
      // l1がnon-activeのとき
      if(this.activeLineIndex < 0){
        // activeな直線がない時はその直線をactiveにしておしまい
        l1.activate();
        this.activeLineIndex = index;
        return;
      }else{
        // activeな直線があるときはその直線との交点が、あれば、追加。なければなにもしない。
        let l2 = this.lines[this.activeLineIndex];
        let p = getIntersection(l1, l2);
        if(p === undefined){ return; }
        //console.log("(" + p.x + ", " + p.y + ")");
        this.addPoint(p.x, p.y);
        return;
      }
    }else{
      // l1がactiveなときはそれを解除する(これがないと他の直線を選べない)
      l1.inActivate();
      //p.active = false;
      this.activeLineIndex = -1;
    }
  }
  addMiddlePointMethod(x, y){
    // 中点を取る処理。(ただし双曲距離)
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
        // activeな点があるときはその点との中点を追加する。んー・・無駄が多いね・・
        let q = this.points[this.activePointIndex];
        let mid = getMiddlePoint(p, q);
        this.addPoint(mid.x, mid.y);
        return;
      }
    }else{
      // pがactiveなときはそれを解除する(これがないと他の点を選べない)
      p.inActivate();
      //p.active = false;
      this.activePointIndex = -1;
    }
  }
  addNormalLineMethod(x, y){
    // クリックした直線がactiveになり、その状態で点をクリックすると垂線が追加される。
    // 線がactiveなときに点をクリックすると引かれるけど・・
    // 先に線をサーチしてそれがactiveならそれをinActivateするのを優先する。
    // そのうえで点の方をサーチして点が見つかれば垂線を引く感じ。
    // 違う、これだと点が反応してくれない。
    // クリックで反応する直線はactiveLineがない場合：すべて、ある場合：activeなやつだけ。
    // だからまずactiveLineIndexを見てこれが-1ならlineだけ見てactivateするか否か判断してreturn.
    // 次に>=0の場合はまず点を見てOKなら垂線を引いてreturn.
    // >=0で点がない場合、activeな線をクリックしているならそれをinActivateしてreturnだ。完璧！
    let lineIndex = getClosestFigureIndex(x, y, this.lines);
    let pointIndex = getClosestFigureIndex(x, y, this.points);
    if(lineIndex < 0 && pointIndex < 0){ return; }
    if(this.activeLineIndex < 0){
      // activeな線がないので、線にヒットしてればそれをactivateする, やることはそれだけ。
      if(lineIndex >= 0){
        let l = this.lines[lineIndex];
        l.activate();
        this.activeLineIndex = lineIndex;
      }
      return;
    }
    let l = this.lines[this.activeLineIndex];
    if(pointIndex >= 0){
      // 垂線を引く。
      let p = this.points[pointIndex];
      let normal = getNormal(p, l);
      this.addLine(normal.p, normal.q);
      return;
    }else{
      // 点にヒットしていない時はactiveな線にヒットしてればそれを戻すし、さもなくばすることは何もない。
      if(lineIndex === this.activeLineIndex){
        l.inActivate();
        this.activeLineIndex = -1;
        return;
      }
    }
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
  allClear(){
    // 円内をクリックするとすべての図形が消え失せる
    this.points = [];
    this.lines = [];
  }
}

function drawConfig(){
  fill(70);
  rect(200, -200, 240, 400);
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
  let x = mouseX - 200, y = mouseY - 200;
  if(Math.pow(x, 2) + Math.pow(y, 2) < 40000){
    // 各種描画処理
    let mode = figSet.getMode();
    if(mode !== 4 && mode !== 6){ figSet.execute(x, y); }
  }else{
    // コンフィグ処理（モード変更処理）
    x = mouseX - 400, y = mouseY;
    if(x < 0 || x > 240 || y < 0 || y > 400){ return; }
    let buttonId = 10 * Math.floor(x / 120) + Math.floor(y / 40);
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
  if(index < 0 || minDist > 15){ return -1; }
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
  if(abs(det) < 0.00000001){ // ここは悩みどころ・・でもまあ、いいか・・
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
// 図形（点と直線、今んとこ。）。円も描いてみたいけど。

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
  move(seq){
    hypoMove(seq, this);
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
  regenerate(){
    // generatorが更新された際に、その情報を使ってtypeとinfoを再設定する。
    let newData = getHypoLine(this.generator.p, this.generator.q);
    this.type = newData.type;
    this.info = newData.info;
  }
  move(seq){
    // generatorをいじってからregenerate.
    hypoMove(seq, this.generator.p);
    hypoMove(seq, this.generator.q);
    this.regenerate();
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
// 線については、generatorを変換してもっかい直線を生成する。
function hypoTranslate(dx, dy, p){
  // dx = mouseX - pmouseX, dy = mouseY - pmouseYだけ中心点が動く、
  // それによる双曲平面の平行移動により、p(.x, .yをもつ)がどうなるかを調べて{x:, y:}を返す。
  // 一次変換の式は40000 * (dx + idy + p.x + ip.y) / (40000 + (dx + idy)*(p.x - ip.y)).
  // ただし、マウスを早く動かしすぎて外に出ることが無いように、
  // 絶対値が200を越えるようならその絶対値で割って199を掛けるとかしようね。
  let n = 40000;
  let a = p.x + dx, b = p.y + dy, c = p.x * dx + p.y * dy, d = p.y * dx - p.x * dy;
  let divider = (n + c) * (n + c) + d * d;
  p.x = n * (n * a + (a * c + b * d)) / divider;
  p.y = n * (n * b + b * c - a * d) / divider;
}

function hypoRotate(dtheta, p){
  // dthetaだけ回転させる、pを。普通の回転。
  let x = p.x, y = p.y;
  p.x = x * Math.cos(dtheta) - y * Math.sin(dtheta);
  p.y = x * Math.sin(dtheta) + y * Math.cos(dtheta);
}

// シークエンスで書くならこちら。
// 書き直し。たとえば['t', 20, 30, 'r', 0.5, 'end']なら(20, 30)だけtranslateしてから0.5radianだけrotate.わかる？
function hypoMove(seq, p){
  // データに基づいて然るべく変換を施す。't':translate, 'r':rotate.
  let index = 0;
  while(seq[index] !== 'end'){
    if(seq[index] === 't'){
      hypoTranslate(seq[index + 1], seq[index + 2], p);
      index += 3;
      continue;
    }
    if(seq[index] === 'r'){
      hypoRotate(seq[index + 1], p);
      index += 2;
      continue;
    }
  }
  /*
  for(let i = 0; i < dataSet.length; i++){
    let m = dataSet[i];
    if(m.type === 'translate'){ hypoTranslate(m.info.dx, m.info.dy, p); }
    if(m.type === 'rotate'){ hypoRotate(m.info.dtheta, p); }
  }*/
}

function getIntersection(l1, l2){
  // 2直線l1, l2の交点として{x:x, y:y}を返す。
  // 具体的には、まずl1のgeneratorのpのpx, pyを記録しておいて、これは最後に使う。
  // l1, l2のコピーを用意する。
  // -px, -pyだけそれらをmoveしたものを用意する。これでl1の方が原点を通る直線になる。
  // さらにこのときのqx, qyについてqyが0でないなら回転も施す。こうして得られる変換を、
  // l1, l2双方のgeneratorに施して二つの直線を作る。と、l1側がx軸になるから計算しやすくなる。
  let dx, dy, dtheta;
  let genSet = [];
  // generatorに相当する点を4つ。
  genSet.push({x:l1.generator.p.x, y:l1.generator.p.y});
  genSet.push({x:l1.generator.q.x, y:l1.generator.q.y});
  genSet.push({x:l2.generator.p.x, y:l2.generator.p.y});
  genSet.push({x:l2.generator.q.x, y:l2.generator.q.y});
  dx = genSet[0].x, dy = genSet[0].y;
  // l1.generator.pが原点に来るように全体をtranslate.
  genSet.forEach((p) => {
    hypoTranslate(-dx, -dy, p);
  })
  dtheta = atan2(genSet[1].y, genSet[1].x);
  // l1.generator.qがx軸上にくるように全体をrotate.
  genSet.forEach((p) => {
    hypoRotate(-dtheta, p);
  })
  // このときcopyl1、つまり動かしたl1はx軸になっているので、それとcopyl2で議論すればいい。
  let copyl1 = new hLine(genSet[0], genSet[1]);
  let copyl2 = new hLine(genSet[2], genSet[3]);
  let x;
  let y = 0;
  if(copyl2.type === 'line'){
    // 双方直線なら原点。
    x = 0;
  }else{
    let a = copyl2.info.cx, b = copyl2.info.cy, r = copyl2.info.diam / 2;
    let x1 = a + Math.sqrt(r * r - b * b);
    let x2 = a - Math.sqrt(r * r - b * b);
    // ここでバリデーション. なお交点が2つ以上できることはない。
    if(abs(x1) < 200){ x = x1; }else if(abs(x2) < 200){ x = x2; }else{ return undefined; }
  }
  let is = {x:x, y:y}; // intersection.
  // 回転とtranslateを逆に施す。
  hypoMove(['r', dtheta, 't', dx, dy, 'end'], is);
  return is;
}

function getMiddlePoint(p, q){
  // pとqの中点。pが原点でqがx軸上の場合は、qの絶対値をrとして中点を同じ軸上に取れる。
  // rから計算される然るべき値をq.xと同じ符号で返すだけ。
  // 一般の場合は、然るべく全体をtranslateするだけ。
  let pSet = [{x:p.x, y:p.y}, {x:q.x, y:q.y}];
  let dx, dy, dtheta;
  dx = pSet[0].x, dy = pSet[0].y;
  pSet.forEach((p) => {
    hypoTranslate(-dx, -dy, p);
  })
  dtheta = atan2(pSet[1].y, pSet[1].x);
  pSet.forEach((p) => {
    hypoRotate(-dtheta, p);
  })
  let r = pSet[1].x;
  let x = 200 * (Math.sqrt(200 + r) - Math.sqrt(200 - r)) / (Math.sqrt(200 + r) + Math.sqrt(200 - r));
  let mid = {x:x, y:0};
  hypoMove(['r', dtheta, 't', dx, dy, 'end'], mid);
  return mid;
}

// 全部この辺、一次分数変換でいい気がするな・・

function getNormal(p, l){
  // pを通りlに垂直に交わる直線を取得する。
  // ほんと同じこと何度もやってるからリファクタリングしないとやばい、とはいえまあ、とりあえず。
  // いつものようにlのgeneratorをいじってlがx軸になるようにする。
  // それによりpが動く、そこからさらに今回はpのx座標の分だけマイナスしてy軸上に持ってくる。
  // そのときのy軸に相当する直線が（generator(0, ±100)とでもすればいい）求める垂線なので、
  // あとはそれを引き戻すだけ～。
  // ごめんなさい。duの計算が間違ってますね・・
  // 原点をx軸負方向に動かす距離を、垂線に関わる点がそれによってy軸上に来る分だけ動かすので、
  // そのEuclid距離を計算しないといけないのでした。ぎゃーす。
  let pSet = [{x:p.x, y:p.y}, {x:l.generator.p.x, y:l.generator.p.y}, {x:l.generator.q.x, y:l.generator.q.y}];
  let dx, dy, dtheta, du;
  dx = pSet[1].x, dy = pSet[1].y;
  pSet.forEach((p) => {
    hypoTranslate(-dx, -dy, p);
  })
  dtheta = atan2(pSet[2].y, pSet[2].x);
  pSet.forEach((p) => {
    hypoRotate(-dtheta, p);
  })
  // du = pSet[0].x; // ここがミスってる箇所。
  // 2次方程式の解・・これでいいのか？？一応小さい方を取った。
  let u = pSet[0].x, v = pSet[0].y;
  if(abs(u) > 0){
    let h = 40000 + u * u + v * v;
    du = (h - Math.sqrt(h * h - 4 * 40000 * u * u)) / (2 * u);
  }else{
    du = 0;
  }
  pSet.forEach((p) => { hypoTranslate(-du, 0, p); })
  let gp = {x:0, y:100}, gq = {x:0, y:-100};
  let command = ['t', du, 0, 'r', dtheta, 't', dx, dy, 'end']
  hypoMove(command, gp);
  hypoMove(command, gq);
  return {p:gp, q:gq};
}
