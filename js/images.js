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
 * Game images.
 */
Game.Image = {
	/** Card-related images. */
	CARD_BACK: undefined,
	CARD_RED: undefined,
	CARD_BLUE: undefined,
	CARD_GRAY: undefined,

	/** Cursor image. */
	CURSOR: undefined,

	/** Rank symbols. */
	RANK: [],

	/** Score symbols. */
	SCORE: [],

	/** Bonus +1/-1 images. */
	BONUS_PLUS: undefined,
	BONUS_MINUS: undefined,

	/** Special rule images. */
	SPECIAL_SAME: undefined,
	SPECIAL_PLUS: undefined,
	SPECIAL_COMBO: undefined,

	/** Result images. */
	RESULT_WIN: undefined,
	RESULT_LOSE: undefined,
	RESULT_DRAW: undefined,

	/** Info box images. */
	INFO_BOX: undefined,
	INFO_TEXT: undefined,

	/**
	 * Adds all assets.
	 */
	addAssets: function() {
		var files = [
			"bonus", "card", "card-back", "element", "rank", "result", "score",
			"special", "spinner", "cursor", "info-box", "info-text"
		];
		for (var i = 0, len = files.length; i < len; i++)
			jaws.assets.add("img/" + files[i] + ".png");
	},

	/**
	 * Initializes all game images.
	 */
	setup: function() {
		// card-related
		Game.Image.CARD_BACK = new jaws.Sprite({image: "img/card-back.png"});
		var cards = new jaws.SpriteSheet({image: "img/card.png", frame_size: [256, 256] });
		Game.Image.CARD_RED = new jaws.Sprite({});
		Game.Image.CARD_BLUE = new jaws.Sprite({});
		Game.Image.CARD_GRAY = new jaws.Sprite({});
		Game.Image.CARD_RED.setImage(cards.frames[0]);
		Game.Image.CARD_BLUE.setImage(cards.frames[1]);
		Game.Image.CARD_GRAY.setImage(cards.frames[2]);

		// cursor
		Game.Image.CURSOR = new jaws.Sprite({image: "img/cursor.png"});

		// element animations
		var ele = new jaws.Animation({sprite_sheet: "img/element.png",
			frame_size: [64, 64], frame_duration: 100});
		Game.Element.anim = [ undefined,
			ele.slice(4, 8), ele.slice(24, 28), ele.slice(0, 4), ele.slice(20, 24),
			ele.slice(12, 16), ele.slice(28, 32), ele.slice(16, 20), ele.slice(8, 12)
		];
		for (var i = 1; i < 9; i++) {
			Game.Element.sprite[i] = new jaws.Sprite({});
			Game.Element.sprite[i].setImage(Game.Element.anim[i].next());
			Game.Element.firstFrame[i] = new jaws.Sprite({});
			Game.Element.firstFrame[i].setImage(Game.Element.anim[i].currentFrame());
		}

		// rank symbols
		var rank = new jaws.SpriteSheet({image: "img/rank.png", frame_size: [32, 28] });
		for (var i = 0; i <= 10; i++) {
			Game.Image.RANK[i] = new jaws.Sprite({});
			Game.Image.RANK[i].setImage(rank.frames[i]);
		}

		// score symbols
		var score = new jaws.SpriteSheet({image: "img/score.png", frame_size: [96, 96] });
		for (var i = 1; i <= 9; i++) {
			Game.Image.SCORE[i] = new jaws.Sprite({});
			Game.Image.SCORE[i].setImage(score.frames[i - 1]);
		}

		// bonus images
		var bonus = new jaws.SpriteSheet({image: "img/bonus.png", frame_size: [96, 64] });
		Game.Image.BONUS_PLUS = new jaws.Sprite({});
		Game.Image.BONUS_PLUS.setImage(bonus.frames[0]);
		Game.Image.BONUS_MINUS = new jaws.Sprite({});
		Game.Image.BONUS_MINUS.setImage(bonus.frames[1]);

		// special rules
		var special = new jaws.SpriteSheet({image: "img/special.png", frame_size: [1024, 256] });
		Game.Image.SPECIAL_SAME = new jaws.Sprite({});
		Game.Image.SPECIAL_SAME.setImage(special.frames[0]);
		Game.Image.SPECIAL_PLUS = new jaws.Sprite({});
		Game.Image.SPECIAL_PLUS.setImage(special.frames[1]);
		Game.Image.SPECIAL_COMBO = new jaws.Sprite({});
		Game.Image.SPECIAL_COMBO.setImage(special.frames[2]);

		// results
		var result = new jaws.SpriteSheet({image: "img/result.png", frame_size: [1024, 195] });
		Game.Image.RESULT_WIN = new jaws.Sprite({});
		Game.Image.RESULT_WIN.setImage(result.frames[0]);
		Game.Image.RESULT_LOSE = new jaws.Sprite({});
		Game.Image.RESULT_LOSE.setImage(result.frames[1]);
		Game.Image.RESULT_DRAW = new jaws.Sprite({});
		Game.Image.RESULT_DRAW.setImage(result.frames[2]);

		// info box
		Game.Image.INFO_BOX = new jaws.Sprite({image: "img/info-box.png"});
		Game.Image.INFO_TEXT = new jaws.Sprite({image: "img/info-text.png"});

		// spinner animations
		var spin = new jaws.Animation({sprite_sheet: "img/spinner.png",
			frame_size: [24, 33], frame_duration: 200});
		for (var i = 0; i < 8; i++) {
			Game.Spinner.anim[i] = spin.slice(i * 4, (i + 1) * 4);
			Game.Spinner.sprite[i] = new jaws.Sprite({});
			Game.Spinner.sprite[i].setImage(Game.Spinner.anim[i].next());
			Game.Spinner.frameLeft[i] = new jaws.Sprite({});
			Game.Spinner.frameLeft[i].setImage(Game.Spinner.anim[i].frames[3]);
			Game.Spinner.frameRight[i] = new jaws.Sprite({});
			Game.Spinner.frameRight[i].setImage(Game.Spinner.anim[i].frames[1]);
		}

		// resize images
		Game.Image.resize();
	},

	/**
	 * Resizes all game images.
	 */
	resize: function() {
		var baseScale = Game.CARD_LENGTH / 256;

		// card-related
		Game.Image.CARD_BACK.setScale(baseScale);
		Game.Image.CARD_RED.setScale(baseScale);
		Game.Image.CARD_BLUE.setScale(baseScale);
		Game.Image.CARD_GRAY.setScale(baseScale);

		// cursor
		Game.Image.CURSOR.setScale(baseScale / 2.25);

		// element animations
		for (var i = 1; i < 9; i++) {
			Game.Element.sprite[i].setScale(baseScale);
			Game.Element.firstFrame[i].setScale(baseScale);
		}

		// rank symbols
		for (var i = 0; i <= 10; i++)
			Game.Image.RANK[i].setScale(baseScale);

		// score symbols
		for (var i = 1; i <= 9; i++)
			Game.Image.SCORE[i].setScale(baseScale);

		// bonus images
		Game.Image.BONUS_PLUS.setScale(baseScale);
		Game.Image.BONUS_MINUS.setScale(baseScale);

		// special rules
		Game.Image.SPECIAL_SAME.setScale(baseScale);
		Game.Image.SPECIAL_PLUS.setScale(baseScale);
		Game.Image.SPECIAL_COMBO.setScale(baseScale);

		// results
		Game.Image.RESULT_WIN.setScale(baseScale);
		Game.Image.RESULT_LOSE.setScale(baseScale);
		Game.Image.RESULT_DRAW.setScale(baseScale);

		// info box
		var infoScale = Game.CARD_LENGTH * 2.75 / 1024;
		Game.Image.INFO_BOX.setScale(infoScale);
		Game.Image.INFO_TEXT.setScale(infoScale);

		// spinner animations
		var spinScale = baseScale * 2.5;
		for (var i = 0; i < 8; i++) {
			Game.Spinner.sprite[i].setScale(spinScale);
			Game.Spinner.frameLeft[i].setScale(spinScale);
			Game.Spinner.frameRight[i].setScale(spinScale);
		}
	}
};

/**
 * Elements.
 */
Game.Element = {
	NEUTRAL: 0,
	FIRE: 1,
	WATER: 2,
	EARTH: 3,
	THUNDER: 4,
	ICE: 5,
	WIND: 6,
	POISON: 7,
	HOLY: 8,

	/** First frame sprites. */
	firstFrame: [],

	/** Sprite objects. */
	sprite: [],

	/** Animation objects. */
	anim: [],

	/**
	 * Updates all sprites and animations.
	 * @param {array} board the current board
	 */
	update: function(elements) {
		for (var i = 0, len = elements.length; i < len; i++) {
			if (elements[i] != Game.Element.NEUTRAL)
				Game.Element.sprite[elements[i]].setImage(Game.Element.anim[elements[i]].next());
		}
	},

	/**
	 * Returns a random board of elements.
	 * @return {array} an array of size 9, with each index containing an element
	 */
	getRandomBoard: function() {
		// shuffle elements
		var elements = shuffle([0,1,2,3,4,5,6,7,8]);

		// build array
		var board = [];
		for (var i = 0; i < 9; i++)
			board[i] = (Math.random() < 0.25) ? elements.pop() : Game.Element.NEUTRAL;
		return board;
	},

	/**
	 * Draws the element at a position on the board.
	 * If a card is in the position, a +1 or -1 bonus will be drawn instead.
	 * @param {int} element the element
	 * @param {int} pos the board position [0, 8]
	 * @param {object} card the card at the position
	 */
	drawOnBoard: function(element, pos, card) {
		if (element == Game.Element.NEUTRAL)
			return;

		var x = (jaws.width / 2) - ((1 - (pos % 3)) * Game.CARD_LENGTH);
		var y = (jaws.height / 2) - ((1 - Math.floor(pos / 3)) * Game.CARD_LENGTH);
		if (card === undefined || card.isPlaying())
			Game.Element.sprite[element].drawCentered(x, y);
		else if (card.element == element)
			Game.Image.BONUS_PLUS.drawCentered(x, y);
		else
			Game.Image.BONUS_MINUS.drawCentered(x, y);
	}
};

/**
 * Character spinners.
 */
Game.Spinner = {
	/** Left/right frame sprites. */
	frameLeft: [],
	frameRight: [],

	/** Sprite objects. */
	sprite: [],

	/** Animation objects. */
	anim: [],

	/**
	 * Updates all sprites and animations.
	 * @param {int} spinner the spinner index
	 */
	update: function(spinner) {
		Game.Spinner.sprite[spinner].setImage(Game.Spinner.anim[spinner].next());
	},

	/**
	 * Returns a random spinner.
	 * @return {int} a random spinner index
	 */
	getRandomSpinner: function() {
		return Math.floor(Math.random() * Game.Spinner.anim.length);
	}
}
