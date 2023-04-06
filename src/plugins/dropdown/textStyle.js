import EditorDependency from '../../dependency';
import { domUtils } from '../../helper';

const TextStyle = function (editor) {
	// plugin bisic properties
	EditorDependency.call(this, editor);
	this.title = this.lang.textStyle;
	this.icon = 'text_style';

	// create HTML
	const menu = CreateHTML(editor);

	// members
	this.styleList = menu.querySelectorAll('li button');

	// init
	this.menu.initDropdownTarget(TextStyle.key, menu);
	this.eventManager.addEvent(menu.querySelector('ul'), 'click', OnClickMenu.bind(this));
};

TextStyle.key = 'textStyle';
TextStyle.type = 'dropdown';
TextStyle.className = '';
TextStyle.prototype = {
	/**
	 * @override dropdown
	 */
	on: function () {
		const styleButtonList = this.styleList;
		const selectionNode = this.selection.getNode();

		for (let i = 0, len = styleButtonList.length, btn, data, active; i < len; i++) {
			btn = styleButtonList[i];
			data = btn.getAttribute('data-value').split(',');

			for (let v = 0, node, value; v < data.length; v++) {
				node = selectionNode;
				active = false;

				while (node && !this.format.isLine(node) && !this.component.is(node)) {
					if (node.nodeName.toLowerCase() === btn.getAttribute('data-command').toLowerCase()) {
						value = data[v];
						if (/^\./.test(value) ? domUtils.hasClass(node, value.replace(/^\./, '')) : node.style[value]) {
							active = true;
							break;
						}
					}
					node = node.parentNode;
				}

				if (!active) break;
			}

			active ? domUtils.addClass(btn, 'active') : domUtils.removeClass(btn, 'active');
		}
	},

	/**
	 * @override core
	 * @param {Element} tempElement text style template element
	 * @param {Element} targetElement current menu target
	 */
	action: function (tempElement, targetElement) {
		const checkStyles = tempElement.style.cssText.replace(/:.+(;|$)/g, ',').split(',');
		checkStyles.pop();

		const classes = tempElement.classList;
		for (let i = 0, len = classes.length; i < len; i++) {
			checkStyles.push('.' + classes[i]);
		}

		const newNode = domUtils.hasClass(targetElement, 'active') ? null : tempElement.cloneNode(false);
		const removeNodes = newNode ? null : [tempElement.nodeName];
		this.format.applyTextStyle(newNode, checkStyles, removeNodes, true);

		this.menu.dropdownOff();
	},

	constructor: TextStyle
};

function OnClickMenu(e) {
	e.preventDefault();
	e.stopPropagation();

	const target = domUtils.getCommandTarget(e.target);
	if (!target) return;

	this.action(target.firstChild, target);
}

function CreateHTML(editor) {
	const options = editor.options;
	const defaultList = {
		code: {
			name: editor.lang.menu_code,
			class: '__se__t-code',
			tag: 'code'
		},
		shadow: {
			name: editor.lang.menu_shadow,
			class: '__se__t-shadow',
			tag: 'span'
		}
	};
	const styleList = !options.get('textStyles') ? editor._w.Object.keys(defaultList) : options.get('textStyles');

	let list = '<div class="se-list-inner"><ul class="se-list-basic">';
	for (let i = 0, len = styleList.length, t, tag, name, attrs, command, value, _class; i < len; i++) {
		t = styleList[i];
		(attrs = ''), (value = ''), (command = []);

		if (typeof t === 'string') {
			const cssText = defaultList[t.toLowerCase()];
			if (!cssText) continue;
			t = cssText;
		}

		name = t.name;
		tag = t.tag || 'span';
		_class = t.class;

		attrs += ' class="' + t.class + '"';
		value += '.' + t.class.trim().replace(/\s+/g, ',.');
		command.push('class');

		value = value.replace(/,$/, '');

		list += '<li><button type="button" class="se-btn-list" data-command="' + tag + '" data-value="' + value + '" title="' + name + '" aria-label="' + name + '">' + '<' + tag + attrs + '>' + name + '</' + tag + '></button></li>';
	}
	list += '</ul></div>';

	return domUtils.createElement('DIV', { class: 'se-dropdown se-list-layer se-list-format' }, list);
}

export default TextStyle;
