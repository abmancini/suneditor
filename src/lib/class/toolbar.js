/**
 * @fileoverview Toolbar class
 * @author Yi JiHong.
 */

import Context from '../context';
import { domUtils, unicode } from '../../helper';
import CoreInterface from '../../interface/_core';
import { CreateToolBar } from '../constructor';

const Toolbar = function (editor) {
	CoreInterface.call(this, editor);
	this._responsiveCurrentSize = 'default';
	this._rButtonArray = editor._responsiveButtons;
	this._rButtonsize = null;
	this._sticky = false;
	this._inlineToolbarAttr = {
		top: '',
		width: '',
		isShow: false
	};

	this._setResponsive();
};

Toolbar.prototype = {
	/**
	 * @description Disable the toolbar
	 */
	disable: function () {
		/** off menus */
		this.menu.dropdownOff();
		this.menu._moreLayerOff();
		this.menu.containerOff();
		this.context.buttons.cover.style.display = 'block';
	},

	/**
	 * @description Enable the toolbar
	 */
	enable: function () {
		this.context.buttons.cover.style.display = 'none';
	},

	/**
	 * @description Show the toolbar
	 */
	show: function () {
		if (this.editor._isInline) {
			this._showInline();
		} else if (this.editor._isBalloon) {
			this._showBalloon();
		} else {
			this.context.element.toolbar.style.display = '';
			this.context.element._stickyDummy.style.display = '';
		}
	},

	/**
	 * @description Hide the toolbar
	 */
	hide: function () {
		if (this.editor._isInline) {
			this.context.element.toolbar.style.display = 'none';
			this._inlineToolbarAttr.isShow = false;
		} else {
			this.context.element.toolbar.style.display = 'none';
			this.context.element._stickyDummy.style.display = 'none';
		}
	},

	/**
	 * @description Reset the buttons on the toolbar. (Editor is not reloaded)
	 * You cannot set a new plugin for the button.
	 * @param {Array} buttonList Button list
	 */
	setButtons: function (buttonList) {
		this.menu.dropdownOff();
		this.menu.containerOff();
		this.menu._moreLayerOff();

		const newToolbar = CreateToolBar(buttonList, this.options._init_plugins, this.options);
		this.context.element.toolbar.replaceChild(newToolbar._buttonTray, this.context.element._buttonTray);
		const newContext = Context(this.context.element.originElement, this.context.element.topArea, this.context.element.wysiwygFrame, this.context.element.code, this.options);

		this.context.element = newContext.element;
		this.context.tool = newContext.tool;
		this.context.element.eventWysiwyg = this.options.iframe ? this._ww : this.context.element.wysiwyg;
		if (this.options.iframe) this.context.element.wysiwyg = this._wd.body;

		this.editor._recoverButtonStates();
		this.editor._cachingButtons();
		this.history._resetCachingButton();

		this.editor.effectNode = null;
		if (this.status.hasFocus) this.eventManager.applyTagEffect();
		if (this.status.isReadOnly) domUtils.setDisabled(this.editor.controllerOnDisabledButtons, true);
		if (typeof this.events.onSetToolbarButtons === 'function') this.events.onSetToolbarButtons(newToolbar._buttonTray.querySelectorAll('button'));
	},

	/**
	 * @description Reset buttons of the responsive toolbar.
	 */
	resetResponsiveToolbar: function () {
		this.menu.containerOff();

		const responsiveSize = this._rButtonsize;
		if (responsiveSize) {
			let w = 0;
			if ((this.editor._isBalloon || this.editor._isInline) && this.options.toolbar_width === 'auto') {
				w = this.context.element.topArea.offsetWidth;
			} else {
				w = this.context.element.toolbar.offsetWidth;
			}

			let responsiveWidth = 'default';
			for (let i = 1, len = responsiveSize.length; i < len; i++) {
				if (w < responsiveSize[i]) {
					responsiveWidth = responsiveSize[i] + '';
					break;
				}
			}

			if (this._responsiveCurrentSize !== responsiveWidth) {
				this._responsiveCurrentSize = responsiveWidth;
				this.setButtons(this._rButtonArray[responsiveWidth]);
			}
		}
	},

	_resetSticky: function () {
		if (this.status.isFullScreen || this.context.element.toolbar.offsetWidth === 0 || this.options.toolbar_sticky < 0) return;

		const ctxEl = this.context.element;
		const editorHeight = ctxEl.editorArea.offsetHeight;
		const y = (this._w.scrollY || this._d.documentElement.scrollTop) + this.options.toolbar_sticky;
		const editorTop = this.offset.getGlobal(this.options.toolbar_container).top - (this.editor._isInline ? ctxEl.toolbar.offsetHeight : 0);
		const inlineOffset = this.editor._isInline && y - editorTop > 0 ? y - editorTop - this.context.element.toolbar.offsetHeight : 0;

		if (y < editorTop) {
			this._offSticky();
		} else if (y + this.status._minHeight >= editorHeight + editorTop) {
			if (!this._sticky) this._onSticky(inlineOffset);
			ctxEl.toolbar.style.top = inlineOffset + editorHeight + editorTop + this.options.toolbar_sticky - y - this.status._minHeight + 'px';
		} else if (y >= editorTop) {
			this._onSticky(inlineOffset);
		}
	},

	_onSticky: function (inlineOffset) {
		const ctxEl = this.context.element;

		if (!this.editor._isInline && !this.options.toolbar_container) {
			ctxEl._stickyDummy.style.height = ctxEl.toolbar.offsetHeight + 'px';
			ctxEl._stickyDummy.style.display = 'block';
		}

		ctxEl.toolbar.style.top = this.options.toolbar_sticky + inlineOffset + 'px';
		ctxEl.toolbar.style.width = this.editor._isInline ? this._inlineToolbarAttr.width : ctxEl.toolbar.offsetWidth + 'px';
		domUtils.addClass(ctxEl.toolbar, 'se-toolbar-sticky');
		this._sticky = true;
	},

	_offSticky: function () {
		const ctxEl = this.context.element;

		ctxEl._stickyDummy.style.display = 'none';
		ctxEl.toolbar.style.top = this.editor._isInline ? this._inlineToolbarAttr.top : '';
		ctxEl.toolbar.style.width = this.editor._isInline ? this._inlineToolbarAttr.width : '';
		ctxEl.editorArea.style.marginTop = '';

		domUtils.removeClass(ctxEl.toolbar, 'se-toolbar-sticky');
		this._sticky = false;
	},

	_setResponsive: function () {
		if (this._rButtonArray && this._rButtonArray.length === 0) {
			this._rButtonArray = null;
			return;
		}

		this._responsiveCurrentSize = 'default';
		const sizeArray = (this._rButtonsize = []);
		const _responsiveButtons = this.editor._responsiveButtons;
		const buttonsObj = (this._rButtonArray = {
			default: _responsiveButtons[0]
		});
		for (let i = 1, len = _responsiveButtons.length, size, buttonGroup; i < len; i++) {
			buttonGroup = _responsiveButtons[i];
			size = buttonGroup[0] * 1;
			sizeArray.push(size);
			buttonsObj[size] = buttonGroup[1];
		}

		sizeArray
			.sort(function (a, b) {
				return a - b;
			})
			.unshift('default');
	},

	_showBalloon: function (rangeObj) {
		if (!this.editor._isBalloon) return;

		const range = rangeObj || this.selection.getRange();
		const toolbar = this.context.element.toolbar;
		const topArea = this.context.element.topArea;
		const selection = this.selection.get();

		let isDirTop;
		if (this.editor._isBalloonAlways && range.collapsed) {
			isDirTop = true;
		} else if (selection.focusNode === selection.anchorNode) {
			isDirTop = selection.focusOffset < selection.anchorOffset;
		} else {
			const childNodes = domUtils.getListChildNodes(range.commonAncestorContainer, null);
			isDirTop = domUtils.getArrayIndex(childNodes, selection.focusNode) < domUtils.getArrayIndex(childNodes, selection.anchorNode);
		}

		let rects = range.getClientRects();
		rects = rects[isDirTop ? 0 : rects.length - 1];

		const globalScroll = this.offset.getGlobalScroll();
		let scrollLeft = globalScroll.left;
		let scrollTop = globalScroll.top;

		const editorWidth = topArea.offsetWidth;
		const offsets = this.offset.getGlobal(this.context.element.topArea);
		const stickyTop = offsets.top;
		const editorLeft = offsets.left;

		toolbar.style.top = '-10000px';
		toolbar.style.visibility = 'hidden';
		toolbar.style.display = 'block';

		if (!rects) {
			const node = this.selection.getNode();
			if (this.format.isLine(node)) {
				const zeroWidth = domUtils.createTextNode(unicode.zeroWidthSpace);
				this.html.insertNode(zeroWidth, null, true);
				this.selection.setRange(zeroWidth, 1, zeroWidth, 1);
				this.selection._init();
				rects = this.selection.getRange().getClientRects();
				rects = rects[isDirTop ? 0 : rects.length - 1];
			}

			if (!rects) {
				const nodeOffset = this.offset.get(node);
				rects = {
					left: nodeOffset.left,
					top: nodeOffset.top,
					right: nodeOffset.left,
					bottom: nodeOffset.top + node.offsetHeight,
					noText: true
				};
				scrollLeft = 0;
				scrollTop = 0;
			}

			isDirTop = true;
		}

		const arrowMargin = this._w.Math.round(this.context.element._arrow.offsetWidth / 2);
		const toolbarWidth = toolbar.offsetWidth;
		const toolbarHeight = toolbar.offsetHeight;
		const iframeRects = /iframe/i.test(this.context.element.wysiwygFrame.nodeName) ? this.context.element.wysiwygFrame.getClientRects()[0] : null;
		if (iframeRects) {
			rects = {
				left: rects.left + iframeRects.left,
				top: rects.top + iframeRects.top,
				right: rects.right + iframeRects.right - iframeRects.width,
				bottom: rects.bottom + iframeRects.bottom - iframeRects.height
			};
		}

		this._setBalloonOffset(isDirTop, rects, toolbar, editorLeft, editorWidth, scrollLeft, scrollTop, stickyTop, arrowMargin);
		if (toolbarWidth !== toolbar.offsetWidth || toolbarHeight !== toolbar.offsetHeight) {
			this._setBalloonOffset(isDirTop, rects, toolbar, editorLeft, editorWidth, scrollLeft, scrollTop, stickyTop, arrowMargin);
		}

		if (this.options.toolbar_container) {
			const editorParent = topArea.parentElement;

			let container = this.options.toolbar_container;
			let left = container.offsetLeft;
			let top = container.offsetTop;

			while (!container.parentElement.contains(editorParent) || !/^(BODY|HTML)$/i.test(container.parentElement.nodeName)) {
				container = container.offsetParent;
				left += container.offsetLeft;
				top += container.offsetTop;
			}

			toolbar.style.left = toolbar.offsetLeft - left + topArea.offsetLeft + 'px';
			toolbar.style.top = toolbar.offsetTop - top + topArea.offsetTop + 'px';
		}

		toolbar.style.visibility = '';
	},

	_setBalloonOffset: function (isDirTop, rects, toolbarEl, editorLeft, editorWidth, scrollLeft, scrollTop, stickyTop, arrowMargin) {
		const padding = 1;
		const toolbarWidth = toolbarEl.offsetWidth;
		const toolbarHeight = rects.noText && !isDirTop ? 0 : toolbarEl.offsetHeight;

		const absoluteLeft = (isDirTop ? rects.left : rects.right) - editorLeft - toolbarWidth / 2 + scrollLeft;
		const overRight = absoluteLeft + toolbarWidth - editorWidth;

		let t = (isDirTop ? rects.top - toolbarHeight - arrowMargin : rects.bottom + arrowMargin) - (rects.noText ? 0 : stickyTop) + scrollTop;
		let l = absoluteLeft < 0 ? padding : overRight < 0 ? absoluteLeft : absoluteLeft - overRight - padding - 1;

		let resetTop = false;
		const space = t + (isDirTop ? this.offset.getGlobal(this.context.element.topArea).top : toolbarEl.offsetHeight - this.context.element.wysiwyg.offsetHeight);
		if (!isDirTop && space > 0 && this._getPageBottomSpace() < space) {
			isDirTop = true;
			resetTop = true;
		} else if (isDirTop && this._d.documentElement.offsetTop > space) {
			isDirTop = false;
			resetTop = true;
		}

		if (resetTop) t = (isDirTop ? rects.top - toolbarHeight - arrowMargin : rects.bottom + arrowMargin) - (rects.noText ? 0 : stickyTop) + scrollTop;

		toolbarEl.style.left = this._w.Math.floor(l) + 'px';
		toolbarEl.style.top = this._w.Math.floor(t) + 'px';

		if (isDirTop) {
			domUtils.removeClass(this.context.element._arrow, 'se-arrow-up');
			domUtils.addClass(this.context.element._arrow, 'se-arrow-down');
			this.context.element._arrow.style.top = toolbarHeight + 'px';
		} else {
			domUtils.removeClass(this.context.element._arrow, 'se-arrow-down');
			domUtils.addClass(this.context.element._arrow, 'se-arrow-up');
			this.context.element._arrow.style.top = -arrowMargin + 'px';
		}

		const arrow_left = this._w.Math.floor(toolbarWidth / 2 + (absoluteLeft - l));
		this.context.element._arrow.style.left = (arrow_left + arrowMargin > toolbarEl.offsetWidth ? toolbarEl.offsetWidth - arrowMargin : arrow_left < arrowMargin ? arrowMargin : arrow_left) + 'px';
	},

	_getPageBottomSpace: function () {
		return this._d.documentElement.scrollHeight - (this.offset.getGlobal(this.context.element.topArea).top + this.context.element.topArea.offsetHeight);
	},

	_showInline: function () {
		if (!this.editor._isInline) return;

		const toolbar = this.context.element.toolbar;
		if (this.options.toolbar_container) toolbar.style.position = 'relative';
		else toolbar.style.position = 'absolute';

		toolbar.style.visibility = 'hidden';
		toolbar.style.display = 'block';
		this._inlineToolbarAttr.width = toolbar.style.width = this.options.toolbar_width;
		this._inlineToolbarAttr.top = toolbar.style.top = (this.options.toolbar_container ? 0 : -1 - toolbar.offsetHeight) + 'px';

		if (typeof this.events.onShowInline === 'function') this.events.onShowInline(toolbar);

		this._resetSticky();
		this._inlineToolbarAttr.isShow = true;
		toolbar.style.visibility = '';
	},

	constructor: Toolbar
};

export default Toolbar;
