const explodeAnimationTime = 500;
const maxBulletAnimationTime = 200;
const dropSpeed = 1; // pixels per execInterval.
const INTERVALS = [150, 100, 70, 45, 30, 20, 10];
var execInterval = 100; // in milliseconds

var sky;
var ground;
var hit;
var miss;
var targets = {};
var lastWordTime = 0;
var remainingWords;

var execTimerId = null;

function onLoad() {
  document.addEventListener('keydown', keyDown);
  document.addEventListener('keypress', keyTyped);
  sky = $('#sky');
  ground = $('#ground');
  hit = $('#hit');
  miss = $('#miss');
}

function start() {
  hit.text(0);
  miss.text(0);
  ground.text('');

  remainingWords = $('#total').val();
  $('#remaining').text(remainingWords);

  execInterval = INTERVALS[$('#difficulty').val()];
  
  $('#overlay').hide();
  
  execTimerId = setInterval(exec, execInterval);
}

function exec() {
  let noWordsInFlight = true;
  for (let w in targets) {
    noWordsInFlight = false;
    if (targets[w].data('hit')) {
      continue;
    }
    let newTop = targets[w].offset().top + dropSpeed;
    if (newTop >= sky.offset().top + sky.height()) {
      removeTarget(w, miss);
    } else {
      targets[w].offset({top: newTop});
    }
  }

  if (remainingWords == 0 && noWordsInFlight) { // all words are done
    clearTimeout(execTimerId);
    execTimerId = null;
    $('#overlay').show();
    return;
  }

  let currentTime = Date.now();
  if (remainingWords > 0 && 
      (noWordsInFlight || currentTime - lastWordTime > execInterval * 150)) {
    $('#remaining').text(--remainingWords);
    let word = getRandomWord();
    let target = $('<span>' + word + '</span>');
    targets[word] = target;
    sky.append(target);
    target.offset({
      left: target.offset().left + Math.floor(Math.random() * (sky.width() - target.width()))
    });
    lastWordTime = currentTime;
  }
}

function removeTarget(word, hitOrMiss) {
  targets[word].remove();
  delete targets[word];
  hitOrMiss.text(parseInt(hitOrMiss.text()) + 1);
}

function getRandomWord() {
  let word;
  do {
    word = WORDS[Math.floor(Math.random() * WORDS.length)];
  } while (word in targets);
  return word;
}

function keyDown(e) {
  if (e.key == 'Backspace') {
    ground.text(ground.text().substring(0, ground.text().length - 1));
  }
}

function keyTyped(e) {
  if (e.key != 'Enter') {
    ground.text(ground.text() + e.key);
  } else {
    let word = ground.text();
    if (word in targets) {
      targets[word].data('hit', true);
      let bullet = $('<div class="bullet"></div>');
      sky.append(bullet);
      bullet.offset({
        top: sky.offset().top + sky.height(),
        left: targets[word].offset().left + targets[word].width() / 2
      });
      let diff = bullet.offset().top - targets[word].offset().top - targets[word].height() / 2;
      bullet.animate(
          {top: '-=' + diff},
          diff * maxBulletAnimationTime / sky.height(),
          'linear',
          function() {
            bullet.remove();
            targets[word].hide('explode', {pieces: 16}, explodeAnimationTime, function() {
              removeTarget(word, hit);
            });
          });
      ground.text('');
    }
  }
}

function pause() {
  if (execTimerId != null) {
    clearTimeout(execTimerId);
    execTimerId = null;
  } else {
    execTimerId = setInterval(exec, execInterval);
  }
}