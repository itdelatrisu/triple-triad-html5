/*
 * Triple Triad (HTML5) - a card game from FFVIII
 * Copyright (C) 2014 Jeffrey Han
 *
 * Triple Triad is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Triple Triad is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Triple Triad.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

/**
 * Main script.
 */
function Game() {
	/** Wait time unit, in milliseconds, between actions. */
	var WAIT_TIME = 1000;

	/** Delay timer. */
	var timer;

	/** Current board. */
	var board = [];

	/** Elements on board. */
	var elements = [];
	
	/** Original hands. */
	var playerCards = [], opponentCards = [];

	/** Current hands. */
	var playerHand = [], opponentHand = [];

	/** The AIs. */
	var playerAI, opponentAI;

	/** Current card result. */
	var result;

	/** Whether the currently processing result is a "Combo". */
	var isCombo;

	/** Score. */
	var playerScore, opponentScore;

	/** Turn (PLAYER or OPPONENT). */
	var turn;

	/** Selected card index. */
	var selectedCard;

	/** Selected board position. */
	var selectedPosition;

	/** Whether the game has loaded. */
	var init;

	/** Card loading: current count. */
	var loadCardCount;

	/** Card loading: current offset. */
	var loadCardOffset;

	/** Alpha level for special text images. */
	var textAlpha;

	/** Spinner. */
	var spinner;

	/** Card name text. */
	var text;

	/** Whether or not to force a full render. */
	var forceRender;

	this.setup = function() {
		// scale to window dimensions
		jaws.width = jaws.canvas.width = window.innerWidth;
		jaws.height = jaws.canvas.height = window.innerHeight;

		// set the background
		var style = document.body.style;
		style.backgroundImage = "url(img/board-mat.jpg)";
		style.backgroundSize = "auto 100%";
		style.backgroundRepeat = "no-repeat";
		style.backgroundPosition = "center";

		// use smooth antialiased scaling
		jaws.useSmoothScaling();

		// initialize game images
		Game.Image.setup();

		// key bindings
		jaws.on_keydown(["z", "enter"], keySelect);
		jaws.on_keydown(["x", "backspace"], keyUnselect);
		jaws.on_keydown("up", keyUp);
		jaws.on_keydown("down", keyDown);
		jaws.on_keydown("left", keyLeft);
		jaws.on_keydown("right", keyRight);
		jaws.on_keydown("f1", keyAuto);
		jaws.on_keydown("f5", keyRestart);
		jaws.on_keydown("esc", togglePause);

		// mouse listener
		window.addEventListener("mousedown", mousePressed, false);

		// icons
		document.getElementById("restart").addEventListener("click", keyRestart, false);
		document.getElementById("auto").addEventListener("click", keyAuto, false);
		document.getElementById("pause").addEventListener("click", togglePause, false);
		document.getElementById("info").addEventListener("click", function() {
			if (!Game.isPaused)
				togglePause();
		}, false);

		// resize listener
		window.addEventListener("resize", resize, false);

		restart(true);
	}

	this.draw = function() {
		// card loading
		if (!init) {
			jaws.clear();
			for (var i = 0, len = Math.min(loadCardCount, 5); i < len; i++)
				opponentHand[i].drawInHand(i, false);
			if (loadCardCount >= 5) {
				for (var i = 0, len = loadCardCount - 5; i < len; i++)
					playerHand[i].drawInHand(i, false);
			}

			if (loadCardCount < 5)
				opponentHand[loadCardCount].drawInHand(loadCardOffset, false);
			else if (loadCardCount < 10)
				playerHand[loadCardCount % 5].drawInHand(loadCardOffset, false);
			else if (timer < 1000)
				Game.Spinner.sprite[spinner].drawCentered(jaws.width / 2, jaws.height / 2);
			else {
				var spinSprite = ((turn == Game.PLAYER) ? Game.Spinner.frameRight[spinner] : Game.Spinner.frameLeft[spinner]);
				spinSprite.drawCentered(jaws.width / 2, jaws.height / 2);
			}
			drawPauseOverlay();
			return;
		}

		// clear canvas
		if (forceRender) {
			// force a re-rendering
			jaws.clear();
		} else if (isGameOver() && textAlpha >= 1 && result === undefined) {
			// game over: stop rendering
			drawPauseOverlay();
			return;
		} else {
			// only clear the current player's side plus the board
			var rectWidth = (jaws.width / 2) + (Game.CARD_LENGTH * 1.6);
			if (turn == Game.PLAYER)
				jaws.context.clearRect((jaws.width / 2) - (Game.CARD_LENGTH * 1.6), 0, rectWidth, jaws.height);
			else if (turn == Game.OPPONENT)
				jaws.context.clearRect(0, 0, rectWidth, jaws.height);
		}

		// cards (hand)
		var noSelect = (result !== undefined || isGameOver());
		if (turn == Game.PLAYER || forceRender) {
			for (var i = 0, len = playerHand.length; i < len; i++)
				playerHand[i].drawInHand(i + (5 - len), (turn == Game.PLAYER && selectedCard == i && !noSelect));
		}
		if (turn == Game.OPPONENT || forceRender) {
			for (var i = 0, len = opponentHand.length; i < len; i++)
				opponentHand[i].drawInHand(i + (5 - len), (turn != Game.PLAYER && selectedCard == i && !noSelect));
		}

		// cards (board)
		for (var i = 0; i < 9; i++) {
			if (board[i] !== undefined)
				board[i].drawOnBoard();
		}

		// spinner
		if (!isGameOver()) {
			Game.Spinner.sprite[spinner].drawCentered(
				(jaws.width / 2) + ((Game.CARD_LENGTH * 1.95) * ((turn == Game.PLAYER) ? 1 : -1)),
				(jaws.height / 2) - (Game.CARD_LENGTH * 1.5)
			);
		}

		// score
		var scoreHeight = (jaws.height / 2) + (Game.CARD_LENGTH * 1.4);
		if (turn == Game.PLAYER || forceRender) {
			Game.Image.SCORE[playerScore].drawCentered(
				(jaws.width / 2) + (Game.CARD_LENGTH * 2.1), scoreHeight
			);
		}
		if (turn == Game.OPPONENT || forceRender) {
			Game.Image.SCORE[opponentScore].drawCentered(
				(jaws.width / 2) - (Game.CARD_LENGTH * 2.1), scoreHeight
			);
		}

		// elements
		if (elements !== undefined) {
			for (var i = 0; i < 9; i++)
				Game.Element.drawOnBoard(elements[i], i, board[i]);
		}

		forceRender = false;

		// card result
		if (result !== undefined) {
			var img;
			if (isCombo)
				img = Game.Image.SPECIAL_COMBO;
			else if (result.isSame())
				img = Game.Image.SPECIAL_SAME;
			else
				img = Game.Image.SPECIAL_PLUS;
			if (img) {
				img.alpha = textAlpha;
				img.drawCentered(jaws.width / 2, jaws.height / 2);
			}
			drawPauseOverlay();
			return;
		}

		// game over
		if (isGameOver()) {
			var img =
				(playerScore > opponentScore) ? Game.Image.RESULT_WIN :
				(playerScore < opponentScore) ? Game.Image.RESULT_LOSE :
				                                Game.Image.RESULT_DRAW;
			img.alpha = textAlpha;
			img.drawCentered(jaws.width / 2, jaws.height / 2);
			drawPauseOverlay();
			return;
		}

		// player turn...
		if (turn == Game.PLAYER && playerHand.length > 0) {
			// cursor
			var cursor = Game.Image.CURSOR;
			cursor.alpha = 1;
			if (selectedPosition != -1) {
				cursor.drawCentered(
					(jaws.width / 2) - ((1 - (selectedPosition % 3)) * Game.CARD_LENGTH) - cursor.width,
					(jaws.height / 2) - ((1 - Math.floor(selectedPosition / 3)) * Game.CARD_LENGTH)
				);
				cursor.alpha = 0.5;
			}
			var pos = selectedCard + (5 - playerHand.length);
			cursor.drawAt(
				(jaws.width / 2) + (Game.CARD_LENGTH * 1.5) - (cursor.width / 1.25),
				(jaws.height / 2) - Game.CARD_LENGTH + (pos * Game.CARD_LENGTH / 2)
			);

			// card name
			var name = "";
			if (selectedPosition != -1) {
				if (board[selectedPosition] !== undefined)
					name = board[selectedPosition].name;
			} else
				name = playerHand[selectedCard].name;
			if (name) {
				var infoBox = Game.Image.INFO_BOX;
				var infoX = (jaws.width - infoBox.width) / 2;
				var infoY = (jaws.height - infoBox.height) / 2 + (Game.CARD_LENGTH * 1.4);
				infoBox.drawAt(infoX, infoY);
				Game.Image.INFO_TEXT.drawAt(
					infoX + (infoBox.width * 0.015),
					infoY + (infoBox.height * 0.015)
				);
				if (text === undefined || text.text != name)
					text = new jaws.Text({text: name, x: jaws.width / 2, y: infoY + (infoBox.height / 2),
						fontFace: "Open Sans Light", fontSize: 32 * (Game.CARD_LENGTH / 256) * 1.6,
						color: "#FFFFFF", textAlign: "center", textBaseline: "middle"});
				text.draw();
			}
		}

		drawPauseOverlay();
	}

	this.update = function() {
		var delta = jaws.game_loop.tick_duration;

		if (!isGameOver())
			Game.Spinner.update(spinner);

		// card loading
		if (!init) {
			// sound effect timer
			if (timer > 0) {
				if (timer < 1500)  // "start" sound effect length
					timer += delta;
				else {  // start game
					timer = 0;
					Game.Spinner.anim[spinner].frame_duration = 200;
					init = true;
				}
				return;
			}

			var targetOffset = loadCardCount % 5;
			if (loadCardOffset > targetOffset)
				loadCardOffset -= (delta / 25);

			// next card
			if (loadCardOffset <= targetOffset) {
				if (++loadCardCount > 9) {  // finished animating: play sound effect
					Game.Sound.START.play();
					timer = 1;
				} else {
					loadCardOffset = 3 + (jaws.height / Game.CARD_LENGTH);
					Game.Sound.CARD.play();
				}
			}
			return;
		}

		// update element animation
		if (elements !== undefined)
			Game.Element.update(elements);

		// card result
		if (result !== undefined) {
			// card playing
			if (Card.isCardPlaying) {
				Card.update(delta);
				if (!Card.isCardPlaying) {
					// change card owners and adjust score
					if (result.isSame()) {
						Game.Sound.SPECIAL.play();
						cardResult(result.getSameList());
					} else if (result.isPlus()) {
						Game.Sound.SPECIAL.play();
						cardResult(result.getPlusList());
					}
					if (result.hasCapture())
						cardResult(result.getCapturedList());
				} else
					forceRender = true;
				return;
			}

			Card.update(delta);
			if (!result.isSame() && !result.isPlus()) {
				if (!Card.isColorChange) {  // finish color change animation
					result = undefined;
					turn = !turn;
					forceRender = true;
				}
				return;
			}

			if (textAlpha < 1)  // main text ("same" or "plus")
				textAlpha += (delta / 500);
			else if (result.hasCombo()) {  // combo action and text
				if (timer < WAIT_TIME / 2)  // delay
					timer += delta;
				else {
					timer = 0;
					cardResult(result.nextCombo());
					if (!isCombo) {
						textAlpha = 0;
						isCombo = true;
					}
				}
			} else if (timer < WAIT_TIME / 2)  // delay
				timer += delta;
			else if (!Card.isColorChange) {  // reset
				textAlpha = 0;
				timer = 0;
				result = undefined;
				isCombo = false;
				turn = !turn;
				forceRender = true;
			}
			return;
		}

		// game over
		if (isGameOver()) {
			// fade in result
			if (textAlpha < 1)
				textAlpha += (delta / 750);

			// sudden death
			else if (Game.rules.SUDDEN_DEATH && playerScore == opponentScore) {
				if (timer < WAIT_TIME / 2)
					timer += delta;
				else
					restart(false);
			}
			return;
		}

		// opponent turn
		if (turn == Game.OPPONENT) {
			if (timer == 0) {  // calculate next move
				opponentAI.update(opponentScore, playerScore);
				timer += delta;
			} else if (timer < WAIT_TIME) {  // delay, move card
				var nextIndex = opponentAI.nextIndex;
				if (selectedCard < nextIndex &&
					timer >= (selectedCard + 1) * WAIT_TIME / (nextIndex + 1))
					selectedCard++;
				timer += delta;
			} else {  // play card
				playCard(opponentHand, opponentAI.nextIndex, opponentAI.nextPosition);
				timer = 0;
			}
			return;
		}
	}

	/**
	 * Handles key press events.
	 * @param {string} key the key pressed
	 */
	function keyPress(key) {
		if (Game.isPaused)
			return;

		if ((isGameOver() && (playerScore != opponentScore || !Game.rules.SUDDEN_DEATH) &&
			textAlpha >= 1 && result === undefined && key == "select")) {
			restart(true);
			return;
		}

		// not player turn
		if (turn != Game.PLAYER || !init || result !== undefined || isGameOver())
			return;

		switch (key) {
		case "down":
			if (selectedPosition == -1) {
				selectedCard = (selectedCard + 1) % playerHand.length;
				Game.Sound.SELECT.play();
			} else {
				if (selectedPosition < 6) {
					selectedPosition += 3;
					Game.Sound.SELECT.play();
				}
			}
			break;
		case "up":
			if (selectedPosition == -1) {
				var len = playerHand.length;
				selectedCard = (selectedCard + (len - 1)) % len;
				Game.Sound.SELECT.play();
			} else {
				if (selectedPosition > 2) {
					selectedPosition -= 3;
					Game.Sound.SELECT.play();
				}
			}
			break;
		case "left":
			if (selectedPosition != -1 && selectedPosition % 3 != 0) {
				selectedPosition--;
				Game.Sound.SELECT.play();
			}
			break;
		case "right":
			if (selectedPosition != -1 && selectedPosition % 3 != 2) {
				selectedPosition++;
				Game.Sound.SELECT.play();
			}
			break;
		case "select":
			if (selectedPosition == -1) {
				selectedPosition = 4;
				Game.Sound.SELECT.play();
			} else {
				if (playCard(playerHand, selectedCard, selectedPosition))
					Game.Sound.SELECT.play();
				else
					Game.Sound.INVALID.play();
			}
			break;
		case "unselect":
			if (selectedPosition != -1) {
				selectedPosition = -1;
				Game.Sound.BACK.play();
			}
			break;
		case "auto":
			playerAI.update(playerScore, opponentScore);
			selectedCard = playerAI.nextIndex;
			selectedPosition = playerAI.nextPosition;
			playCard(playerHand, selectedCard, selectedPosition);
			Game.Sound.SELECT.play();
			break;
		}
	}
	function keySelect() { keyPress("select"); }
	function keyUnselect() { keyPress("unselect"); }
	function keyUp() { keyPress("up"); }
	function keyDown() { keyPress("down"); }
	function keyLeft() { keyPress("left"); }
	function keyRight() { keyPress("right"); }
	function keyAuto() { keyPress("auto"); }
	function keyRestart() { if (!Game.isPaused) restart(true); }

	/**
	 * Handles mouse press events.
	 */
	function mousePressed(e) {
		if (Game.isPaused)
			return;

		// only allow left click
		var left = (function(e) {
		    if ("buttons" in e)
		        return event.buttons === 1;
		    else if ("which" in event)
		        return event.which === 1;
		    else
		        return event.button === 1;
		})(e || window.event);
		if (!left)
			return;

		// restart game
		if (isGameOver() && (playerScore != opponentScore || !Game.rules.SUDDEN_DEATH) &&
			textAlpha >= 1 && result === undefined) {
			restart(true);
			return;
		}

		// not player turn
		if (turn != Game.PLAYER || !init || result !== undefined || isGameOver())
			return;

		var x = jaws.mouse_x;
		var y = jaws.mouse_y;
		var centerX = jaws.width / 2;
		var centerY = jaws.height / 2;

		// player hand
		for (var i = 0, handSize = playerHand.length; i < handSize; i++) {
			var index = handSize - i - 1;
			var posX = centerX + Math.floor(Game.CARD_LENGTH * ((selectedCard == index) ? 1.45 : 1.6));
			var posY = centerY - ((i - 1) * Game.CARD_LENGTH / 2);
			if (x >= posX && x < posX + Game.CARD_LENGTH &&
				y >= posY && y < posY + Game.CARD_LENGTH) {
				if (selectedCard == index) {
					if (selectedPosition == -1) {
						selectedPosition = 4;
						Game.Sound.SELECT.play();
					} else {
						selectedPosition = -1;
						Game.Sound.BACK.play();
					}
				} else {
					selectedCard = index;
					selectedPosition = -1;
					Game.Sound.SELECT.play();
				}
				return;
			}
		}

		// board
		var centerOffset = Game.CARD_LENGTH * 1.5;
		if (x >= centerX - centerOffset && x < centerX + centerOffset &&
			y >= centerY - centerOffset && y < centerY + centerOffset) {
			var boardPosition =
					Math.floor((x - (centerX - centerOffset)) / Game.CARD_LENGTH) +
					Math.floor((y - (centerY - centerOffset)) / Game.CARD_LENGTH) * 3;
			if (selectedPosition != boardPosition) {
				selectedPosition = boardPosition;
				Game.Sound.SELECT.play();
			} else if (playCard(playerHand, selectedCard, boardPosition))
				Game.Sound.SELECT.play();
			else
				Game.Sound.INVALID.play();
			return;
		}
	}

	/**
	 * Handles window resize events.
	 */
	function resize() {
		// set new window dimensions
		jaws.width = jaws.canvas.width = window.innerWidth;
		jaws.height = jaws.canvas.height = window.innerHeight;

		// set new card length
		Game.CARD_LENGTH = window.innerHeight * 0.29;

		// resize all images
		for (var i = 0, len = Game.deck.length; i < len; i++)
			Game.deck[i].resize();
		Game.Image.resize();

		// force text resize
		text = undefined;

		// force full render
		forceRender = true;

		// render at least once even if the game is paused
		if (Game.isPaused)
			jaws.game_state.draw();
	}

	/**
	 * Toggles the pause state of the game.
	 */
	function togglePause() {
		Game.isPaused = !Game.isPaused;
		var icon = document.getElementById("pause");
		var popup = document.getElementById("pause_popup");
		if (Game.isPaused) {
			icon.src = "img/icon-pause.png";
			jaws.game_loop.pause();
			if (!Game.isMuted)
				Howler.mute();
			jaws.game_state.draw();
			popup.classList.add("pause_text");
		} else {
			icon.src = "img/icon-play.png";
			jaws.game_loop.unpause();
			if (!Game.isMuted)
				Howler.unmute();
			forceRender = true;
			popup.classList.remove("pause_text");
		}
	}

	/**
	 * Draws a pause overlay (only if the game is paused).
	 */
	function drawPauseOverlay() {
		if (!Game.isPaused)
			return;

		jaws.context.fillStyle = "rgba(0, 0, 0, 0.8)";
		jaws.context.fillRect(0, 0, jaws.width, jaws.height);
	}

	/**
	 * Re-initializes the game.
	 * @param {bool} newHand whether or not to generate new hands
	 *               (e.g. false for Sudden Death)
	 */
	function restart(newHand) {
		if (newHand) {
			Game.deck = shuffle(Game.deck);
			playerCards = Game.deck.slice(0, 5);
			playerHand = Game.deck.slice(0, 5);
			opponentCards = Game.deck.slice(5, 10);
			opponentHand = Game.deck.slice(5, 10);
			for (var i = 0; i < 5; i++) {
				playerCards[i].owner = Game.PLAYER;
				playerCards[i].position = -1;
				opponentCards[i].owner = Game.OPPONENT;
				opponentCards[i].position = -1;
			}
			spinner = Game.Spinner.getRandomSpinner();
			Game.Spinner.anim[spinner].frame_duration = 40;
			init = false;
		} else {
			while (playerHand.length > 0)
				playerHand.pop();
			while (opponentHand.length > 0)
				opponentHand.pop();

			// build new hands from owned cards
			for (var i = 0; i < 5; i++) {
				// determine new owners
				if (playerCards[i].owner == Game.PLAYER)
					playerHand.push(playerCards[i]);
				else
					opponentHand.push(playerCards[i]);
				if (opponentCards[i].owner == Game.PLAYER)
					playerHand.push(opponentCards[i]);
				else
					opponentHand.push(opponentCards[i]);

				// reset the card positions
				playerCards[i].position = -1;
				opponentCards[i].position = -1;
			}
		}
		while (board.length > 0)
			board.pop();
		elements = (Game.rules.ELEMENTAL) ? Game.Element.getRandomBoard() : undefined;
		switch (Game.settings.AI_OPPONENT) {
			case "RANDOM": opponentAI = new RandomAI(opponentHand, board, elements); break;
			case "OFFENSIVE": opponentAI = new OffensiveAI(opponentHand, board, elements); break;
			case "DEFENSIVE": opponentAI = new DefensiveAI(opponentHand, board, elements); break;
			case "BALANCED":
			default:
				opponentAI = new BalancedAI(opponentHand, board, elements); break;
		}
		switch (Game.settings.AI_PLAYER) {
			case "RANDOM": playerAI = new RandomAI(playerHand, board, elements); break;
			case "OFFENSIVE": playerAI = new OffensiveAI(playerHand, board, elements); break;
			case "DEFENSIVE": playerAI = new DefensiveAI(playerHand, board, elements); break;
			case "BALANCED":
			default:
				playerAI = new BalancedAI(playerHand, board, elements); break;
		}
		result = undefined;
		isCombo = false;
		playerScore = opponentScore = 5;
		turn = (Math.random() < 0.5) ? Game.PLAYER : Game.OPPONENT;
		selectedCard = 0;
		selectedPosition = -1;
		timer = 0;
		loadCardCount = 0;
		loadCardOffset = 3 + (jaws.height / Game.CARD_LENGTH);
		textAlpha = 0;
		forceRender = true;
	}

	/**
	 * Returns whether or not the game is over.
	 * @return {bool} true if over
	 */
	function isGameOver() { return (playerHand.length < 1 || opponentHand.length < 1); }

	/**
	 * Plays a card, unless the board position is occupied by another card.
	 * @param {array} hand the hand of cards
	 * @param {int} index the index in the hand [0, 4]
	 * @param {int} position the position on the board [0, 8]
	 * @return {bool} true if a card was played, false if position already taken
	 */
	function playCard(hand, index, position) {
		if (board[position] !== undefined)
			return false;

		// set card
		var card = hand[index];
		card.playAtPosition(position, index);
		board[position] = card;
		Game.Sound.CARD.play();
		hand.splice(index, 1);
		selectedCard = 0;
		selectedPosition = -1;

		// calculate the results
		result = new CardResult(card, position, board, elements);

		return true;
	}

	/**
	 * Processes a card result by changing card owners and adjusting score.
	 * @param {array} resultList the list of affected cards
	 */
	function cardResult(resultList) {
		var owner = result.getSourceCard().owner;
		for (var i = 0, len = resultList.length; i < len; i++) {
			var card = resultList[i];
			if (card.owner != owner) {
				card.changeOwner();
				if (card.owner == Game.PLAYER) {
					playerScore++;
					opponentScore--;
				} else {
					playerScore--;
					opponentScore++;
				}
			}
		}
		Game.Sound.TURN.play();
		forceRender = true;
	}
};

/** Player/opponent constants. */
Game.PLAYER = true;
Game.OPPONENT = false;

/** Card length. */
Game.CARD_LENGTH = window.innerHeight * 0.29;

/** Whether or not the game is paused. */
Game.isPaused = false;

/** Whether or not game sounds are muted. */
Game.isMuted = false;

/**
 * Shuffles an array.
 * @param {array} o the array
 * @return {array} the shuffled array
 * @author Jonas Raoni Soares Silva (http://jsfromhell.com/array/shuffle)
 */
function shuffle(o) {
	for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
		;
	return o;
};

window.onload = function() {
	// prevent default key actions
	jaws.preventDefaultKeys([
		"z", "enter", "x", "backspace", "f1", "f5", "esc",
		"up", "down", "left", "right"]);

	// add game rules to popup display
	Game.updateRuleDisplay();

	// turn deck elements into Card objects
	for (var i = 0, len = Game.deck.length; i < len; i++) {
		Game.deck[i] = new Card(Game.deck[i]);
		jaws.assets.add(Game.deck[i].getFileName());
	}

	Game.Image.addAssets();
	Game.Sound.setup();

	jaws.start(Game, {fps: Game.settings.FPS});
}