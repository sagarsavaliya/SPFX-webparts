var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Version } from '@microsoft/sp-core-library';
import { PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import styles from './OrganizationChartWebPart.module.scss';
import * as strings from 'OrganizationChartWebPartStrings';
import { initOrgChart } from './orgChartLogic';
import { PropertyPaneTabsField } from './propertyPane/TabsPropertyPane';
import { GraphService } from './services/GraphService';
var OrganizationChartWebPart = /** @class */ (function (_super) {
    __extends(OrganizationChartWebPart, _super);
    function OrganizationChartWebPart() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.orgData = null;
        _this.graphReadyPromise = null;
        _this.isLoadingData = false;
        _this.currentActiveDept = 'CCMC';
        return _this;
    }
    OrganizationChartWebPart.prototype.render = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var tabsHtml, defaultExpandDepth, chartWrapper;
            var _this = this;
            return __generator(this, function (_c) {
                console.log('=== render() called ===', {
                    hasOrgData: !!this.orgData,
                    departmentCount: ((_b = (_a = this.orgData) === null || _a === void 0 ? void 0 : _a.departments) === null || _b === void 0 ? void 0 : _b.length) || 0,
                    currentActiveDept: this.currentActiveDept,
                    isLoadingData: this.isLoadingData
                });
                tabsHtml = (this.properties.tabs || []).map(function (tab, index) {
                    return "<button class=\"".concat(styles.tab, "\" role=\"tab\" aria-selected=\"").concat(index === 0 ? 'true' : 'false', "\" data-dept=\"").concat(tab.name, "\" data-tab-id=\"").concat(tab.id, "\">").concat(tab.name, "</button>");
                }).join('');
                this.domElement.innerHTML = "\n    <section class=\"".concat(styles.organizationChart, " ").concat(!!this.context.sdks.microsoftTeams ? styles.teams : '', "\">\n      <div class=\"").concat(styles.appShell, "\">\n        <header class=\"").concat(styles.topBar, "\">\n          <div class=\"").concat(styles.brand, "\">\n            <span class=\"").concat(styles.brandMark, "\">\u25CE</span>\n            <div class=\"").concat(styles.brandCopy, "\">\n              <span class=\"").concat(styles.brandTitle, "\">Org Navigator</span>\n              <span class=\"").concat(styles.brandSubtitle, "\">Enterprise Hierarchy</span>\n            </div>\n          </div>\n\n          <nav class=\"").concat(styles.tabBar, "\" role=\"tablist\" aria-label=\"Departments\">\n            ").concat(tabsHtml, "\n          </nav>\n\n          <div class=\"").concat(styles.searchControls, "\">\n            <div class=\"").concat(styles.searchField, "\">\n              <input id=\"userSearch\" type=\"search\" placeholder=\"Search by name, title, or department\" autocomplete=\"off\" spellcheck=\"false\">\n              <button id=\"clearSearch\" type=\"button\" class=\"").concat(styles.clearSearch, "\" aria-label=\"Clear search\">\u2715</button>\n            </div>\n          </div>\n        </header>\n\n        <section class=\"").concat(styles.toolbar, "\" aria-label=\"Chart controls\">\n          <div class=\"").concat(styles.zoomControls, "\">\n            <button type=\"button\" class=\"").concat(styles.zoomBtn, "\" data-zoom=\"out\" aria-label=\"Zoom out\">\u2212</button>\n            <button type=\"button\" class=\"").concat(styles.zoomBtn, "\" data-zoom=\"reset\" aria-label=\"Reset zoom\">100%</button>\n            <button type=\"button\" class=\"").concat(styles.zoomBtn, "\" data-zoom=\"in\" aria-label=\"Zoom in\">+</button>\n          </div>\n          <div class=\"").concat(styles.hintText, "\">Drag anywhere on the canvas to pan. Scroll to zoom.</div>\n        </section>\n\n        <section class=\"").concat(styles.chartWrapper, "\">\n          <div class=\"").concat(styles.chartStage, "\">\n            <svg id=\"orgChartCanvas\" class=\"").concat(styles.orgChartCanvas, "\" role=\"group\" aria-label=\"Organization chart\"></svg>\n          </div>\n        </section>\n      </div>\n    </section>");
                // Initialize the organization chart with loaded data
                if (this.orgData) {
                    console.log('Initializing chart with data:', {
                        departments: this.orgData.departments.map(function (d) { return d.name; }),
                        activeDept: this.currentActiveDept
                    });
                    defaultExpandDepth = 1;
                    // Pass lazy loading callback and tab switch handler
                    initOrgChart(this.domElement, this.orgData, styles, defaultExpandDepth, function (nodeId) { return _this.loadNodeChildren(nodeId); }, function (tabName) { return _this.handleTabSwitch(tabName); }, this.currentActiveDept);
                }
                else {
                    console.log('No org data yet, showing loading message');
                    chartWrapper = this.domElement.querySelector(".".concat(styles.chartWrapper));
                    if (chartWrapper) {
                        chartWrapper.innerHTML = '<div style="padding: 40px; text-align: center;">Loading CCMC hierarchy...</div>';
                    }
                    // Trigger data load if not already loading
                    if (!this.isLoadingData) {
                        console.log('Triggering initial data load from render()...');
                        this.loadInitialData().catch(function (error) {
                            console.error('Error in loadInitialData:', error);
                        });
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    OrganizationChartWebPart.prototype.loadInitialData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isLoadingData || this.orgData) {
                            console.log('Skipping loadInitialData - already loading or have data');
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        console.log('Starting initial data load...');
                        if (!this.graphReadyPromise) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.graphReadyPromise];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: 
                    // Load the initial active department (CCMC by default)
                    return [4 /*yield*/, this.loadOrgData(this.currentActiveDept)];
                    case 4:
                        // Load the initial active department (CCMC by default)
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Error loading organization data:', error_1);
                        this.showError('Error loading organization data. Please check the configuration and console for details.');
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    OrganizationChartWebPart.prototype.onInit = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var firstTab, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('=== onInit START ===');
                        // Initialize default tabs if not set
                        if (!this.properties.tabs || this.properties.tabs.length === 0) {
                            this.properties.tabs = [
                                { id: 'tab_1', name: 'CCMC', topPersonEmail: 'df87625@ccmcnet.com' },
                                { id: 'tab_2', name: 'CMH', topPersonEmail: 'ddulsky@ccmcnet.com' },
                                { id: 'tab_3', name: 'Community Financial Services', topPersonEmail: 'as58741@ccmcnet.com' },
                                { id: 'tab_4', name: 'Corporate Finance & Legal', topPersonEmail: 'sm23873@ccmcnet.com' },
                                { id: 'tab_5', name: 'HR', topPersonEmail: 'U3E012231@ccmcnet.com' },
                                { id: 'tab_6', name: 'IT', topPersonEmail: 'bbustos@ccmcnet.com' }
                            ];
                        }
                        // Set the initial active department from the first tab
                        if (this.properties.tabs && this.properties.tabs.length > 0) {
                            firstTab = (_a = this.properties.tabs.find(function (tab) { var _a; return ((_a = tab.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'ccmc'; })) !== null && _a !== void 0 ? _a : this.properties.tabs[0];
                            this.currentActiveDept = firstTab.name;
                            console.log("Initial active department set to: ".concat(this.currentActiveDept));
                        }
                        // Set default data source to Azure AD
                        if (!this.properties.dataSource) {
                            this.properties.dataSource = 'azureAD';
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        console.log('Initializing GraphService...');
                        this.graphService = new GraphService(this.context);
                        this.graphReadyPromise = this.graphService.init();
                        return [4 /*yield*/, this.graphReadyPromise];
                    case 2:
                        _b.sent();
                        console.log('GraphService initialized successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _b.sent();
                        console.error('Failed to initialize GraphService:', error_2);
                        throw error_2;
                    case 4:
                        console.log('=== onInit END ===');
                        return [2 /*return*/];
                }
            });
        });
    };
    OrganizationChartWebPart.prototype.onAfterRender = function () {
        var _this = this;
        console.log('onAfterRender called', {
            hasOrgData: !!this.orgData,
            isLoadingData: this.isLoadingData,
            currentActiveDept: this.currentActiveDept
        });
        if (this.orgData || this.isLoadingData) {
            console.log('Skipping data load - already have data or loading in progress');
            return;
        }
        var startLoading = function () { return __awaiter(_this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        console.log('Starting initial data load...');
                        if (!this.graphReadyPromise) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.graphReadyPromise];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: 
                    // Load the initial active department (CCMC by default)
                    return [4 /*yield*/, this.loadOrgData(this.currentActiveDept)];
                    case 3:
                        // Load the initial active department (CCMC by default)
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error('Error loading organization data:', error_3);
                        this.showError('Error loading organization data. Please check the configuration and console for details.');
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        // Delay slightly to ensure DOM is ready
        setTimeout(function () {
            void startLoading();
        }, 100);
    };
    OrganizationChartWebPart.prototype.showError = function (message) {
        var errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'padding: 40px; text-align: center; color: red;';
        errorDiv.textContent = message;
        var chartWrapper = this.domElement.querySelector(".".concat(styles.chartWrapper));
        if (chartWrapper) {
            chartWrapper.innerHTML = '';
            chartWrapper.appendChild(errorDiv);
        }
    };
    OrganizationChartWebPart.prototype.loadOrgData = function (tabName) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var tabs, targetTab, tab_1, topPerson, graphHierarchy, orgNode, existingDeptIndex, newDept, error_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.isLoadingData) {
                            console.log('Already loading data, skipping...');
                            return [2 /*return*/];
                        }
                        this.isLoadingData = true;
                        console.log("=== loadOrgData START ===");
                        console.log("Loading hierarchy for tab: ".concat(tabName || 'default (CCMC)', "..."));
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, 6, 7]);
                        if (!this.graphService) {
                            console.error('GraphService not initialized');
                            this.showError('GraphService not initialized. Please refresh the page.');
                            return [2 /*return*/];
                        }
                        tabs = (this.properties.tabs && this.properties.tabs.length > 0)
                            ? this.properties.tabs
                            : [
                                { id: 'tab_1', name: 'CCMC', topPersonEmail: 'df87625@ccmcnet.com' }
                            ];
                        targetTab = void 0;
                        if (tabName) {
                            targetTab = tabs.find(function (tab) { return tab.name === tabName; });
                        }
                        else {
                            // Load CCMC by default, or first tab with email
                            targetTab = (_a = tabs.find(function (tab) { var _a; return ((_a = tab.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'ccmc'; })) !== null && _a !== void 0 ? _a : tabs.find(function (tab) { return !!tab.topPersonEmail; });
                        }
                        if (!targetTab || !targetTab.topPersonEmail) {
                            this.showError("".concat(tabName || 'Default', " tab is not configured with a top person email."));
                            return [2 /*return*/];
                        }
                        tab_1 = targetTab;
                        console.log("Loading ".concat(tab_1.name, " data for ").concat(tab_1.topPersonEmail));
                        return [4 /*yield*/, this.graphService.getUserByEmail(tab_1.topPersonEmail)];
                    case 2:
                        topPerson = _c.sent();
                        if (!topPerson) {
                            this.showError("Unable to find the user ".concat(tab_1.topPersonEmail, " in Azure AD."));
                            return [2 /*return*/];
                        }
                        // Load root + 1 level (depth 2: root at 0, first level at 1)
                        console.log("Building hierarchy for ".concat(topPerson.displayName, " (root + 1 level)"));
                        return [4 /*yield*/, this.graphService.buildOrgHierarchy(topPerson.id, 2)];
                    case 3:
                        graphHierarchy = _c.sent();
                        console.log("Hierarchy built. Transforming to org node...");
                        return [4 /*yield*/, this.transformGraphUserToOrgNodeWithCounts(graphHierarchy)];
                    case 4:
                        orgNode = _c.sent();
                        console.log("Org node transformed. Root: ".concat(orgNode.name, ", Direct reports: ").concat(orgNode.directCount));
                        // Check if we need to add a new department or update existing data
                        if (!this.orgData) {
                            this.orgData = {
                                departments: []
                            };
                        }
                        existingDeptIndex = this.orgData.departments.findIndex(function (d) { return d.name === tab_1.name; });
                        newDept = {
                            id: tab_1.id,
                            name: tab_1.name,
                            roots: [orgNode]
                        };
                        if (existingDeptIndex >= 0) {
                            // Update existing department
                            this.orgData.departments[existingDeptIndex] = newDept;
                        }
                        else {
                            // Add new department
                            this.orgData.departments.push(newDept);
                        }
                        console.log("".concat(tab_1.name, " data loaded successfully:"), {
                            department: tab_1.name,
                            rootName: orgNode.name,
                            rootId: orgNode.id,
                            directReports: orgNode.directCount,
                            childrenLoaded: ((_b = orgNode.children) === null || _b === void 0 ? void 0 : _b.length) || 0,
                            totalDepartments: this.orgData.departments.length
                        });
                        console.log('=== loadOrgData END - Calling render() ===');
                        // Re-render to show the chart
                        this.render();
                        return [3 /*break*/, 7];
                    case 5:
                        error_4 = _c.sent();
                        console.error('Error loading organization data:', error_4);
                        this.showError("Error loading organization data: ".concat(error_4 instanceof Error ? error_4.message : 'Unknown error', ". Please check the console for details."));
                        return [3 /*break*/, 7];
                    case 6:
                        this.isLoadingData = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    OrganizationChartWebPart.prototype.handleTabSwitch = function (tabName) {
        return __awaiter(this, void 0, void 0, function () {
            var chartWrapper;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Tab switch requested: ".concat(tabName));
                        // Update the current active department
                        this.currentActiveDept = tabName;
                        // Check if this department is already loaded
                        if (this.orgData && this.orgData.departments.some(function (d) { return d.name === tabName; })) {
                            console.log("".concat(tabName, " data already loaded, switching to it"));
                            // Even though data is loaded, we still need to trigger a re-render
                            // to switch the active department in the chart logic
                            this.render();
                            return [2 /*return*/];
                        }
                        chartWrapper = this.domElement.querySelector(".".concat(styles.chartWrapper));
                        if (chartWrapper) {
                            chartWrapper.innerHTML = "<div style=\"padding: 40px; text-align: center;\">Loading ".concat(tabName, " hierarchy...</div>");
                        }
                        // Load the data for this tab
                        return [4 /*yield*/, this.loadOrgData(tabName)];
                    case 1:
                        // Load the data for this tab
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    OrganizationChartWebPart.prototype.transformGraphUserToOrgNodeWithCounts = function (graphUser) {
        return __awaiter(this, void 0, void 0, function () {
            var photoUrl, directReports, directCount, rootTotalSubordinates, childrenWithCounts;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.graphService.getUserPhoto(graphUser.id)];
                    case 1:
                        photoUrl = _a.sent();
                        directReports = graphUser.directReports || [];
                        directCount = directReports.length;
                        return [4 /*yield*/, this.graphService.getTotalSubordinatesCount(graphUser.id)];
                    case 2:
                        rootTotalSubordinates = _a.sent();
                        return [4 /*yield*/, Promise.all(directReports.map(function (report) { return __awaiter(_this, void 0, void 0, function () {
                                var reportDirectReports;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.graphService.getDirectReports(report.id)];
                                        case 1:
                                            reportDirectReports = _a.sent();
                                            return [2 /*return*/, {
                                                    id: report.id,
                                                    name: report.displayName,
                                                    title: report.jobTitle || 'No Title',
                                                    department: report.department || 'No Department',
                                                    photoUrl: undefined, // Photos will be loaded lazily when node is expanded
                                                    directCount: reportDirectReports.length,
                                                    reportingCount: reportDirectReports.length, // Initial estimate, will be updated when expanded
                                                    children: undefined // Will be loaded lazily when expanded
                                                }];
                                    }
                                });
                            }); }))];
                    case 3:
                        childrenWithCounts = _a.sent();
                        return [2 /*return*/, {
                                id: graphUser.id,
                                name: graphUser.displayName,
                                title: graphUser.jobTitle || 'No Title',
                                department: graphUser.department || 'No Department',
                                photoUrl: photoUrl,
                                children: childrenWithCounts.length > 0 ? childrenWithCounts : undefined,
                                directCount: directCount,
                                reportingCount: rootTotalSubordinates
                            }];
                }
            });
        });
    };
    OrganizationChartWebPart.prototype.transformGraphUserToOrgNodeAsync = function (graphUser) {
        return __awaiter(this, void 0, void 0, function () {
            var photoUrl, children, _a, directCount, reportingCount;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.graphService.getUserPhoto(graphUser.id)];
                    case 1:
                        photoUrl = _b.sent();
                        if (!graphUser.directReports) return [3 /*break*/, 3];
                        return [4 /*yield*/, Promise.all(graphUser.directReports.map(function (report) { return _this.transformGraphUserToOrgNodeAsync(report); }))];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = [];
                        _b.label = 4;
                    case 4:
                        children = _a;
                        directCount = children.length;
                        reportingCount = this.calculateReportingCount(children);
                        return [2 /*return*/, {
                                id: graphUser.id,
                                name: graphUser.displayName,
                                title: graphUser.jobTitle || 'No Title',
                                department: graphUser.department || 'No Department',
                                photoUrl: photoUrl,
                                children: children.length > 0 ? children : undefined,
                                directCount: directCount,
                                reportingCount: reportingCount
                            }];
                }
            });
        });
    };
    // Method to lazily load children for a specific node
    OrganizationChartWebPart.prototype.loadNodeChildren = function (nodeId) {
        return __awaiter(this, void 0, void 0, function () {
            var directReports, children, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.graphService.getDirectReports(nodeId)];
                    case 1:
                        directReports = _a.sent();
                        return [4 /*yield*/, Promise.all(directReports.map(function (report) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, photoUrl, childDirectReports, totalSubordinates, directCount;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, Promise.all([
                                                this.graphService.getUserPhoto(report.id),
                                                this.graphService.getDirectReports(report.id),
                                                this.graphService.getTotalSubordinatesCount(report.id)
                                            ])];
                                        case 1:
                                            _a = _b.sent(), photoUrl = _a[0], childDirectReports = _a[1], totalSubordinates = _a[2];
                                            directCount = childDirectReports.length;
                                            return [2 /*return*/, {
                                                    id: report.id,
                                                    name: report.displayName,
                                                    title: report.jobTitle || 'No Title',
                                                    department: report.department || 'No Department',
                                                    photoUrl: photoUrl,
                                                    directCount: directCount,
                                                    reportingCount: totalSubordinates,
                                                    children: undefined // Will be loaded when expanded
                                                }];
                                    }
                                });
                            }); }))];
                    case 2:
                        children = _a.sent();
                        return [2 /*return*/, children];
                    case 3:
                        error_5 = _a.sent();
                        console.error("Error loading children for node ".concat(nodeId, ":"), error_5);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OrganizationChartWebPart.prototype.transformGraphUserToOrgNode = function (graphUser) {
        var _this = this;
        var children = graphUser.directReports
            ? graphUser.directReports.map(function (report) { return _this.transformGraphUserToOrgNode(report); })
            : [];
        // Calculate direct count (immediate reports)
        var directCount = children.length;
        // Calculate reporting count (all descendants)
        var reportingCount = this.calculateReportingCount(children);
        return {
            id: graphUser.id,
            name: graphUser.displayName,
            title: graphUser.jobTitle || 'No Title',
            department: graphUser.department || 'No Department',
            children: children.length > 0 ? children : undefined,
            directCount: directCount,
            reportingCount: reportingCount
        };
    };
    OrganizationChartWebPart.prototype.calculateReportingCount = function (children) {
        if (!children || children.length === 0) {
            return 0;
        }
        var total = children.length;
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var child = children_1[_i];
            if (child.children) {
                total += this.calculateReportingCount(child.children);
            }
        }
        return total;
    };
    OrganizationChartWebPart.prototype.onThemeChanged = function (currentTheme) {
        if (!currentTheme) {
            return;
        }
        var semanticColors = currentTheme.semanticColors;
        if (semanticColors) {
            this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
            this.domElement.style.setProperty('--link', semanticColors.link || null);
            this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
        }
    };
    OrganizationChartWebPart.prototype.onPropertyPaneFieldChanged = function (propertyPath, oldValue, newValue) {
        var _this = this;
        if (propertyPath === 'tabs' &&
            JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            // Reset orgData to trigger reload
            this.orgData = null;
            this.render();
            // Load new data
            var reload = function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.graphReadyPromise) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.graphReadyPromise];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [4 /*yield*/, this.loadOrgData()];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); };
            reload().catch(function (error) {
                console.error('Error reloading data after property change:', error);
            });
        }
    };
    Object.defineProperty(OrganizationChartWebPart.prototype, "dataVersion", {
        get: function () {
            return Version.parse('1.0');
        },
        enumerable: false,
        configurable: true
    });
    OrganizationChartWebPart.prototype.getPropertyPaneConfiguration = function () {
        var _this = this;
        return {
            pages: [
                {
                    header: {
                        description: strings.PropertyPaneDescription
                    },
                    groups: [
                        {
                            groupName: 'Tabs Configuration',
                            groupFields: [
                                PropertyPaneTabsField('tabs', {
                                    tabs: this.properties.tabs || [],
                                    onTabsChange: function (tabs) {
                                        _this.properties.tabs = tabs;
                                        // Refresh property pane to show updated values
                                        _this.context.propertyPane.refresh();
                                    }
                                })
                            ]
                        },
                        {
                            groupName: strings.BasicGroupName,
                            groupFields: [
                                PropertyPaneTextField('description', {
                                    label: strings.DescriptionFieldLabel
                                })
                            ]
                        }
                    ]
                }
            ]
        };
    };
    return OrganizationChartWebPart;
}(BaseClientSideWebPart));
export default OrganizationChartWebPart;
//# sourceMappingURL=OrganizationChartWebPart.js.map