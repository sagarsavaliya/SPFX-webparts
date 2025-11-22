var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { PropertyPaneFieldType } from '@microsoft/sp-property-pane';
var TabsPropertyPane = /** @class */ (function () {
    function TabsPropertyPane(targetProperty, properties) {
        this.type = PropertyPaneFieldType.Custom;
        this.targetProperty = targetProperty;
        this.properties = __assign(__assign({}, properties), { key: "TabsPropertyPane_".concat(targetProperty), onRender: this.onRender.bind(this), onDispose: this.onDispose.bind(this) });
    }
    TabsPropertyPane.prototype.onRender = function (elem) {
        this.elem = elem;
        this.render();
    };
    TabsPropertyPane.prototype.onDispose = function (elem) {
        elem.innerHTML = '';
    };
    TabsPropertyPane.prototype.render = function () {
        if (this.elem) {
            this.renderContent(this.elem);
        }
    };
    TabsPropertyPane.prototype.renderContent = function (elem) {
        var _this = this;
        elem.innerHTML = '';
        var container = document.createElement('div');
        container.style.marginTop = '10px';
        var title = document.createElement('div');
        title.style.marginBottom = '10px';
        title.style.fontWeight = '600';
        title.textContent = 'Manage Tabs';
        container.appendChild(title);
        // Render each tab
        this.properties.tabs.forEach(function (tab, index) {
            var tabCard = _this.createTabCard(tab, index);
            container.appendChild(tabCard);
        });
        // Add new tab button
        var addButton = document.createElement('button');
        addButton.textContent = '+ Add New Tab';
        addButton.style.padding = '8px 16px';
        addButton.style.backgroundColor = '#0078d4';
        addButton.style.color = 'white';
        addButton.style.border = 'none';
        addButton.style.borderRadius = '2px';
        addButton.style.cursor = 'pointer';
        addButton.style.fontSize = '14px';
        addButton.style.marginTop = '8px';
        addButton.onclick = function () { return _this.handleAddTab(); };
        container.appendChild(addButton);
        elem.appendChild(container);
    };
    TabsPropertyPane.prototype.createTabCard = function (tab, index) {
        var _this = this;
        var card = document.createElement('div');
        card.style.border = '1px solid #edebe9';
        card.style.padding = '12px';
        card.style.marginBottom = '8px';
        card.style.borderRadius = '2px';
        card.style.backgroundColor = '#faf9f8';
        // Header row with name and buttons
        var headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.alignItems = 'center';
        headerRow.style.gap = '8px';
        headerRow.style.marginBottom = '8px';
        // Name field container
        var nameContainer = document.createElement('div');
        nameContainer.style.flex = '1';
        var nameLabel = document.createElement('label');
        nameLabel.style.display = 'block';
        nameLabel.style.fontSize = '12px';
        nameLabel.style.marginBottom = '4px';
        nameLabel.textContent = 'Tab Name';
        nameContainer.appendChild(nameLabel);
        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = tab.name;
        nameInput.style.width = '-webkit-fill-available';
        nameInput.style.padding = '6px 8px';
        nameInput.style.fontSize = '14px';
        nameInput.style.border = '1px solid #8a8886';
        nameInput.style.borderRadius = '2px';
        nameInput.onchange = function () { return _this.handleTabNameChange(index, nameInput.value); };
        nameContainer.appendChild(nameInput);
        headerRow.appendChild(nameContainer);
        // Buttons container
        var buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '4px';
        buttonsContainer.style.marginTop = '18px';
        // Delete button with SVG trash icon
        var deleteButton = document.createElement('button');
        deleteButton.innerHTML = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M6.5 1h3a.5.5 0 0 1 .5.5v1h4a.5.5 0 0 1 0 1h-.441l-.443 10.5a1 1 0 0 1-1 .95h-8.23a1 1 0 0 1-1-.95L2.44 3.5H2a.5.5 0 0 1 0-1h4v-1a.5.5 0 0 1 .5-.5zM3.45 3.5l.429 10.5h8.24l.43-10.5H3.45zM6.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z\"/></svg>";
        deleteButton.title = 'Delete';
        deleteButton.style.padding = '6px';
        deleteButton.style.backgroundColor = 'transparent';
        deleteButton.style.color = '#a4262c';
        deleteButton.style.border = '1px solid #8a8886';
        deleteButton.style.borderRadius = '2px';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.display = 'flex';
        deleteButton.style.alignItems = 'center';
        deleteButton.style.justifyContent = 'center';
        deleteButton.style.width = '32px';
        deleteButton.style.height = '32px';
        deleteButton.onmouseover = function () {
            deleteButton.style.backgroundColor = '#fef0f1';
            deleteButton.style.borderColor = '#a4262c';
        };
        deleteButton.onmouseout = function () {
            deleteButton.style.backgroundColor = 'transparent';
            deleteButton.style.borderColor = '#8a8886';
        };
        deleteButton.onclick = function () { return _this.handleDeleteTab(index); };
        buttonsContainer.appendChild(deleteButton);
        headerRow.appendChild(buttonsContainer);
        card.appendChild(headerRow);
        // Email field
        var emailLabel = document.createElement('label');
        emailLabel.style.display = 'block';
        emailLabel.style.fontSize = '12px';
        emailLabel.style.marginBottom = '4px';
        emailLabel.textContent = 'Top Person Email';
        card.appendChild(emailLabel);
        var emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.value = tab.topPersonEmail;
        emailInput.placeholder = 'user@ccmcnet.com';
        emailInput.style.width = '-webkit-fill-available';
        emailInput.style.padding = '6px 8px';
        emailInput.style.fontSize = '14px';
        emailInput.style.border = '1px solid #8a8886';
        emailInput.style.borderRadius = '2px';
        emailInput.onchange = function () { return _this.handleTopPersonChange(index, emailInput.value); };
        card.appendChild(emailInput);
        return card;
    };
    TabsPropertyPane.prototype.handleTabNameChange = function (index, value) {
        var newTabs = __spreadArray([], this.properties.tabs, true);
        newTabs[index] = __assign(__assign({}, newTabs[index]), { name: value });
        this.updateTabs(newTabs);
    };
    TabsPropertyPane.prototype.handleTopPersonChange = function (index, value) {
        var newTabs = __spreadArray([], this.properties.tabs, true);
        newTabs[index] = __assign(__assign({}, newTabs[index]), { topPersonEmail: value });
        this.updateTabs(newTabs);
    };
    TabsPropertyPane.prototype.handleDeleteTab = function (index) {
        if (confirm("Are you sure you want to delete the tab \"".concat(this.properties.tabs[index].name, "\"?"))) {
            var newTabs = this.properties.tabs.filter(function (_, i) { return i !== index; });
            this.updateTabs(newTabs);
        }
    };
    TabsPropertyPane.prototype.handleAddTab = function () {
        var newTab = {
            id: "tab_".concat(Date.now()),
            name: 'New Tab',
            topPersonEmail: ''
        };
        var newTabs = __spreadArray(__spreadArray([], this.properties.tabs, true), [newTab], false);
        this.updateTabs(newTabs);
    };
    TabsPropertyPane.prototype.updateTabs = function (newTabs) {
        this.properties.tabs = newTabs;
        this.properties.onTabsChange(newTabs);
        this.render();
    };
    return TabsPropertyPane;
}());
export { TabsPropertyPane };
export function PropertyPaneTabsField(targetProperty, properties) {
    return new TabsPropertyPane(targetProperty, properties);
}
//# sourceMappingURL=TabsPropertyPane.js.map