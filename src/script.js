'use strict';

let figSet;
let button_off = [];
let button_on = [];

const RADIUS = 200; // 使うかも
const RADIUS_DOUBLE = 40000; // 使うかも
const RADIUS_QUAD = 1600000000; // 使ってます
const FigureKind = 3; // 点と線の2種類という意味、これをidに加算することで、idを見て種類を判別できる。
// 3にした。4になるかは今の所未定。他に図形あるかな・・
let buttonPos = [];
for(let i = 0; i < 10; i++){ buttonPos.push({x:200, y:40 * i - 200}); }
for(let i = 0; i < 10; i++){ buttonPos.push({x:320, y:40 * i - 200}); }
const MaxButtonId = 11;
const DRAW_POINT = 0;
const DRAW_LINE = 1;
const DRAW_CIRCLE = 2;
const REMOVE_FIG = 3;
const TRANS_LATE = 4;
const RO_TATE = 5;
const INTER_SECTION = 6;
const MIDDLE_POINT = 7;
const DRAW_NORMAL = 8;
const ALL_CLEAR = 9;
const SYM_METRIC = 10;

function preload(){
  for(let i = 0; i < MaxButtonId; i++){
    button_off.push(loadImage("./assets/fig_" + i + "_off.png"));
    button_on.push(loadImage("./assets/fig_" + i + "_on.png"));
    //button_off.push(loadImage("https://inaridarkfox4231.github.io/hyperbolic_config/fig_" + i + "_off.png"));
    //button_on.push(loadImage("https://inaridarkfox4231.github.io/hyperbolic_config/fig_" + i + "_on.png"));
  }
}

function setup(){
  createCanvas(640, 400);
  colorMode(HSB, 100);
  figSet = new figureSet();
}

function draw(){
  background(0);
  translate(200, 200);
  noStroke();
  fill(70);
  ellipse(0, 0, 400, 400);
  // translateモードは毎フレーム。
  if(figSet.getMode() === TRANS_LATE){ figSet.hyperbolicTranslateMethod(); }
  if(figSet.getMode() === RO_TATE){ figSet.hyperbolicRotateMethod(); }
  figSet.render();
  drawConfig();
}

class figureSet{
  constructor(){
    // ここをfiguresにして、点の個数を持たせる。で、点を追加するときは途中に挿入する。
    // this.figures.splice('点の個数', 0, '追加する点オブジェクト')でOK.
    // ちなみに0のところを1以上のmにするとそこからm個が配列の形で返り値として送出され、
    // それらが排除されてそこにobjが入る。複数入れるときは...[a, b, c]みたいにする。
    // mが大きすぎるときは末尾までに切り詰められる。
    // 例：a=[0, 1, 2, 3, 4]; a.splice(2, 2, ...[99, 100]); 返り値：[2, 3]でaは[0, 1, 99, 100, 4]になる。
    this.figures = [];
    this.maxPointIndex = 0;
    this.drawMode = 0; // drawModeはこっちもちでいいんじゃない。
    // ここをactiveFigureIdにしたいんだけどな。
    this.activeFigureId = -1;
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
      case DRAW_POINT: // 点を追加
        this.addPoint(x, y); return;
      case DRAW_LINE: // 直線を引く
        this.clickMethod(x, y, [0], [[0], [], []]); return;
      case DRAW_CIRCLE: // 円を描く
        this.clickMethod(x, y, [0], [[0], [], []]); return;
      case REMOVE_FIG: // 図形を削除
        this.clickMethod(x, y, [0, 1, 2], [[0, 1, 2], [0, 1, 2], [0, 1, 2]]); return;
      case TRANS_LATE: // translateモードで点をクリックするとその点がセンタリングされる
        this.centeringMethod(x, y); return;
      case RO_TATE: // rotateモードで点をクリックするとその点がx軸正方向に来るように回転する。
        this.normalizeRotateMethod(x, y); return;
      case INTER_SECTION: // 線と線の交点
        this.clickMethod(x, y, [1, 2], [[], [1, 2], [1, 2]]); return;
      case MIDDLE_POINT: // 点と点の中点
        this.clickMethod(x, y, [0], [[0], [], []]); return;
      case DRAW_NORMAL: // 点を通り線に垂直に交わる直線の追加
        this.clickMethod(x, y, [0, 1], [[1], [0], []]); return;
      case ALL_CLEAR: // 全削除
        this.allClear(); return;
      case SYM_METRIC: // 対称移動
        this.clickMethod(x, y, [0, 1], [[0, 1, 2], [0, 1, 2], []]); return;
    }
  }
  clickMethod(x, y, activateFigureKindArray, actionPatternArray){
    // activateFigureKindArray: 最初にクリックする図形の種類(0, 1, ...)
    // actionPatternArray: 配列の配列、その図形がactiveになってる時にクリックできる図形の種類
    let id = this.getClosestFigureId(x, y); // ここは共通
    if(id < 0){
      this.inActivate(); return; // 何もないところをクリックするとキャンセル。これが共通の処理。
    }
    let index = this.getIndexById(id); // indexを取得
    let fig = this.figures[index]; // 図形objectを取得
    if(this.activeFigureId < 0){
      // 場がactiveでないときは然るべきバリデーションをかけたうえでクリックした図形をactivate.
      // たとえば[0]とか[0, 1]みたいなやつ。
      if(activateFigureKindArray.indexOf(id % FigureKind) < 0){ return; }
      fig.activate();
      this.activeFigureId = id;
    }else{
      if(this.activeFigureId === id){
        // activeなものをクリックしたときの処理。
        this.activeClickMethod(fig); // ここから先はdrawModeで分ける。
      }else{
        // activeでないものをクリックしたときの処理。バリデーションを掛ける。
        // たとえばintersectionの場合は[[1], [0]]みたいになる。
        if(actionPatternArray[this.activeFigureId % FigureKind].indexOf(id % FigureKind) < 0){ return; }
        let activeFigureIndex = this.getIndexById(this.activeFigureId);
        let activeFigure = this.figures[activeFigureIndex];
        this.nonActiveClickMethod(activeFigure, fig); // ここから先はdrawModeで分ける。
      }
    }
  }
  activeClickMethod(fig){
    // 今んとこ削除とキャンセルしかない感じ。
    if(this.drawMode === REMOVE_FIG){
      this.removeFigure(fig.id);
    }else{
      fig.inActivate();
    }
    this.activeFigureId = -1;
  }
  nonActiveClickMethod(fig1, fig2){
    // fig1がactiveな方。いろいろ。
    switch(this.drawMode){
      case DRAW_LINE:
        // 線を引く
        this.addLine(fig1, fig2);
        return;
      case DRAW_CIRCLE:
        // 円を追加
        this.addCircle(fig1, fig2);
        return;
      case REMOVE_FIG:
        // スイッチ。fig2がactiveになる
        fig1.inActivate();
        fig2.activate();
        this.activeFigureId = fig2.id;
        return;
      case INTER_SECTION:
        // 2直線の交点を追加
        let kind1 = fig1.id % FigureKind;
        let kind2 = fig2.id % FigureKind;
        if(kind1 === 1 && kind2 === 1){
          let is = getIntersectionLineAndLine(fig1, fig2);
          if(is === undefined){ return; }
          this.addPoint(is.x, is.y);
        }else if(kind1 === 1 || kind2 === 1){
          let isSet = [];
          if(kind1 === 1){
            isSet = getIntersectionLineAndCircle(fig1, fig2);
          }else{
            isSet = getIntersectionLineAndCircle(fig2, fig1);
          }
          if(isSet.length === 0){ return; }
          isSet.forEach((p) => { this.addPoint(p.x, p.y); })
        }else{
          let isSet = getIntersectionCircleAndCircle(fig1, fig2);
          if(isSet.length === 0){ return; }
          isSet.forEach((p) => { this.addPoint(p.x, p.y); })
        }
        return;
      case MIDDLE_POINT:
        // 2点の中点を追加
        let mid = getMiddlePoint(fig1, fig2);
        this.addPoint(mid.x, mid.y);
        return;
      case DRAW_NORMAL:
        // 垂線を追加
        let normal;
        // どっちが点なのか判断している。
        if(fig1.id % FigureKind === 0){ normal = getNormal(fig1, fig2); }
        else{ normal = getNormal(fig2, fig1); }
        this.addLine(normal.p, normal.q);
        return;
      case SYM_METRIC:
        // fig1に関してfig2と対称なオブジェクトを追加
        this.addSymmetricFigure(fig1, fig2);
        return;
    }
  }
  addPoint(x, y){
    // (x, y)は位置、activeは赤くなる.
    // id値を設定して番号の更新が不要になるようにした。
    let newPoint = new hPoint(x, y);
    newPoint.setId();
    this.figures.splice(this.maxPointIndex, 0, newPoint); // 点は必ず直線の前にしたい。
    this.maxPointIndex++;
    console.log("(" + x + ", " + y + ")");
    console.log('pointId = ' + newPoint.id);
  }
  removeFigure(id){
    // 図形を排除する（点の場合はthis.maxPointIndexを減らす）
    if(id < 0){ return; }
    let index = this.getIndexById(id);
    this.figures.splice(index, 1); // indexのところにあるオブジェクトを排除
    if(id % FigureKind === 0){ this.maxPointIndex--; } // 点を排除した場合はその数を減らす
  }
  addLine(p, q){
    // pとqを結ぶ直線を引く。
    // 円弧の場合は中心、直径、始端角度、終端角度を得る(cx, cy, diam, theta, phi)。
    // Euclid線分の場合は両端の座標(x1, y1, x2, y2)。
    // typeとinfoで、infoに先の情報を格納する。
    let newLine = new hLine(p, q);
    newLine.setId();
    //this.maxLineId += 2;
    this.figures.push(newLine);
    console.log('lineId = ' + newLine.id);
  }
  addCircle(c, p){
    // c中心、pを通る円を追加する。
    let newCircle = new hCircle(c, p);
    newCircle.setId();
    this.figures.push(newCircle);
    console.log('circleId = ' + newCircle.id);
  }
  inActivate(){
    // activeをキャンセル. activeなのは高々1つ。
    if(this.activeFigureId < 0){ return; } // non-activeならやることなし。
    let activeFigureIndex = this.getIndexById(this.activeFigureId);
    this.figures[activeFigureIndex].inActivate();
    this.activeFigureId = -1;
  }
  render(){
    push();
    noFill();
    stroke(0);
    strokeWeight(1.0);
    // 直線と円の描画
    for(let i = this.maxPointIndex; i < this.figures.length; i++){
      this.figures[i].render();
    }
    pop();
    // 直線や円を描いてから点を描きたいのよね。あれ、そうなるとmaxPointIndex要らないじゃん？あ、要るか。
    // ただ後ろに追加するという意味では・・んー。逆にすべきかもね。
    push();
    // 点の描画
    for(let i = 0; i < this.maxPointIndex; i++){ this.figures[i].render(); }
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
    this.figures.forEach((fig) => {fig.move(['t', dx, dy, 'end']);})
  }
  centeringMethod(x, y){
    // 指定した点が中央に来るようにtranslateが成される。translateモードで点をクリックすると発動する。
    let id = this.getClosestFigureId(x, y);
    if(id < 0 || !(id % FigureKind === 0)){ return; }
    let index = this.getIndexById(id);
    let p = this.figures[index];
    this.hyperbolicTranslate(-p.x, -p.y);
  }
  hyperbolicRotateMethod(){
    // 回転（中心の右と左、それぞれについて、上下にドラッグしてそのように回転させる。）
    // 機能追加。点をクリックするとその点がx軸正方向に来るように回転する。mouseReleasedが使えそう。
    if(!mouseIsPressed || mouseX > 400){ return; }
    // dyを回転角に変換する。
    let dtheta = (mouseY - pmouseY) * 0.02;
    if(mouseX < 200){ dtheta = -dtheta; } // 左でドラッグした時は逆に回す。
    this.hyperbolicRotate(dtheta);
  }
  hyperbolicRotate(dtheta){
    this.figures.forEach((fig) => {fig.move(['r', dtheta, 'end']);})
  }
  normalizeRotateMethod(x, y){
    // 指定した点がx軸正方向にくるように回転. rotateモードで点をクリックすると発動する。
    let id = this.getClosestFigureId(x, y);
    if(id < 0 || !(id % FigureKind === 0)){ return; }
    let index = this.getIndexById(id);
    let p = this.figures[index];
    let dtheta = atan2(p.y, p.x);
    this.hyperbolicRotate(-dtheta);
  }
  addSymmetricFigure(f1, f2){
    let kind_1 = f1.id % FigureKind;
    let kind_2 = f2.id % FigureKind;
    if(kind_1 > 1 || kind_2 > 2){ return; }
    let symFig;
    // 4つの場合に分ける。
    if(kind_1 === 0){
      // 点対称
      if(kind_2 === 0){ symFig = getSymmetricPointWithPoint(f1, f2); }
      else if(kind_2 === 1){ symFig = getSymmetricLineWithPoint(f1, f2); }
      else{ symFig = getSymmetricCircleWithPoint(f1, f2); }
    }else{
      // 線対称
      if(kind_2 === 0){ symFig = getMirrorPointWithLine(f1, f2); }
      else if(kind_2 === 1){ symFig = getMirrorLineWithLine(f1, f2); }
      else{ symFig = getMirrorCircleWithLine(f1, f2); }
    }
    if(kind_2 === 0){
      this.addPoint(symFig.x, symFig.y);
    }else if(kind_2 === 1){
      this.addLine(symFig.p, symFig.q);
    }else{
      this.addCircle(symFig.c, symFig.p);
    }
  }
  getClosestFigureId(x, y){
    // クリック位置に最も近いオブジェクトのidを返す。点が優先。
    if(this.figures.length === 0){ return -1; }
    let minPointDist = 400; // 一番近くの点との距離
    let minOtherDist = 400; // 一番近くの直線、円との距離
    let pointId = -1;
    let otherId = -1;
    for(let i = 0; i < this.maxPointIndex; i++){
      let p = this.figures[i];
      let dist = p.getDist(x, y);
      if(dist < minPointDist){ minPointDist = dist; pointId = p.id; }
    }
    for(let i = this.maxPointIndex; i < this.figures.length; i++){
      let fig = this.figures[i];
      let dist = fig.getDist(x, y);
      if(dist < minOtherDist){ minOtherDist = dist; otherId = fig.id; }
    }
    if(pointId >= 0 && minPointDist <= 15){ return pointId; } // 点を先に判定、OKなら返す。
    if(otherId >= 0 && minOtherDist <= 10){ return otherId; } // 直線、円を次に判定、OKなら返す。
    // 点→直線、円、という判定順。
    return -1;
  }
  getIndexById(id){
    // idからindexを取得。そうか、idってばらばらだっけ。総当たりでいいです。
    for(let index = 0; index < this.figures.length; index++){
      if(this.figures[index].id === id){ return index; }
    }
    return -1;
  }
  allClear(){
    // 円内をクリックするとすべての図形が消え失せる(activeはこのモードにしたとき既に外れている)
    this.figures = [];
    this.maxPointIndex = 0;
    // idリセット
    hPoint.id = 0;
    hLine.id = 1;
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
    // translateとrotateのときの処理も追加したのでバリデーションは廃止。
    figSet.execute(x, y);
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

// ------------------------------------------- //
// 双曲直線を取得する関数群

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

// 基底クラス、作るかー？
class hFigure{
  constructor(){
    this.id = -1;
    this.active = false;
  }
  setId(){} // id設定
  activate(){ this.active = true; }
  inActivate(){ this.active = false; }
  getDist(x, y){} // 距離計算メソッド
  move(seq){} // seqに応じた位置変更メソッド
  render(){} // 描画メソッド
}

// 双曲平面上の点
class hPoint extends hFigure{
  constructor(x, y){
    super();
    this.x = x;
    this.y = y;
  }
  setId(){ this.id = hPoint.id; hPoint.id += FigureKind; }
  getDist(x, y){
    // (x, y)との距離を返す(Euclid距離)
    return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
  }
  move(seq){
    hypoMove(seq, this);
  }
  render(){
    // 点の描画
    if(this.active){ fill(0, calcAlpha()); }else{ fill(0); }
    ellipse(this.x, this.y, 10, 10);
  }
}

// 双曲平面上の直線
// generatorとしてp, qの情報を保存しといて、変換がかかったらそのp, qを移して新しくデータを計算し、
// typeとinfoはそこから取得して、idは変えないで、generatorは変換先でOK.
class hLine extends hFigure{
  constructor(p, q){
    super();
    let lineData = getHypoLine(p, q);
    this.type = lineData.type;
    this.info = lineData.info;
    this.generator = {p:{x:p.x, y:p.y}, q:{x:q.x, y:q.y}}; // 作った時に使った点（位置情報オンリー）
  }
  setId(){ this.id = hLine.id; hLine.id += FigureKind; }
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
    if(this.active){ stroke(0, calcAlpha()); }else{ stroke(0); }
    if(this.type === 'line'){
      line(data.x0, data.y0, data.x1, data.y1);
    }else{
      arc(data.cx, data.cy, data.diam, data.diam, data.theta, data.phi);
    }
  }
}

// ロバチェフスキー円
class hCircle extends hFigure{
  constructor(c, p){
    super();
    let circleData = getHypoCircle(c, p);
    this.cx = circleData.cx;
    this.cy = circleData.cy;
    this.r = circleData.r;
    this.generator = {c:{x:c.x, y:c.y}, p:{x:p.x, y:p.y}};
  }
  setId(){ this.id = hCircle.id; hCircle.id += FigureKind; }
  getDist(x, y){
    // 中心(cx, cy)との距離と半径との差の絶対値。
    let distCenter = Math.sqrt(Math.pow(this.cx - x, 2) + Math.pow(this.cy - y, 2));
    return abs(distCenter - this.r);
  }
  regenerate(){
    // generatorが更新された際に、その情報を使ってtypeとinfoを再設定する。
    let newData = getHypoCircle(this.generator.c, this.generator.p);
    this.cx = newData.cx;
    this.cy = newData.cy;
    this.r = newData.r;
  }
  move(seq){
    // generatorをいじってからregenerate.
    hypoMove(seq, this.generator.c);
    hypoMove(seq, this.generator.p);
    this.regenerate();
  }
  render(){
    if(this.active){ stroke(0, calcAlpha()); }else{ stroke(0); }
    arc(this.cx, this.cy, this.r * 2, this.r * 2, 0, 2 * Math.PI);
  }
}

hPoint.id = 0;
hLine.id = 1;
hCircle.id = 2;

// ----------------------------- //
// 各種メソッド

function calcAlpha(){
  return 50 * (1 + Math.cos(Math.PI * frameCount / 20));
}

function calcColor(){
  return frameCount % 100;
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
}

function getIntersectionLineAndLine(l1, l2){
  // 2直線l1, l2の交点として{x:x, y:y}を返す。
  // 具体的には、まずl1のgeneratorのpのpx, pyを記録しておいて、これは最後に使う。
  // l1, l2のコピーを用意する。
  // -px, -pyだけそれらをmoveしたものを用意する。これでl1の方が原点を通る直線になる。
  // さらにこのときのqx, qyについてqyが0でないなら回転も施す。こうして得られる変換を、
  // l1, l2双方のgeneratorに施して二つの直線を作る。と、l1側がx軸になるから計算しやすくなる。
  let dx, dy, dtheta;
  let gSet = [];
  // generatorに相当する点を4つ。
  gSet.push({x:l1.generator.p.x, y:l1.generator.p.y});
  gSet.push({x:l1.generator.q.x, y:l1.generator.q.y});
  gSet.push({x:l2.generator.p.x, y:l2.generator.p.y});
  gSet.push({x:l2.generator.q.x, y:l2.generator.q.y});
  dx = gSet[0].x, dy = gSet[0].y;
  // l1.generator.pが原点に来るように全体をtranslate.
  gSet.forEach((p) => {
    hypoTranslate(-dx, -dy, p);
  })
  dtheta = atan2(gSet[1].y, gSet[1].x);
  // l1.generator.qがx軸上にくるように全体をrotate.
  gSet.forEach((p) => {
    hypoRotate(-dtheta, p);
  })
  // このときcopyl1、つまり動かしたl1はx軸になっているので、それとcopyl2で議論すればいい。
  let copyLine1 = new hLine(gSet[0], gSet[1]);
  let copyLine2 = new hLine(gSet[2], gSet[3]);
  let x;
  if(copyLine2.type === 'line'){
    // 双方直線なら原点。
    x = 0;
  }else{
    let a = copyLine2.info.cx, b = copyLine2.info.cy, r = copyLine2.info.diam / 2;
    let x1 = a + Math.sqrt(r * r - b * b);
    let x2 = a - Math.sqrt(r * r - b * b);
    // ここでバリデーション. なお交点が2つ以上できることはない。
    if(abs(x1) < 200){ x = x1; }else if(abs(x2) < 200){ x = x2; }else{ return undefined; }
  }
  let is = {x:x, y:0}; // intersection.
  // 回転とtranslateを逆に施す。
  hypoMove(['r', dtheta, 't', dx, dy, 'end'], is);
  return is;
}

function getIntersectionLineAndCircle(l, e){
  // 直線lと円eの交点を返す感じで。接する場合に1つしか出さないのをどうするかって感じ。
  let dx, dy, dtheta;
  let gSet = [];
  gSet.push({x:l.generator.p.x, y:l.generator.p.y});
  gSet.push({x:l.generator.q.x, y:l.generator.q.y});
  gSet.push({x:e.generator.c.x, y:e.generator.c.y});
  gSet.push({x:e.generator.p.x, y:e.generator.p.y});
  dx = gSet[0].x, dy = gSet[0].y;
  gSet.forEach((p) => {
    hypoTranslate(-dx, -dy, p);
  })
  dtheta = atan2(gSet[1].y, gSet[1].x);
  gSet.forEach((p) => {
    hypoRotate(-dtheta, p);
  })
  // このとき直線の方はx軸になっている。円の方は普通に中に入る円。そこで・・
  let copyCircle = new hCircle(gSet[2], gSet[3]);
  // これの半径と中心の情報から交点を計算して引き戻す。
  let cx = copyCircle.cx, cy = copyCircle.cy, r = copyCircle.r;
  let isSet = [];
  if(abs(r - cy) < 0.0000001){
    isSet.push({x:cx, y:0});
  }else if(r > cy){
    let diff = Math.sqrt(r * r - cy * cy);
    isSet.push({x:cx + diff, y:0}), isSet.push({x:cx - diff, y:0});
  }else{
    return []; // 交点が見つからない時。
  }
  // 交点を引き戻す
  isSet.forEach((is) => {
    hypoMove(['r', dtheta, 't', dx, dy, 'end'], is);
  })
  return isSet;
}

function getIntersectionCircleAndCircle(e1, e2){
  // 円と円の交点。e1の中心を原点においてからe2の中心をx軸において以下略。
  let dx, dy, dtheta;
  let gSet = [];
  gSet.push({x:e1.generator.c.x, y:e1.generator.c.y});
  gSet.push({x:e1.generator.p.x, y:e1.generator.p.y});
  gSet.push({x:e2.generator.c.x, y:e2.generator.c.y});
  gSet.push({x:e2.generator.p.x, y:e2.generator.p.y});
  dx = gSet[0].x, dy = gSet[0].y;
  gSet.forEach((p) => {
    hypoTranslate(-dx, -dy, p);
  })
  dtheta = atan2(gSet[2].y, gSet[2].x);
  gSet.forEach((p) => {
    hypoRotate(-dtheta, p);
  })
  // このとき2つの円は共にx軸上に中心があり、円1は原点中心となっている。円2の中心はx軸正方向～。
  let copyCircle1 = new hCircle(gSet[0], gSet[1]);
  let copyCircle2 = new hCircle(gSet[2], gSet[3]);
  let r1 = copyCircle1.r, r2 = copyCircle2.r, cx2 = copyCircle2.cx;
  let isSet = [];
  if(abs(cx2) < 0.0000001){ return []; }
  let x = (cx2 * cx2 + r1 * r1 - r2 * r2) / (2 * cx2);
  if(abs(r1 * r1 - x * x) < 0.0000001){
    isSet.push({x:x, y:0});
  }else if(r1 * r1 > x * x){
    let diff = Math.sqrt(r1 * r1 - x * x);
    isSet.push({x:x, y:diff}), isSet.push({x:x, y:-diff});
  }else{
    return [];
  }
  // 引き戻し。
  isSet.forEach((is) => {
    hypoMove(['r', dtheta, 't', dx, dy, 'end'], is);
  })
  return isSet;
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
  pSet.forEach((p) => { hypoTranslate(-du, 0, p); });
  let gp = {x:0, y:100}, gq = {x:0, y:-100};
  let command = ['t', du, 0, 'r', dtheta, 't', dx, dy, 'end'];
  hypoMove(command, gp);
  hypoMove(command, gq);
  return {p:gp, q:gq};
}

function getSymmetricPointWithPoint(c, p){
  // c:centerに関してpと対称な点の座標を辞書形式で出力する。
  // 簡単。cを原点にtranslateする操作でpを動かしてからマイナスマイナスすればいい。
  let q = {x:p.x, y:p.y};
  let dx = c.x, dy = c.y;
  hypoTranslate(-dx, -dy, q);
  q.x = -q.x, q.y = -q.y;
  hypoTranslate(dx, dy, q);
  return q;
}

function getSymmetricLineWithPoint(c, l){
  // c:centerにより、直線を対称移動する。つまり、180°回転。
  // generatorをcにより対称やって、返す。
  let gp = {x:l.generator.p.x, y:l.generator.p.y};
  let gq = {x:l.generator.q.x, y:l.generator.q.y};
  let newgp = getSymmetricPointWithPoint(c, gp);
  let newgq = getSymmetricPointWithPoint(c, gq);
  return {p:newgp, q:newgq};
}

function getSymmetricCircleWithPoint(c, e){
  // c:centerにより、e:ellipseを対称移動。具体的にはgeneratorをいじるだけ。
  let gc = {x:e.generator.c.x, y:e.generator.c.y};
  let gp = {x:e.generator.p.x, y:e.generator.p.y};
  let newgc = getSymmetricPointWithPoint(c, gc);
  let newgp = getSymmetricPointWithPoint(c, gp);
  return {c:newgc, p:newgp};
}


function getMirrorPointWithLine(c, p){
  // cは直線。cに関してpと対称な点をよこす。
  let gp = {x:c.generator.p.x, y:c.generator.p.y};
  let gq = {x:c.generator.q.x, y:c.generator.q.y};
  let r = {x:p.x, y:p.y};
  // gpを原点に持ってきてからそのときのgqをx軸正方向に置いてそのときのrをy軸反転して逆変換
  let dx, dy, dtheta;
  dx = gp.x, dy = gp.y;
  hypoTranslate(-dx, -dy, gq);
  dtheta = atan2(gq.y, gq.x);
  // これでデータはすべて。
  hypoMove(['t', -dx, -dy, 'r', -dtheta, 'end'], r);
  r.y = -r.y;
  hypoMove(['r', dtheta, 't', dx, dy, 'end'], r);
  return r;
}

function getMirrorLineWithLine(c, l){
  // 直線cに関してlと対称な直線を以下略。
  let gp = {x:l.generator.p.x, y:l.generator.p.y};
  let gq = {x:l.generator.q.x, y:l.generator.q.y};
  let newgp = getMirrorPointWithLine(c, gp);
  let newgq = getMirrorPointWithLine(c, gq);
  return {p:newgp, q:newgq};
}

function getMirrorCircleWithLine(c, e){
  // 直線cに関してeと対称な円を以下略。
  let gc = {x:e.generator.c.x, y:e.generator.c.y};
  let gp = {x:e.generator.p.x, y:e.generator.p.y};
  let newgc = getMirrorPointWithLine(c, gc);
  let newgp = getMirrorPointWithLine(c, gp);
  return {c:newgc, p:newgp};
}

// -------------------------------- //
// 円関連。中心の座標とどこか1点の情報から、そこが中心でその点を通る円の中心と半径を出す。
function getHypoCircle(c, p){
  // cを0に移すセンタリングでpがqに移るとして、中心はR^2(R^2 - |q|^2)/(R^4 - |c|^2|q|^2) * c.
  // 半径はR^2(R^2 - |c|^2)/(R^4 - |c|^2|q|^2) * |q|. こんな感じ。
  // move処理は、generatorとしてのc, pを動かしたうえで再計算する感じかな・・
  let dx = c.x, dy = c.y;
  let w = {x:p.x, y:p.y};
  hypoMove(['t', -dx, -dy, 'end'], w);
  let norm_c = c.x * c.x + c.y * c.y;
  let norm_w = w.x * w.x + w.y * w.y;
  let centerFactor = 40000 * (40000 - norm_w) / (1600000000 - norm_c * norm_w);
  let radiusFactor = 40000 * (40000 - norm_c) / (1600000000 - norm_c * norm_w);
  return {cx:centerFactor * c.x, cy:centerFactor * c.y, r: radiusFactor * Math.sqrt(norm_w)};
}
