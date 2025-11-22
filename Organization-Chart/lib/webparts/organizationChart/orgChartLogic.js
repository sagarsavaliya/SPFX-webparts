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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var SVG_NS = "http://www.w3.org/2000/svg";
var HTML_NS = "http://www.w3.org/1999/xhtml";
var CARD = { width: 280, height: 120 };
var GAPS = { vertical: 60, horizontal: 180 };
var ROOT_SPACING = 200;
var ZOOM_LIMITS = { min: 0.25, max: 2.8, step: 0.12 };
export function initOrgChart(container, dataUrl, styles, defaultExpandDepth, onLoadChildren, onTabSwitch, initialActiveDept) {
    if (defaultExpandDepth === void 0) { defaultExpandDepth = 1; }
    var svg = container.querySelector("#orgChartCanvas");
    var tabs = container.querySelectorAll(".".concat(styles.tab));
    var searchInput = container.querySelector("#userSearch");
    var clearSearchBtn = container.querySelector("#clearSearch");
    var zoomButtons = container.querySelectorAll(".".concat(styles.zoomBtn));
    var state = {
        data: undefined,
        deptMap: new Map(),
        activeDept: initialActiveDept || "CCMC",
        expanded: {},
        parents: {},
        matches: new Set(),
        searchTerm: "",
        zoom: 1,
        pan: { x: 0, y: 0 },
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    };
    var branchColorCache = new Map();
    var personaColorCache = new Map();
    var loadingNodes = new Set(); // Track nodes that are currently loading
    var viewGroup;
    var branchesLayer;
    var nodesLayer;
    var isPanning = false;
    var panOrigin = { x: 0, y: 0 };
    var pointerStart = { x: 0, y: 0 };
    function setupSvgLayers() {
        viewGroup = document.createElementNS(SVG_NS, "g");
        branchesLayer = document.createElementNS(SVG_NS, "g");
        nodesLayer = document.createElementNS(SVG_NS, "g");
        viewGroup.appendChild(branchesLayer);
        viewGroup.appendChild(nodesLayer);
        svg.appendChild(viewGroup);
    }
    function registerEvents() {
        tabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                void setActiveDepartment(tab.dataset.dept);
            });
        });
        searchInput.addEventListener("input", function (evt) { return onSearch(evt.target.value); });
        clearSearchBtn.addEventListener("click", function () { return clearSearch(); });
        zoomButtons.forEach(function (btn) {
            btn.addEventListener("click", function () { return handleZoomButton(btn.dataset.zoom); });
        });
        svg.addEventListener("wheel", function (evt) { return handleWheel(evt); }, { passive: false });
        svg.addEventListener("pointerdown", function (evt) { return startPan(evt); });
        window.addEventListener("pointerup", function (evt) { return endPan(evt); });
        window.addEventListener("pointermove", function (evt) { return onPan(evt); });
        window.addEventListener("resize", function () { return centerChart(); });
    }
    function buildParentIndex() {
        if (!state.data)
            return;
        var parents = {};
        var indexNode = function (node, parentId) {
            if (parentId !== undefined) {
                parents[node.id] = parentId;
            }
            (node.children || []).forEach(function (child) { return indexNode(child, node.id); });
        };
        state.data.departments.forEach(function (dept) {
            dept.roots.forEach(function (root) { return indexNode(root); });
        });
        state.parents = parents;
    }
    function ensureDefaultExpansion() {
        var dept = state.deptMap.get(state.activeDept);
        if (!dept)
            return;
        var setDefault = function (node, depth) {
            if (depth === void 0) { depth = 0; }
            if (state.expanded[node.id] === undefined) {
                state.expanded[node.id] = depth < defaultExpandDepth;
            }
            (node.children || []).forEach(function (child) { return setDefault(child, depth + 1); });
        };
        dept.roots.forEach(function (root) { return setDefault(root); });
    }
    function setActiveDepartment(deptName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!state.deptMap.has(deptName)) return [3 /*break*/, 3];
                        console.log("Department ".concat(deptName, " not found in map, attempting to load..."));
                        if (!onTabSwitch) return [3 /*break*/, 2];
                        return [4 /*yield*/, onTabSwitch(deptName)];
                    case 1:
                        _a.sent();
                        // After loading, the data should be updated and re-rendered
                        // The new render will call init() again with updated data
                        return [2 /*return*/];
                    case 2:
                        console.warn("No tab switch handler available to load ".concat(deptName));
                        return [2 /*return*/];
                    case 3:
                        state.activeDept = deptName;
                        ensureDefaultExpansion();
                        updateTabs();
                        render({ center: true });
                        return [2 /*return*/];
                }
            });
        });
    }
    function updateTabs() {
        tabs.forEach(function (tab) {
            var isActive = tab.dataset.dept === state.activeDept;
            // Remove all possible active classes first
            tab.className = styles.tab;
            // Add active class if this is the active tab
            if (isActive) {
                tab.classList.add('active');
            }
            tab.setAttribute("aria-selected", String(isActive));
        });
    }
    function onSearch(term) {
        state.searchTerm = term.trim().toLowerCase();
        state.matches = computeMatches();
        if (state.searchTerm.length) {
            state.matches.forEach(function (id) { return expandPathTo(id); });
        }
        render();
        clearSearchBtn.hidden = !state.searchTerm.length;
    }
    function clearSearch() {
        state.searchTerm = "";
        state.matches.clear();
        searchInput.value = "";
        clearSearchBtn.hidden = true;
        render();
    }
    function computeMatches() {
        if (!state.searchTerm)
            return new Set();
        var matches = new Set();
        var dept = state.deptMap.get(state.activeDept);
        if (!dept)
            return matches;
        var matchesTerm = function (node) {
            var target = "".concat(node.name, " ").concat(node.title, " ").concat(node.department).toLowerCase();
            if (target.indexOf(state.searchTerm) !== -1) {
                matches.add(node.id);
            }
            (node.children || []).forEach(matchesTerm);
        };
        dept.roots.forEach(matchesTerm);
        return matches;
    }
    function expandPathTo(nodeId) {
        var current = nodeId;
        while (current) {
            state.expanded[current] = true;
            current = state.parents[current];
        }
    }
    function isExpanded(nodeId, depth) {
        var flag = state.expanded[nodeId];
        if (flag === undefined)
            return depth < 2;
        return flag;
    }
    function render(options) {
        if (options === void 0) { options = {}; }
        var dept = state.deptMap.get(state.activeDept);
        if (!dept)
            return;
        var layout = computeLayout(dept.roots);
        state.bounds = layout.bounds;
        drawBranches(layout.edges, layout.nodeMap);
        drawNodes(layout.nodes);
        if (options.center) {
            centerChart();
        }
        else {
            applyTransform();
        }
    }
    function calculateNodeDimensions(node, depth) {
        var children = node.children || [];
        var isExp = isExpanded(node.id, depth);
        if (!isExp || children.length === 0) {
            node._dimensions = {
                width: CARD.width,
                height: CARD.height,
                childrenHeight: 0
            };
            return node._dimensions;
        }
        var childDimensions = children.map(function (child) {
            return calculateNodeDimensions(child, depth + 1);
        });
        if (depth === 0) {
            var childrenHeight = childDimensions.reduce(function (sum, dim, idx) {
                return sum + dim.height + (idx < childDimensions.length - 1 ? GAPS.vertical : 0);
            }, 0);
            var maxChildWidth = Math.max.apply(Math, __spreadArray([CARD.width], childDimensions.map(function (d) { return d.width; }), false));
            node._dimensions = {
                width: maxChildWidth,
                height: CARD.height + GAPS.vertical + childrenHeight,
                childrenHeight: childrenHeight
            };
        }
        else {
            var childrenHeight = childDimensions.reduce(function (sum, dim, idx) {
                return sum + dim.height + (idx < childDimensions.length - 1 ? getGapForDepth(depth + 1) : 0);
            }, 0);
            var maxChildWidth = Math.max.apply(Math, childDimensions.map(function (d) { return d.width; }));
            var totalWidth = CARD.width + GAPS.horizontal + maxChildWidth;
            node._dimensions = {
                width: totalWidth,
                height: Math.max(CARD.height, childrenHeight),
                childrenHeight: childrenHeight
            };
        }
        return node._dimensions;
    }
    function layoutSubtree(node, depth, x, y, color) {
        var _a;
        var nodes = [];
        var edges = [];
        var children = node.children || [];
        var isExp = isExpanded(node.id, depth);
        var dimensions = node._dimensions || { width: CARD.width, height: CARD.height };
        var nodeEntry = __assign(__assign({}, node), { depth: depth, x: x, y: y, branchColor: color, hasChildren: children.length > 0 || ((_a = node.directCount) !== null && _a !== void 0 ? _a : 0) > 0, isExpanded: isExp, orientation: depth === 0 ? "down" : "right" });
        nodes.push(nodeEntry);
        if (!children.length || !isExp) {
            return {
                nodes: nodes,
                edges: edges,
                width: CARD.width,
                height: CARD.height
            };
        }
        if (depth === 0) {
            var childY_1 = y + CARD.height + GAPS.vertical;
            children.forEach(function (child, idx) {
                var childSubtree = layoutSubtree(child, depth + 1, x, childY_1, color);
                nodes.push.apply(nodes, childSubtree.nodes);
                edges.push({ parent: node.id, child: child.id, direction: "down" });
                edges.push.apply(edges, childSubtree.edges);
                childY_1 += childSubtree.height;
                if (idx < children.length - 1) {
                    childY_1 += GAPS.vertical;
                }
            });
            return {
                nodes: nodes,
                edges: edges,
                width: dimensions.width,
                height: dimensions.height
            };
        }
        else {
            var childX_1 = x + CARD.width + GAPS.horizontal;
            var gap_1 = getGapForDepth(depth + 1);
            var totalChildHeight = children.reduce(function (sum, child, idx) {
                var childDim = child._dimensions || { height: CARD.height };
                return sum + childDim.height + (idx < children.length - 1 ? gap_1 : 0);
            }, 0);
            var childY_2 = y;
            children.forEach(function (child, idx) {
                var childSubtree = layoutSubtree(child, depth + 1, childX_1, childY_2, color);
                nodes.push.apply(nodes, childSubtree.nodes);
                edges.push({ parent: node.id, child: child.id, direction: "right" });
                edges.push.apply(edges, childSubtree.edges);
                childY_2 += childSubtree.height;
                if (idx < children.length - 1) {
                    childY_2 += gap_1;
                }
            });
            return {
                nodes: nodes,
                edges: edges,
                width: dimensions.width,
                height: Math.max(CARD.height, totalChildHeight)
            };
        }
    }
    function computeLayout(roots) {
        var nodes = [];
        var edges = [];
        var nodeMap = new Map();
        if (!roots.length) {
            return { nodes: nodes, edges: edges, nodeMap: nodeMap, bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
        }
        roots.forEach(function (root) { return calculateNodeDimensions(root, 0); });
        var offsetX = 0;
        roots.forEach(function (root, index) {
            var color = getBranchColor(root.id, index);
            var subtree = layoutSubtree(root, 0, offsetX, 0, color);
            nodes.push.apply(nodes, subtree.nodes);
            edges.push.apply(edges, subtree.edges);
            subtree.nodes.forEach(function (node) { return nodeMap.set(node.id, node); });
            offsetX += subtree.width + ROOT_SPACING;
        });
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(function (node) {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + CARD.width);
            maxY = Math.max(maxY, node.y + CARD.height);
        });
        if (!nodes.length) {
            minX = minY = maxX = maxY = 0;
        }
        var margin = 120;
        var translateX = -minX + margin;
        var translateY = -minY + margin;
        nodes.forEach(function (node) {
            node.x += translateX;
            node.y += translateY;
            nodeMap.set(node.id, node);
        });
        return {
            nodes: nodes,
            edges: edges,
            nodeMap: nodeMap,
            bounds: {
                minX: 0,
                minY: 0,
                maxX: maxX - minX + margin * 2,
                maxY: maxY - minY + margin * 2
            }
        };
    }
    function getGapForDepth(depth) {
        if (depth === 1)
            return 60;
        if (depth === 2)
            return 50;
        if (depth === 3)
            return 45;
        return Math.max(40, 60 - depth * 5);
    }
    function drawBranches(edges, nodeMap) {
        while (branchesLayer.firstChild) {
            branchesLayer.removeChild(branchesLayer.firstChild);
        }
        edges.forEach(function (edge) {
            var parent = nodeMap.get(edge.parent);
            var child = nodeMap.get(edge.child);
            if (!parent || !child)
                return;
            var path = document.createElementNS(SVG_NS, "path");
            path.setAttribute("class", "branch");
            if (state.matches.has(parent.id) || state.matches.has(child.id)) {
                path.classList.add("active");
            }
            var d = buildSmoothPath(parent, child, edge.direction);
            path.setAttribute("d", d);
            branchesLayer.appendChild(path);
        });
    }
    function buildSmoothPath(parent, child, direction) {
        var start = {
            x: parent.x + (direction === "down" ? CARD.width / 2 : CARD.width),
            y: parent.y + (direction === "down" ? CARD.height : CARD.height / 2)
        };
        var end = {
            x: child.x + (direction === "down" ? CARD.width / 2 : 0),
            y: child.y + (direction === "down" ? 0 : CARD.height / 2)
        };
        if (direction === "down") {
            var midY = start.y + (end.y - start.y) * 0.5;
            return "M ".concat(start.x, " ").concat(start.y, " C ").concat(start.x, " ").concat(midY, ", ").concat(end.x, " ").concat(midY, ", ").concat(end.x, " ").concat(end.y);
        }
        var midX = start.x + (end.x - start.x) * 0.5;
        return "M ".concat(start.x, " ").concat(start.y, " C ").concat(midX, " ").concat(start.y, ", ").concat(midX, " ").concat(end.y, ", ").concat(end.x, " ").concat(end.y);
    }
    function drawNodes(nodes) {
        while (nodesLayer.firstChild) {
            nodesLayer.removeChild(nodesLayer.firstChild);
        }
        nodes.forEach(function (node) {
            var fo = document.createElementNS(SVG_NS, "foreignObject");
            fo.setAttribute("x", String(node.x));
            fo.setAttribute("y", String(node.y));
            fo.setAttribute("width", String(CARD.width));
            fo.setAttribute("height", String(CARD.height));
            fo.setAttribute("class", "node-wrapper");
            var card = document.createElementNS(HTML_NS, "div");
            card.className = "node-card";
            card.dataset.id = node.id;
            if (state.matches.has(node.id)) {
                card.classList.add("highlight");
            }
            if (!node.isExpanded && node.hasChildren) {
                card.classList.add("collapsed");
            }
            card.style.borderLeftColor = node.branchColor;
            card.innerHTML = renderCardMarkup(node);
            fo.appendChild(card);
            nodesLayer.appendChild(fo);
            if (node.hasChildren) {
                var chevron = document.createElementNS(HTML_NS, "div");
                chevron.className = "chevron";
                var direction = node.depth === 0 ? "down" : "right";
                chevron.dataset.direction = direction;
                // Use SVG icons for chevrons
                var chevronIcon = direction === "down"
                    ? "<svg width=\"12\" height=\"12\" viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M8 11.414l-6.707-6.707 1.414-1.414L8 8.586l5.293-5.293 1.414 1.414L8 11.414z\"/></svg>"
                    : "<svg width=\"12\" height=\"12\" viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M11.414 8l-6.707 6.707-1.414-1.414L8.586 8 3.293 2.707l1.414-1.414L11.414 8z\"/></svg>";
                chevron.innerHTML = chevronIcon;
                card.appendChild(chevron);
                chevron.addEventListener("click", function (evt) {
                    evt.stopPropagation();
                    void toggleNode(node.id);
                });
            }
            // Open profile modal when clicking on the card
            card.addEventListener("click", function (evt) {
                evt.stopPropagation();
                showProfileModal(node);
            });
        });
    }
    function renderCardMarkup(node) {
        var _a, _b, _c;
        var initials = getInitials(node.name);
        var personaColor = getPersonaColor(node.id);
        var photoUrl = node.photoUrl;
        // Render persona with image if available, otherwise use initials
        var personaContent = photoUrl
            ? "<img src=\"".concat(photoUrl, "\" alt=\"").concat(node.name, "\" style=\"width: 100%; height: 100%; object-fit: cover; border-radius: 50%;\" onerror=\"this.style.display='none'; this.parentElement.innerHTML='").concat(initials, "'; this.parentElement.style.background='").concat(personaColor, "';\" />")
            : initials;
        var personaStyle = photoUrl
            ? 'background: transparent; padding: 0;'
            : "background:".concat(personaColor);
        return "\n      <div class=\"card-header\">\n        <div class=\"persona\" style=\"".concat(personaStyle, "\">").concat(personaContent, "</div>\n        <div class=\"card-meta\">\n          <span class=\"name\">").concat(node.name, "</span>\n          <span class=\"title\">").concat(node.title, "</span>\n          <span class=\"department\">").concat(node.department, "</span>\n        </div>\n      </div>\n      <div class=\"card-footer\">\n        <span><strong>").concat((_a = node.reportingCount) !== null && _a !== void 0 ? _a : 0, "</strong> Reports</span>\n        <span><strong>").concat((_b = node.directCount) !== null && _b !== void 0 ? _b : (((_c = node.children) === null || _c === void 0 ? void 0 : _c.length) || 0), "</strong> Direct</span>\n      </div>\n    ");
    }
    function showProfileModal(node) {
        var _a, _b, _c;
        var initials = getInitials(node.name);
        var personaColor = getPersonaColor(node.id);
        var photoUrl = node.photoUrl;
        // Render profile photo with fallback to initials
        var photoContent = photoUrl
            ? "<img src=\"".concat(photoUrl, "\" alt=\"").concat(node.name, "\" style=\"width: 100%; height: 100%; object-fit: cover; border-radius: 50%;\" onerror=\"this.style.display='none'; this.parentElement.innerHTML='").concat(initials, "'; this.parentElement.style.background='").concat(personaColor, "'; this.parentElement.style.display='flex'; this.parentElement.style.alignItems='center'; this.parentElement.style.justifyContent='center'; this.parentElement.style.fontSize='48px'; this.parentElement.style.fontWeight='600'; this.parentElement.style.color='white';\" />")
            : initials;
        var photoStyle = photoUrl
            ? 'background: transparent; padding: 0;'
            : "background:".concat(personaColor, "; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 600; color: white;");
        var modalHTML = "\n      <div class=\"profile-modal-overlay\" id=\"profileModalOverlay\">\n        <div class=\"profile-modal\">\n          <div class=\"profile-modal-header\">\n            <button class=\"profile-modal-close\" id=\"profileModalClose\">\u00D7</button>\n            <div class=\"profile-modal-photo\" style=\"".concat(photoStyle, "\">\n              ").concat(photoContent, "\n            </div>\n            <h2 class=\"profile-modal-name\">").concat(node.name, "</h2>\n            <p class=\"profile-modal-title\">").concat(node.title, "</p>\n          </div>\n          <div class=\"profile-modal-body\">\n            <div class=\"profile-section\">\n              <div class=\"profile-section-title\">Contact Information</div>\n              <div class=\"profile-info-item\">\n                <div class=\"profile-info-icon\">\u2709</div>\n                <div class=\"profile-info-text\">\n                  <a href=\"mailto:").concat(node.name.toLowerCase().replace(' ', '.'), "@company.com\">\n                    ").concat(node.name.toLowerCase().replace(' ', '.'), "@company.com\n                  </a>\n                </div>\n              </div>\n              <div class=\"profile-info-item\">\n                <div class=\"profile-info-icon\">\uD83D\uDCF1</div>\n                <div class=\"profile-info-text\">+1 (555) 123-4567</div>\n              </div>\n            </div>\n            <div class=\"profile-section\">\n              <div class=\"profile-section-title\">Organization</div>\n              <div class=\"profile-info-item\">\n                <div class=\"profile-info-icon\">\uD83C\uDFE2</div>\n                <div class=\"profile-info-text\">").concat(node.department, "</div>\n              </div>\n              <div class=\"profile-info-item\">\n                <div class=\"profile-info-icon\">\uD83D\uDCBC</div>\n                <div class=\"profile-info-text\">").concat(node.title, "</div>\n              </div>\n              <div class=\"profile-info-item\">\n                <div class=\"profile-info-icon\">\uD83D\uDCCD</div>\n                <div class=\"profile-info-text\">Main Office</div>\n              </div>\n            </div>\n            <div class=\"profile-section\">\n              <div class=\"profile-section-title\">Team</div>\n              <div class=\"profile-stats\">\n                <div class=\"profile-stat\">\n                  <div class=\"profile-stat-value\">").concat((_a = node.reportingCount) !== null && _a !== void 0 ? _a : 0, "</div>\n                  <div class=\"profile-stat-label\">Total Reports</div>\n                </div>\n                <div class=\"profile-stat\">\n                  <div class=\"profile-stat-value\">").concat((_b = node.directCount) !== null && _b !== void 0 ? _b : (((_c = node.children) === null || _c === void 0 ? void 0 : _c.length) || 0), "</div>\n                  <div class=\"profile-stat-label\">Direct Reports</div>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    ");
        var modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        var closeModal = function () {
            modalContainer.remove();
        };
        var closeBtn = document.getElementById('profileModalClose');
        var overlay = document.getElementById('profileModalOverlay');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    closeModal();
                }
            });
        }
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
    function toggleNode(nodeId) {
        return __awaiter(this, void 0, void 0, function () {
            var currentExpandedState, isExpanding, node, card, children, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        currentExpandedState = state.expanded[nodeId];
                        isExpanding = !currentExpandedState;
                        if (!(isExpanding && onLoadChildren)) return [3 /*break*/, 5];
                        node = findNodeById(nodeId);
                        if (!(node && (!node.children || node.children.length === 0) && (node.directCount || 0) > 0)) return [3 /*break*/, 5];
                        // Prevent duplicate loads
                        if (loadingNodes.has(nodeId)) {
                            return [2 /*return*/];
                        }
                        loadingNodes.add(nodeId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        card = container.querySelector("[data-id=\"".concat(nodeId, "\"]"));
                        if (card) {
                            card.classList.add('loading');
                        }
                        return [4 /*yield*/, onLoadChildren(nodeId)];
                    case 2:
                        children = _a.sent();
                        // Update the node with loaded children
                        if (node && children.length > 0) {
                            node.children = children;
                            // Rebuild parent index to include new nodes
                            buildParentIndex();
                            // Note: reporting counts are already set from the API
                        }
                        // Remove loading indicator
                        if (card) {
                            card.classList.remove('loading');
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Error loading children for node ".concat(nodeId, ":"), error_1);
                        return [3 /*break*/, 5];
                    case 4:
                        loadingNodes.delete(nodeId);
                        return [7 /*endfinally*/];
                    case 5:
                        // Update expansion state and render
                        state.expanded[nodeId] = isExpanding;
                        render();
                        return [2 /*return*/];
                }
            });
        });
    }
    function findNodeById(nodeId) {
        if (!state.data)
            return undefined;
        function search(node) {
            if (node.id === nodeId)
                return node;
            if (node.children) {
                for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    var found = search(child);
                    if (found)
                        return found;
                }
            }
            return undefined;
        }
        for (var _i = 0, _a = state.data.departments; _i < _a.length; _i++) {
            var dept = _a[_i];
            for (var _b = 0, _c = dept.roots; _b < _c.length; _b++) {
                var root = _c[_b];
                var found = search(root);
                if (found)
                    return found;
            }
        }
        return undefined;
    }
    function handleWheel(evt) {
        evt.preventDefault();
        var delta = evt.deltaY < 0 ? ZOOM_LIMITS.step : -ZOOM_LIMITS.step;
        var nextZoom = clamp(state.zoom + delta, ZOOM_LIMITS.min, ZOOM_LIMITS.max);
        var svgRect = svg.getBoundingClientRect();
        var pointer = { x: evt.clientX - svgRect.left, y: evt.clientY - svgRect.top };
        zoomAtPoint(nextZoom, pointer);
    }
    function handleZoomButton(action) {
        if (action === "reset") {
            state.zoom = 1;
            centerChart();
            return;
        }
        var delta = action === "in" ? ZOOM_LIMITS.step : -ZOOM_LIMITS.step;
        var nextZoom = clamp(state.zoom + delta, ZOOM_LIMITS.min, ZOOM_LIMITS.max);
        var svgRect = svg.getBoundingClientRect();
        var center = { x: svgRect.width / 2, y: svgRect.height / 2 };
        zoomAtPoint(nextZoom, center);
    }
    function zoomAtPoint(newZoom, point) {
        var scaleFactor = newZoom / state.zoom;
        state.pan.x = point.x - (point.x - state.pan.x) * scaleFactor;
        state.pan.y = point.y - (point.y - state.pan.y) * scaleFactor;
        state.zoom = newZoom;
        applyTransform();
    }
    function startPan(evt) {
        if (evt.button !== 0)
            return;
        if (evt.target && typeof evt.target.closest === "function" && evt.target.closest(".node-card")) {
            return;
        }
        isPanning = true;
        panOrigin = __assign({}, state.pan);
        pointerStart = { x: evt.clientX, y: evt.clientY };
        svg.setPointerCapture(evt.pointerId);
    }
    function onPan(evt) {
        if (!isPanning)
            return;
        var dx = evt.clientX - pointerStart.x;
        var dy = evt.clientY - pointerStart.y;
        state.pan.x = panOrigin.x + dx;
        state.pan.y = panOrigin.y + dy;
        applyTransform();
    }
    function endPan(evt) {
        if (!isPanning)
            return;
        isPanning = false;
        svg.releasePointerCapture(evt.pointerId);
    }
    function centerChart() {
        var bounds = state.bounds;
        var rect = svg.getBoundingClientRect();
        // Calculate the content dimensions
        var contentWidth = bounds.maxX - bounds.minX;
        var contentHeight = bounds.maxY - bounds.minY;
        // Calculate zoom to fit with padding (80% of viewport)
        var padding = 0.8;
        var zoomX = (rect.width * padding) / contentWidth;
        var zoomY = (rect.height * padding) / contentHeight;
        var fitZoom = Math.min(zoomX, zoomY);
        // Apply zoom with limits
        state.zoom = clamp(fitZoom, ZOOM_LIMITS.min, ZOOM_LIMITS.max);
        // Center the content
        var centerX = bounds.minX + contentWidth / 2;
        var centerY = bounds.minY + contentHeight / 2;
        state.pan.x = rect.width / 2 - centerX * state.zoom;
        state.pan.y = rect.height / 2 - centerY * state.zoom;
        applyTransform();
    }
    function applyTransform() {
        viewGroup.setAttribute("transform", "translate(".concat(state.pan.x, ", ").concat(state.pan.y, ") scale(").concat(state.zoom, ")"));
        var resetBtn = container.querySelector('[data-zoom="reset"]');
        if (resetBtn) {
            resetBtn.textContent = "".concat(Math.round(state.zoom * 100), "%");
        }
    }
    function getBranchColor(seed, fallbackIndex) {
        if (fallbackIndex === void 0) { fallbackIndex = 0; }
        if (branchColorCache.has(seed))
            return branchColorCache.get(seed);
        var palette = [
            "#5B8DEF",
            "#51C6EA",
            "#6DDCD4",
            "#F7B267",
            "#F4845F",
            "#C06C84",
            "#7F5AF0"
        ];
        var hash = 0;
        for (var i = 0; i < seed.length; i += 1) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
            hash &= hash;
        }
        var index = Math.abs(hash + fallbackIndex) % palette.length;
        var color = palette[index];
        branchColorCache.set(seed, color);
        return color;
    }
    function getPersonaColor(seed) {
        if (personaColorCache.has(seed))
            return personaColorCache.get(seed);
        var hue = Math.abs(hashString(seed)) % 360;
        var color = "hsl(".concat(hue, ", 65%, 45%)");
        personaColorCache.set(seed, color);
        return color;
    }
    function getInitials(name) {
        return name
            .split(" ")
            .map(function (part) { return part[0]; })
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }
    function hashString(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i += 1) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    function init() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    console.log('=== orgChartLogic init() START ===');
                    // dataUrl is the OrgData object passed to initOrgChart
                    state.data = dataUrl;
                    if (dataUrl && dataUrl.departments) {
                        console.log('Processing departments:', dataUrl.departments.map(function (d) { return d.name; }));
                        console.log('Active department:', state.activeDept);
                        dataUrl.departments.forEach(function (dept) {
                            state.deptMap.set(dept.name, dept);
                        });
                        console.log('Department map size:', state.deptMap.size);
                        console.log('Has active dept in map?', state.deptMap.has(state.activeDept));
                        buildParentIndex();
                        // Note: reporting counts are already set from the API
                        ensureDefaultExpansion();
                        updateTabs();
                        render({ center: true });
                        console.log('=== orgChartLogic init() END ===');
                    }
                    else {
                        console.error("No data provided to org chart");
                    }
                }
                catch (error) {
                    console.error("Failed to load hierarchy", error);
                }
                return [2 /*return*/];
            });
        });
    }
    setupSvgLayers();
    registerEvents();
    if (clearSearchBtn) {
        clearSearchBtn.hidden = true;
    }
    // eslint-disable-next-line no-void
    void init();
}
//# sourceMappingURL=orgChartLogic.js.map