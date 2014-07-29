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
 * Card data type.
 * @param {object} obj the JSON object
 */
function Card(obj) {
	/** Card ID. */
	this.id = obj.id;

	/** Card name. */
	this.name = obj.name;

	/** Card ranks (top, left, right, bottom). */
	this.ranks = obj.ranks;

	/** Card element. */
	this.element = Game.Element[obj.element];

	/** Card level. */
	this.level = obj.level;

	/** Card image. */
	this.img = undefined;

	/** Card position [0, 8], or -1 if not played. */
	this.position = undefined;

	/** Card owner (PLAYER or OPPONENT). */
	this.owner = undefined;

	/** Whether or not the owner of the card recently changed. */
	this.isNewColor = false;

	/** Old hand index of the played card. */
	this.oldHandIndex = -1;
}

/** Animation progress [0, 2]. */
Card.animationProgress = 0;

/** Whether or not a color change animation is in progress. */
Card.isColorChange = false;

/** Whether or not a card placing animation is in progress. */
Card.isCardPlaying = false;

/** Card rank locations. */
Card.RANK_TOP = 0;
Card.RANK_LEFT = 1;
Card.RANK_RIGHT = 2;
Card.RANK_BOTTOM = 3;

/**
 * Updates the card animations by a delta interval.
 * @param {int} delta the delta interval since the last call
 */
Card.update = function(delta) {
	if (Card.isColorChange || Card.isCardPlaying) {
		Card.animationProgress -= delta / 300;
		if (Card.animationProgress <= 0) {
			Card.isColorChange = false;
			Card.isCardPlaying = false;
		}
	}
}

Card.prototype = {
	constructor: Card,

	/**
	 * Returns the card file name.
	 * @return {string} the file name
	 */
	getFileName: function() {
		return "img/cards/" + ("00" + this.id).slice(-3) + ".png";
	},

	/**
	 * Loads the image sprite (if not already loaded).
	 */
	loadImage: function() {
		if (this.img === undefined) {
			this.img = new jaws.Sprite({image: this.getFileName()});
			this.resize();
		}
	},

	/**
	 * Resizes the image sprite.
	 */
	resize: function() {
		if (this.img !== undefined)
			this.img.setScale(Game.CARD_LENGTH / 256);
	},

	/**
	 * Draws the card at a location.
	 * @param {float} x the x coordinate
	 * @param {float} y the y coordinate
	 */
	draw: function(x, y) {
		this.loadImage();

		// card placing: calculate scale
		var scale = 1;
		if (Card.isCardPlaying && this.oldHandIndex != -1)
			scale += (Card.animationProgress <= 1) ? Card.animationProgress / 3 : (2 - Card.animationProgress) / 3;
		else
			this.oldHandIndex = -1;

		// draw background color
		if (Card.isColorChange && this.isNewColor) {
			// color change: fade out old color, fade in new color
			var colorImg;
			var color = (Card.animationProgress <= 1) ? this.owner : !this.owner;
			if (color == Game.PLAYER)
				colorImg = Game.Image.CARD_BLUE;
			else
				colorImg = Game.Image.CARD_RED;

			// fade into a gray background
			Game.Image.CARD_GRAY.drawAt(x, y);

			var alpha = (Card.animationProgress <= 1) ? 1 - Card.animationProgress : Card.animationProgress - 1;
			colorImg.alpha = alpha;
			colorImg.drawAt(x, y);
			colorImg.alpha = 1;
		} else {
			// normal color
			var colorImg;
			if (this.owner == Game.PLAYER)
				colorImg = Game.Image.CARD_BLUE;
			else
				colorImg = Game.Image.CARD_RED;
			colorImg.drawScaledAt(x, y, scale);
			this.isNewColor = false;
		}

		// draw image
		this.img.drawScaledAt(x, y, scale);

		// draw ranks
		var rankWidth = Game.Image.RANK[0].width * scale;
		var rankHeight = Game.Image.RANK[0].height * scale;
		var rankOffset = Game.CARD_LENGTH * 0.06 * scale;
		Game.Image.RANK[this.ranks[0]].drawScaledAt(
				x + rankOffset + (rankWidth / 2), y + rankOffset, scale);
		Game.Image.RANK[this.ranks[1]].drawScaledAt(
				x + rankOffset, y + rankOffset + rankHeight, scale);
		Game.Image.RANK[this.ranks[2]].drawScaledAt(
				x + rankOffset + rankWidth, y + rankOffset + rankHeight, scale);
		Game.Image.RANK[this.ranks[3]].drawScaledAt(
				x + rankOffset + (rankWidth / 2), y + rankOffset + (rankHeight * 2), scale);

		// draw element
		if (this.element != Game.Element.NEUTRAL) {
			var e = Game.Element.firstFrame[this.element];
			e.drawScaledAt(x + (Game.CARD_LENGTH * scale * 0.94) - (e.width * scale),
					y + (Game.CARD_LENGTH * scale * 0.05), scale);
		}
	},

	/**
	 * Draws the card centered at a location.
	 * @param {float} x the center x coordinate
	 * @param {float} y the center y coordinate
	 */
	drawCentered: function(x, y) {
		this.loadImage();

		this.draw(x - (this.img.width / 2), y - (this.img.height / 2));
	},

	/**
	 * Draws the card at its position on the board.
	 */
	drawOnBoard: function() {
		var x = (jaws.width / 2) - ((1 - (this.position % 3)) * Game.CARD_LENGTH);
		var y = (jaws.height / 2) - ((1 - Math.floor(this.position / 3)) * Game.CARD_LENGTH);

		// card placing animation
		if (Card.isCardPlaying && this.oldHandIndex != -1) {
			if (Card.animationProgress >= 1) {
				this.drawInHand(this.oldHandIndex - (1.5 * (2 - Card.animationProgress) * jaws.height / Game.CARD_LENGTH), true);
				return;
			} else
				y -= Card.animationProgress * jaws.height;
		}

		this.drawCentered(x, y);
	},

	/**
	 * Draws the card at a position in the owner's hand.
	 * @param {float} pos the position [0, 4]
	 * @param {bool} selected true if the card is currently selected
	 */
	drawInHand: function(pos, selected) {
		var posX = jaws.width / 2;
		var posY = ((jaws.height / 2) - Game.CARD_LENGTH) + (pos * Game.CARD_LENGTH / 2);
		var offsetX = Game.CARD_LENGTH * ((selected) ? 1.95 : 2.1);

		if (this.owner == Game.PLAYER)
			this.drawCentered(posX + offsetX, posY);
		else {
			if (Game.rules.OPEN)
				this.drawCentered(posX - offsetX, posY);
			else {
				// draw card back (potentially scaled)
				var cardBack = Game.Image.CARD_BACK;
				if (Card.isCardPlaying && this.oldHandIndex != -1 && Card.animationProgress > 1)
					cardBack.drawScaledCentered(posX - offsetX, posY, 1 + ((2 - Card.animationProgress) / 3));
				else
					cardBack.drawCentered(posX - offsetX, posY);
			}
		}
	},

	/**
	 * Plays the card at a position and initiates the animation.
	 * @param {int} position the board position
	 * @param {int} index the hand position of the card
	 */
	playAtPosition: function(position, index) {
		this.position = position;
		this.oldHandIndex = index;

		Card.isCardPlaying = true;
		Card.animationProgress = 2;
	},

	/**
	 * Returns whether or not this card's placement is currently being animated.
	 * @return {bool} true if currently playing
	 */
	isPlaying: function() {
		return (Card.isCardPlaying && this.oldHandIndex != -1);
	},

	/**
	 * Changes the card owner and initiates color change animation.
	 */
	changeOwner: function() {
		this.owner = !this.owner;
		this.isNewColor = true;

		Card.isColorChange = true;
		Card.animationProgress = 2;
	}
}
