(function() {
    // Constants
    const PEGS = 3;
    const INIT_DISKS = 3;
    const MIN_DISKS = 1;
    const MAX_DISKS = 7;

    // Global State
    let disks = INIT_DISKS;
    let rods = [[], [], []]; // rods A, B, C (index 0, 1, 2)
    let selectedPeg = null;     //index of selected peg (0,1,2) or null
    let moves = 0;

    // DOM references
    const canvases = [
        document.getElementById('peg0Canvas'),
        document.getElementById('peg1Canvas'),
        document.getElementById('peg2Canvas')
    ];

    const wrappers = [
        document.getElementById('peg0Wrapper'),
        document.getElementById('peg1Wrapper'),
        document.getElementById('peg2Wrapper')
    ];

    const diskCountSpan = document.getElementById('diskCountDisplay');
    const moveSpan = document.getElementById('moveCounter');
    const statusDiv = document.getElementById('statusMessage');
    const decBtn = document.getElementById('decBtn');
    const incBtn = document.getElementById('incBtn');
    const resetBtn = document.getElementById('resetBtn');

    // Helper: Reset rods to initial state (all disks on rod 0)

    function resetRods() {
        rods = [[], [], []];
        for(let i= disks; i >= 1; i--) {
            rods[0].push(i);        // largest disk = disks, smallest = 1
        }
        selectedPeg = null;     // Moves only reset if disk count didn't change? reset button calls with explicit
    }

    // Initialise
    function initGame() {
        resetRods();
        moves = 0;
        updateUI();
    }

    // Draw a single peg with its disks on given canvas

    function drawPeg(canvas, pegIndex) {
        const ctx = canvas.getContext('2d');
        const w = 220, h = 220;

        // Clear with soft BG
        ctx.clearRect(0,0,w,h);

        // Wooden floor line (base)
        ctx.fillStyle = '#16232e';
        ctx.fillRect(0, h-30, w, 12);
        ctx.fillStyle = '#3f5264';
        ctx.fillRect(0, h-26, w, 6);

        // vertical peg (wooden/ metallic)
        ctx.shadowColor = '#00000055';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#8a7a6a';
        ctx.beginPath();
        ctx.roundRect(102,40,16,h-70,8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Peg highlight
        ctx.fillStyle = '#b7a48e';
        ctx.beginPath();
        ctx.roundRect(104,42,12,h-74,6);
        ctx.fill();

        // Base shadow under disks
        ctx.fillStyle = '0d1b26';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(40,h-32,140,8);
        ctx.globalAlpha = 1.0;

        // Draw disks from bottom(largest index) to top
        const stack = rods[pegIndex];
        const baseY = h - 42;
        const diskHeight = 18;
        const maxDiskWidth = 140;
        const minDiskWidth = 40;

        for(let i = 0; i < stack.length; i++) {
            const diskSize = stack[i];
            let width = minDiskWidth + (maxDiskWidth - minDiskWidth) *((diskSize-1)/(disks - 1 || 1));
            width = Math.min(maxDiskWidth, Math.max(minDiskWidth, Math.round(width)));

            const xCenter = 110;
            const x = xCenter - width/2;
            const y = baseY-i*diskHeight;

            // Disk gradient
            const gradient = ctx.createLinearGradient(x,y,x+width, y+diskHeight-4);
            gradient.addColorStop(0, '#eba952');
            gradient.addColorStop(0.6, '#dc843a');
            gradient.addColorStop(1, '#b35e27');
            ctx.fillStyle = gradient;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#2f1a0c';
            ctx.shadowOffsetY = 3;

            // Rounded Disk
            ctx.beginPath();
            ctx.roundRect(x,y,width,diskHeight-2,10);
            ctx.fill();

            // Inner highlight
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#fec981';
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.roundRect(x+2, y+1, width-4, 4, 4);
            ctx.fill();
            ctx.globalAlpha = 1.0;

        }

            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
    }

    CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
        if(w<2*r)r = w/2;
        if(h<2*r)r = h/2;
        this.moveTo(x+r, y);
        this.lineTo(x+w-r, y);
        this.quadraticCurveTo(x+w, y, x+w, y+r);
        this.lineTo(x+w, y+h-r);
        this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
        this.lineTo(x+r, y+h);
        this.quadraticCurveTo(x,y+h,x,y+h-r);
        this.lineTo(x, y+r);
        this.quadraticCurveTo(x,y,x+r,y);
        return this;
    };

    // Redraw all pegs
    function render() {
        for (let i = 0; i < PEGS; i++){
            drawPeg(canvases[i], i);
        }
        // Update move counter
        moveSpan.innerText = `${moves}`;
        diskCountSpan.innerText = `${disks} disk${disks>1?'s':''}`;
    }

    // Check for win (all disks on last peg C = index 2)
    function checkWin(){
        if(rods[2].length === disks) {
            statusDiv.innerText = "YOU WIN! (reset or keep playing)";
        } else {
            const sel = selectedPeg !== null ? `peg${String.fromCharCode(65+selectedPeg)} selected`: 'no peg selected';
            statusDiv.innerText = `${sel}. make a move`;
        }
    }
    
    // Update UI = render + win mssg + selection highlight
    function updateUI() {
        render();
        //Update selected border
        for(let i=0;i<PEGS; i++){
            if(selectedPeg === i){
                wrappers[i].classList.add('selected');
            } else {
                wrappers[i].classList.remove('selected');
            }
        }
        checkWin();
    } 
    
    // Attempt Move: from -> to
    function tryMove(from , to) {
        if(from === to){
            selectedPeg = null;
            updateUI();
            return false;
        }
        const fromRod = rods[from];
        const toRod = rods[to];

        if(fromRod === 0) {
            selectedPeg = null;
            updateUI();
            return false;
        }

        const diskFrom = fromRod[fromRod.length-1];
        if(toRod.length > 0) {
            const diskTo = toRod[toRod.length-1];
            if(diskFrom > diskTo) {
                // Invalid move: larger onto smaller
                selectedPeg = null;
                updateUI();
                return false;
            }
        }

        // Valid move
        fromRod.pop();
        toRod.push(diskFrom);
        moves++;
        selectedPeg = null; // Always deselect after successful move
        updateUI();
        return true;
    } 

    // Event: Peg click
    function handlePegClick(pegIndex){
        if(selectedPeg === null) {
            // select if rod non-empty?
            if(rods[pegIndex].length > 0){
                selectedPeg = pegIndex;
            } else {
                statusDiv.innerText = `peg${String.fromCharCode(65 + pegIndex)} empty, cannot select`;
            }
            updateUI();
        } else {
            // try move from selected to this peg
            tryMove(selectedPeg, pegIndex)
        }
    } 
    
    // Attach click listeners
    wrappers.forEach((wrapper, idx) => {
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePegClick(idx);
        });
    });
    
    // Reset with current disk count
    function resetGame(){
        rods =[[], [], []];
        for(let i=disks; i>=1; i--) {
            rods[0].push(i);
        }
        moves = 0
        selectedPeg = null;
        updateUI();
    }

    // Change number of disks
    function changeDisks(delta) {
        let newDisks = disks+delta;
        if(newDisks < MIN_DISKS || newDisks > MAX_DISKS) return;
        disks = newDisks;
        resetGame();
        updateUI();
    }

    // Event listeners for the Buttons
    decBtn.addEventListener('click', () => changeDisks(-1));
    incBtn.addEventListener('click', () => changeDisks(1));
    resetBtn.addEventListener('click', () => resetGame());

    // Initialize start
    initGame();

})();