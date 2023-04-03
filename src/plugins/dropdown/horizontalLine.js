import EditorDependency from '../../dependency';
import {
	domUtils
} from '../../helper';

const HorizontalLine = function (editor) {
	// plugin bisic properties
	EditorDependency.call(this, editor);
	this.title = this.lang.horizontalLine;
	this.icon = this.icons.horizontal_line;

	// create HTML
	const HRMenus = CreateHTML(editor);

	// members
	this.list = HRMenus.querySelectorAll('button');

	// init
	this.menu.initDropdownTarget(HorizontalLine.key, HRMenus);
	this.eventManager.addEvent(HRMenus.querySelector('ul'), 'click', OnClickMenu.bind(this));
};

HorizontalLine.key = 'horizontalLine';
HorizontalLine.type = 'dropdown';
HorizontalLine.className = '';
HorizontalLine.prototype = {
	/**
	 * @override core
	 */
	active: function (element) {
		domUtils.removeClass(this.currentHR, 'on');
		if (element && /HR/i.test(element.nodeName)) {
			domUtils.addClass(element, 'on');
			this.currentHR = element;
			return true;
		} else {
			this.currentHR = null;
			return false;
		}
	},

	/**
	 * @override core
	 * @param {Element} referNode HR element
	 */
	action: function (referNode) {
		const hr = referNode.cloneNode(false);
		this.editor.focus();
		this.component.insert(hr, false, false, false);
		this.menu.dropdownOff();
		
		const line = this.format.addLine(hr);
		this.selection.setRange(line, 1, line, 1);
	},

	constructor: HorizontalLine
};

function OnClickMenu(e) {
	e.preventDefault();
	e.stopPropagation();

	const target = domUtils.getCommandTarget(e.target);
	if (!target) return;

	this.action(target.firstElementChild);
}

function CreateHTML(editor) {
	const lang = editor.lang;
	const items = editor.options.get('hrItems') || [{
			name: lang.hr_solid,
			class: '__se__solid'
		},
		{
			name: lang.hr_dashed,
			class: '__se__dashed'
		},
		{
			name: lang.hr_dotted,
			class: '__se__dotted'
		}
	];

	let list = '';
	for (let i = 0, len = items.length; i < len; i++) {
		list +=
			'<li>' +
			'<button type="button" class="se-btn-list" data-command="horizontalLine" data-value="' +
			items[i].class +
			'" title="' +
			items[i].name +
			'" aria-label="' +
			items[i].name +
			'">' +
			'<hr' +
			(items[i].class ? ' class="' + items[i].class + '"' : '') +
			(items[i].style ? ' style="' + items[i].style + '"' : '') +
			'/>' +
			'</button>' +
			'</li>';
	}

	return domUtils.createElement('DIV', {
		class: 'se-dropdown se-list-layer se-list-line'
	}, '<div class="se-list-inner">' + '<ul class="se-list-basic">' + list + '</ul>' + '</div>');
}

export default HorizontalLine;