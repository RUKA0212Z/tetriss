const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

const ROW = 20, COL = 10, SQ = 30, VACANT = "#111";
let board, current, pos, next, score, gameStarted = false;
let dropInterval = 700, lastDrop = Date.now();
let level = 1;
const levelScore = 50;

// 블록 색상과 모양
const COLORS = ["cyan","blue","orange","yellow","green","purple","red"];
const SHAPES = [
    [[1,1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[1,1],[1,1]],
    [[0,1,1],[1,1,0]],
    [[0,1,0],[1,1,1]],
    [[1,1,0],[0,1,1]]
];

// ====================== 그리기 ======================
function drawSquare(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*SQ,y*SQ,SQ,SQ);
    ctx.strokeStyle="#111";
    ctx.strokeRect(x*SQ,y*SQ,SQ,SQ);
}
function drawBoard(){
    for(let r=0;r<ROW;r++)
        for(let c=0;c<COL;c++)
            drawSquare(c,r,board[r][c]);
}
function drawPiece(){
    current.matrix.forEach((row,y)=>row.forEach((val,x)=>{
        if(val) drawSquare(x+pos.x, y+pos.y, current.color);
    }));
}
function randomPiece(){ 
    let i=Math.floor(Math.random()*SHAPES.length); 
    return {matrix: SHAPES[i], color: COLORS[i]}; 
}

// ====================== 충돌, 병합 ======================
function collide(){
    for(let y=0;y<current.matrix.length;y++){
        for(let x=0;x<current.matrix[y].length;x++){
            if(current.matrix[y][x]){
                let newX = pos.x + x, newY = pos.y + y;
                if(newX<0 || newX>=COL || newY>=ROW) return true;
                if(newY>=0 && board[newY][newX]!==VACANT) return true;
            }
        }
    }
    return false;
}
function merge(){ 
    current.matrix.forEach((row,y)=>row.forEach((val,x)=>{
        if(val) board[pos.y+y][pos.x+x]=current.color; 
    })); 
}

// ====================== 점수 및 줄 제거 ======================
function removeLine(){
    let lines=0;
    for(let y=ROW-1;y>=0;y--){
        if(board[y].every(cell=>cell!==VACANT)){
            board.splice(y,1);
            board.unshift(Array(COL).fill(VACANT));
            lines++; y++;
        }
    }
    if(lines>0){
        let points = lines*10;
        switch(lines){ case 2: points+=5; break; case 3: points+=15; break; case 4: points+=30; break;}
        score += points;
        updateScoreLevel();
        checkLevel();
    }
}

// ====================== 블록 이동 ======================
function drop(){
    pos.y++;
    if(collide()){
        pos.y--;
        merge();
        removeLine();
        current = next;
        pos = {x:Math.floor(COL/2)-1, y:0};
        next = randomPiece();

        if(collide()){ // 게임 오버
            gameStarted=false; 
            alert("게임 오버! 점수: " + score); 
            const btn = document.getElementById('restartBtn');
            btn.textContent="재시작"; 
            btn.style.display='block'; 
        }
    }
}

// ====================== 키보드 조작 ======================
function control(e){
    if(!gameStarted) return;
    if(e.key==="ArrowLeft"){ pos.x--; if(collide()) pos.x++; }
    else if(e.key==="ArrowRight"){ pos.x++; if(collide()) pos.x--; }
    else if(e.key==="ArrowDown"){ drop(); }
    else if(e.key==="ArrowUp"){
        let rotated = current.matrix[0].map((_,i)=>current.matrix.map(r=>r[i]).reverse());
        let prev=current.matrix; current.matrix=rotated; if(collide()) current.matrix=prev;
    }
}
document.addEventListener("keydown",control);

// ====================== 다음 블록 ======================
function drawNext(){
    nextCtx.clearRect(0,0,nextCanvas.width,nextCanvas.height);
    const offsetX = Math.floor((nextCanvas.width/SQ - next.matrix[0].length)/2);
    const offsetY = Math.floor((nextCanvas.height/SQ - next.matrix.length)/2);
    next.matrix.forEach((row,y)=>row.forEach((val,x)=>{
        if(val){
            nextCtx.fillStyle=next.color;
            nextCtx.fillRect((x+offsetX)*SQ,(y+offsetY)*SQ,SQ,SQ);
            nextCtx.strokeStyle='#111';
            nextCtx.strokeRect((x+offsetX)*SQ,(y+offsetY)*SQ,SQ,SQ);
        }
    }));
}

// ====================== 게임 시작 ======================
function startGame(){
    gameStarted = true;
    board = Array.from({length:ROW},()=>Array(COL).fill(VACANT));
    current = randomPiece();
    pos = {x: Math.floor(COL/2)-1, y:0};
    next = randomPiece();
    score = 0;
    level = 1;
    dropInterval = 700;
    updateScoreLevel();
    adjustLayout();
    document.getElementById('restartBtn').style.display = 'none';
}
document.getElementById('restartBtn').addEventListener("click",startGame);

// ====================== 게임 루프 ======================
function gameLoop(){
    if(gameStarted){
        let now=Date.now();
        if(now-lastDrop>dropInterval){ drop(); lastDrop=now; }
        drawBoard(); drawPiece(); drawNext();
    }
    requestAnimationFrame(gameLoop);
}
gameLoop();

// ====================== 점수/레벨 표시 ======================
function updateScoreLevel() {
    const scoreLevelEl = document.getElementById('scoreLevel');
    const displayedScore = parseInt(scoreLevelEl.textContent.replace(/\D/g,'')) || 0;
    const diff = score - displayedScore;

    if(diff > 0){
        let step = 0;
        const interval = setInterval(()=>{
            step++;
            scoreLevelEl.textContent = "점수: " + (displayedScore + step) + " / LEVEL " + level;
            if(step >= diff) clearInterval(interval);
        }, 20); 
    } else {
        scoreLevelEl.textContent = "점수: " + score + " / LEVEL " + level;
    }
}

// ====================== 레벨 체크 ======================
function checkLevel() {
    let newLevel = Math.floor(score / levelScore) + 1;
    if(newLevel > level){
        level = newLevel;
        dropInterval = Math.max(100, dropInterval - 20);
        updateScoreLevel();
    }
}

// ====================== 모바일 버튼 바인딩 ======================
function bindHoldControl(btnId, action) {
    const btn = document.getElementById(btnId);
    let interval;

    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (gameStarted) {
            action(); // 즉시 한 번 실행
            interval = setInterval(action, 100); // 100ms마다 반복 실행
        }
    });

    btn.addEventListener("touchend", () => {
        clearInterval(interval);
    });

    btn.addEventListener("touchcancel", () => {
        clearInterval(interval);
    });

    // PC에서도 마우스로 길게 누를 수 있게 (선택)
    btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        if (gameStarted) {
            action();
            interval = setInterval(action, 100);
        }
    });
    btn.addEventListener("mouseup", () => clearInterval(interval));
    btn.addEventListener("mouseleave", () => clearInterval(interval));
}

bindHoldControl("leftBtn", () => { pos.x--; if(collide()) pos.x++; });
bindHoldControl("rightBtn", () => { pos.x++; if(collide()) pos.x--; });
bindHoldControl("downBtn", () => drop());
bindHoldControl("rotateBtn", () => {
    let rotated = current.matrix[0].map((_,i)=>current.matrix.map(r=>r[i]).reverse());
    let prev=current.matrix;
    current.matrix=rotated;
    if(collide()) current.matrix=prev;
});

// ====================== 반응형 캔버스 & 모바일 처리 ======================
function adjustLayout() {
    const isMobile = window.innerWidth <= 768;

    // 캔버스 최대 너비
    const maxWidth = isMobile ? window.innerWidth * 0.9 : 400;
    const scale = maxWidth / (COL * SQ);

    // 캔버스 크기
    canvas.style.width = (COL * SQ * scale) + "px";
    canvas.style.height = (ROW * SQ * scale) + "px";

    // Next 블록 위치: 캔버스 오른쪽 상단
    const canvasRect = canvas.getBoundingClientRect();
    nextCanvas.style.position = "absolute";
    nextCanvas.style.top = canvasRect.top + "px";
    nextCanvas.style.left = (canvasRect.right + 10) + "px";
    nextCanvas.style.width = (120 * scale) + "px";
    nextCanvas.style.height = (120 * scale) + "px";

 // 방향키 버튼: 캔버스 바로 아래 중앙
    const mobileControls = document.getElementById('mobile-controls');
    mobileControls.style.display = 'flex'; // PC/Mobile 모두 보이도록
    mobileControls.style.position = 'absolute';
    mobileControls.style.top = (canvas.offsetTop + ROW * SQ * scale + 70) + "px";
    mobileControls.style.left = '50%';
    mobileControls.style.transform = 'translateX(-50%)';
    mobileControls.style.gap = '15px';

    // 버튼 크기
    const btns = mobileControls.querySelectorAll('button');
    btns.forEach(btn => {
        btn.style.width = Math.min(80, window.innerWidth * 0.15) + "px";
        btn.style.height = Math.min(80, window.innerWidth * 0.15) + "px";
        btn.style.fontSize = "32px";
    });
}

    // 게임 시작 버튼 위치
    positionRestartButton();


// 게임 시작 버튼 위치: 캔버스 중앙
function positionRestartButton() {
    const restartBtn = document.getElementById('restartBtn');
    const canvasRect = canvas.getBoundingClientRect();

    restartBtn.style.position = "absolute";
    restartBtn.style.left = (canvasRect.left + canvasRect.width / 2) + "px";
    restartBtn.style.top = (canvasRect.top + canvasRect.height / 2) + "px";
    restartBtn.style.transform = "translate(-50%, -50%)";
    restartBtn.style.zIndex = 20;
    restartBtn.style.display = gameStarted ? 'none' : 'block';
}

// 초기와 리사이즈 시 적용
window.addEventListener('load', adjustLayout);
window.addEventListener('resize', adjustLayout);
