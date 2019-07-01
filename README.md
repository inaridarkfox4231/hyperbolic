# hyperbolic
双曲平面のポアンカレモデルでなんかやりたい。  
こちら：https://inaridarkfox4231.github.io/hyperbolic/  
drawLineモードにすると双曲直線が引けるよ。  
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
2019/07/01現在  
直線に点の情報を持たせるのはとりあえず保留。で、直線消すところまで行ったよ。  
直線上に点を打つの面白いかも。  
今やりたいのは、  
1. 直線に点の情報を乗せる。で、重複を防ぐ。  
   まず、点をクリックしたときに、その点から延びる直線を走査して、その中にactiveな点を含むものがあれば、  
   その直線は既に存在しているので重複して登録されない、というようにする。  
   で、そのためには点とか直線に接続のパラメータを持たせないといけないの。  
   直線を引くときに直線に点のidを持たせて点に直線のidを持たせる。  
   点を消すときは、点から延びている直線からその点のid情報を削除する（メソッドで分離）。  
   点の方は特に何もしなくても問題ない（存在が消えるので）。  
   直線を消すときは、直線上の点からその直線のid情報を削除する（メソッドで分離）。  
   直線の方は問題ない、何もしなくても。  
   どちらも.connectedとidを使って操作するから同じメソッドでいけるはず。別々に用意せずとも。  
   というか、他にも共通化できるところありそう・・  
2. 直線上に点を配置、クリックしたところに置かれる。  
3. 直線上の点をクリックして、それら2点の間の点を等間隔に配置する。  
4. activeな点とクリックした点に対して、activeな点からクリックした点に延びている直線を基準とし、  
   他にも伸びている直線があればそれらを等角度になるように再配置する。（具体的には削除して引き直す）  
   つまり、点から出ている直線の本数でもって何等分するか決める感じ。  
5. 円の中心に点を置く、地味だけどそういうのも欲しい感じ。  
6. ドラッグして平行移動・・どうするのがいいんだろうね。  
7. 0をrexp(ia)に移す変換があって、点についてはそれを使う。直線については、多分ね、  
   直線の付加情報としてそれを引いたときの点の座標（基準点）を持たせておいて（generatorという）、  
   それを移したうえでもっかい引けばいいと思う。その際、点も直線も相互関係を保つようにすること（id, connectedを変えない）。  

どうでもいいかもだけど点のidを偶数にして線のidを奇数にした。  
対称変換やるとき、どれについて対称やったらどれになるかってのをリストにしておいて重複が起きないように  
出来るかもしれないからそれを見越したうえで一応、無駄かもだけど。  
点に関して点の対称移動、点に関して線の対称移動(？)、線に関して点の対称移動（反転）、線に関して線の・・いろいろ。
