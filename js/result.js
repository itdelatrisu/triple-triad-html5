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
 * Data type determining the results of placing a card.
 * @param {object} card source card
 * @param {int} position source card position
 * @param {array} board current board
 * @param {array} elements current element board
 */
function CardResult(card, position, board, elements) {
	/** Card result lists. */
	var captured = [];
	var same = (Game.rules.SAME) ? [] : undefined;
	var plus = undefined;
	var combo = undefined;

	/** Total number of cards captured in this result (all rules and combos). */
	var capturedCount = 0;

	/** Card owners on the board. */
	var owners = undefined;

	/** Card sums list. */
	var sums = (Game.rules.PLUS) ? { "list": [] } : undefined;

	// calculate all results
	(function() {
		// store owners (for "combo")
		if (Game.rules.COMBO) {
			owners = [];
			for (var i = 0; i < 9; i++) {
				if (board[i] !== undefined)
					owners[i] = board[i].owner;
			}
		}

		// if "Same Wall" has been triggered
		var sameWall = false;

		// process card results on all sides (if valid)
		// set "Same Wall" status on borders
		if (position % 3 != 0)
			calcResult(card, position, Card.RANK_LEFT, position - 1, Card.RANK_RIGHT);
		else if (card.ranks[Card.RANK_LEFT] == 10)
			sameWall = true;
		if (position % 3 != 2)
			calcResult(card, position, Card.RANK_RIGHT, position + 1, Card.RANK_LEFT);
		else if (card.ranks[Card.RANK_RIGHT] == 10)
			sameWall = true;
		if (position > 2)
			calcResult(card, position, Card.RANK_TOP, position - 3, Card.RANK_BOTTOM);
		else if (card.ranks[Card.RANK_TOP] == 10)
			sameWall = true;
		if (position < 6)
			calcResult(card, position, Card.RANK_BOTTOM, position + 3, Card.RANK_TOP);
		else if (card.ranks[Card.RANK_BOTTOM] == 10)
			sameWall = true;

		// check captured
		if (captured.length < 1)
			captured = undefined;

		// check "same"
		if (same !== undefined) {
			var isValid = false;
			var minSize = (sameWall && Game.rules.SAME_WALL) ? 1 : 2;
			var len = same.length;
			if (len >= minSize) {
				for (var i = 0; i < len; i++) {
					if (same[i].owner != card.owner) {
						isValid = true;
						capturedCount++;
					}
				}
			}
			if (isValid) {
				sums = undefined;
				filterCaptured(same);
				calcCombo(same);
			} else
				same = undefined;
		}

		// check "plus"
		if (sums !== undefined) {
			for (var i = 0, len = sums.list.length; i < len; i++) {
				var sumList = sums[sums.list[i]];
				var listLen = sumList.length;
				if (listLen >= 2) {
					var isValid = false;
					for (var j = 0; j < listLen; j++) {
						if (sumList[j].owner != card.owner) {
							isValid = true;
							capturedCount++;
						}
					}
					if (isValid) {
						plus = sumList;
						filterCaptured(plus);
						calcCombo(plus);
						break;
					} else
						capturedCount = 0;
				}
			}
			sums = undefined;
		}

		if (captured !== undefined)
			capturedCount += captured.length;
	})();

	/**
	 * Processes card results for a source and target card.
	 * @param {object} source the source card
	 * @param {int} sourcePosition the source board position
	 * @param {int} sourceLocation the source rank location
	 * @param {int} targetPosition the target board position
	 * @param {int} targetLocation the target rank location
	 */
	function calcResult(source, sourcePosition, sourceLocation, targetPosition, targetLocation) {
		var target = board[targetPosition];
		if (target === undefined)  // target position is empty
			return;

		var sourceRank = source.ranks[sourceLocation];
		var targetRank = target.ranks[targetLocation];

		// add to "same" list
		if (same !== undefined) {
			if (sourceRank == targetRank)
				same.push(target);
		}

		// add to "plus" list
		if (sums !== undefined) {
			var sum = sourceRank + targetRank;
			var sumList = sums[sum];
			if (sumList === undefined) {
				sums[sum] = sumList = [];
				sums.list.push(sum);
			}
			sumList.push(target);
		}

		// add to "captured" list
		if (captures(source, sourcePosition, sourceLocation, source.owner,
				targetPosition, targetLocation, target.owner))
			captured.push(target);
	}

	/**
	 * Returns whether or not the source card rank is greater than
	 * the target card rank, taking elements into account.
	 * @param {object} source the source card
	 * @param {int} sourcePosition the source board position
	 * @param {int} sourceLocation the source rank location
	 * @param {bool} sourceOwner the source card owner
	 * @param {int} targetPosition the target board position
	 * @param {int} targetLocation the target rank location
	 * @param {bool} targetOwner the target card owner
	 * @return {bool} true if source card "captures" target card
	 */
	function captures(source, sourcePosition, sourceLocation, sourceOwner,
			targetPosition, targetLocation, targetOwner) {
		var target = board[targetPosition];
		if (target === undefined)  // target position is empty
			return false;

		if (sourceOwner == targetOwner)  // same owner: don't check capture
			return false;

		var sourceRank = source.ranks[sourceLocation];
		var targetRank = target.ranks[targetLocation];
		if (elements !== undefined) {
			// element bonuses
			if (elements[sourcePosition] != Game.Element.NEUTRAL)
				sourceRank += (source.element == elements[sourcePosition]) ? 1 : -1;
			if (elements[targetPosition] != Game.Element.NEUTRAL)
				targetRank += (target.element == elements[targetPosition]) ? 1 : -1;
		}
		return (sourceRank > targetRank);
	}

	/**
	 * Removes all cards in the captured list contained in the given result list.
	 * If the captured list is empty afterwards, it will be set to null.
	 * @param {array} resultList the list of cards to be used as a filter
	 */
	function filterCaptured(resultList) {
		if (captured === undefined)
			return;

		var len = captured.length;
		while (len--) {
			var c = captured[len];
			if (resultList.indexOf(c) != -1)
				captured.splice(len, 1);
			else if (owners !== undefined)
				owners[c.position] = card.owner;
		}
		if (captured.length < 1)
			captured = undefined;
	}

	/**
	 * Checks for and processes combos.
	 * @param {array} resultList the list of cards used to initiate the combo
	 */
	function calcCombo(resultList) {
		if (owners === undefined)  // rule not active
			return;

		// change owners on copied owners board
		var cardOwner = card.owner;
		var len = resultList.length;
		for (var i = 0; i < len; i++)
			owners[resultList[i].position] = cardOwner;

		// calculate captures
		var comboSet = {};
		var comboList = [];
		for (var i = 0; i < len; i++) {
			var c = resultList[i];
			if (c.owner == cardOwner)
				continue;

			var pos = c.position;
			if (pos % 3 != 0 &&
				captures(c, pos, Card.RANK_LEFT, owners[pos], pos - 1, Card.RANK_RIGHT, owners[pos - 1]))
				comboSet[pos - 1] = true;
			if (pos % 3 != 2 &&
				captures(c, pos, Card.RANK_RIGHT, owners[pos], pos + 1, Card.RANK_LEFT, owners[pos + 1]))
				comboSet[pos + 1] = true;
			if (pos > 2 &&
				captures(c, pos, Card.RANK_TOP, owners[pos], pos - 3, Card.RANK_BOTTOM, owners[pos - 3]))
				comboSet[pos - 3] = true;
			if (pos < 6 &&
				captures(c, pos, Card.RANK_BOTTOM, owners[pos], pos + 3, Card.RANK_TOP, owners[pos + 3]))
				comboSet[pos + 3] = true;
		}
		for (var prop in comboSet) {
			comboList.push(board[prop]);
			capturedCount++;
		}
		if (comboList.length < 1)  // no captures
			return;

		// add new "combo" list
		if (combo === undefined)
			combo = [];
		combo.push(comboList);

		// chain combos
		calcCombo(comboList);
	}

	/**
	 * Returns whether or not the result contains a normal capture.
	 * @return {bool} true if capture
	 */
	this.hasCapture = function() { return captured !== undefined; };

	/**
	 * Returns whether or not the result invoked the "Same" rule.
	 * @return {bool} true if "Same"
	 */
	this.isSame = function() { return same !== undefined; };

	/**
	 * Returns whether or not the result invoked the "Plus" rule.
	 * @return {bool} true if "Plus"
	 */
	this.isPlus = function() { return plus !== undefined; };

	/**
	 * Returns whether or not there are any (remaining) "Combo" lists.
	 * @return {bool} true if lists exist
	 */
	this.hasCombo = function() { return (combo !== undefined && combo.length > 0); };

	/**
	 * Returns the list of cards invoking the "Same" rule.
	 * @return {array} "Same" card list, or null if rule not invoked
	 */
	this.getSameList = function() { return same; };

	/**
	 * Returns the list of cards invoking the "Plus" rule.
	 * @return {array} "Plus" card list, or null if rule not invoked
	 */
	this.getPlusList = function() { return plus; };

	/**
	 * Returns the next "Combo" list, if any exist.
	 * @return {array} "Combo" card list, or null if none (remaining)
	 */
	this.nextCombo = function() { return this.hasCombo() ? combo.splice(0, 1)[0] : null; };

	/**
	 * Returns the list of captured cards.
	 * @return {array} captured card list, or null if "Same" or "Plus" rule invoked
	 */
	this.getCapturedList = function() { return captured; };

	/**
	 * Returns the total number of cards captured in this result, including
	 * all rules and combos. 
	 * @return {int} the number of captured cards
	 */
	this.getCapturedCount = function() { return capturedCount; };

	/**
	 * Returns the source card for this result.
	 * @return {object} the source Card
	 */
	this.getSourceCard = function() { return card; };
}