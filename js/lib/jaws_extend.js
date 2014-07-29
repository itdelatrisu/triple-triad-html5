/** Draw sprite on active canvas at a location. */
jaws.Sprite.prototype.drawAt = function(x, y) {
	this.x = x;
	this.y = y;
	this.draw();
}

/** Draw sprite on active canvas centered at a location. */
jaws.Sprite.prototype.drawCentered = function(x, y) {
	this.drawAt(x - (this.width / 2), y - (this.height / 2));
}

/** Resizes sprite using the given base scale factor. */
jaws.Sprite.prototype.setScale = function(value) {
	this.baseScale = value;
	this.scaleTo(value);
}

/** Resizes sprite, taking into account the base scale factor. */
jaws.Sprite.prototype.scaleToBase = function(value) {
	var baseScale = this.baseScale || 1;
	this.scaleTo(value * baseScale);
}

/** Draw scaled sprite on active canvas at a location. */
jaws.Sprite.prototype.drawScaledAt = function(x, y, scale) {
	if (scale == 1)
		this.drawAt(x, y);
	else {
		this.scaleToBase(scale);
		this.drawAt(x, y);
		this.scaleToBase(1);
	}
}

/** Draw scaled sprite on active canvas centered at a location. */
jaws.Sprite.prototype.drawScaledCentered = function(x, y, scale) {
	if (scale == 1)
		this.drawCentered(x, y);
	else {
		this.scaleToBase(scale);
		this.drawCentered(x, y);
		this.scaleToBase(1);
	}
}