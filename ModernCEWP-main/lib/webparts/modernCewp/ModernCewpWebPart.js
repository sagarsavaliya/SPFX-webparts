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
import { PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { Environment, EnvironmentType, DisplayMode } from '@microsoft/sp-core-library';
import { SPHttpClient } from '@microsoft/sp-http';
import styles from './ModernCewpWebPart.module.scss';
import * as strings from 'ModernCewpWebPartStrings';
import * as jQuery from 'jquery';
var ModernCewpWebPart = /** @class */ (function (_super) {
    __extends(ModernCewpWebPart, _super);
    function ModernCewpWebPart() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Helper method to execute scripts from HTML content
     * Scripts inserted via innerHTML don't execute automatically, so we need to extract and execute them manually
     * This method ensures scripts execute in order and waits for external scripts to load
     */
    ModernCewpWebPart.prototype.executeScripts = function (containerElement) {
        var scripts = containerElement.querySelectorAll('script');
        var scriptsArray = [];
        // Collect all scripts first
        for (var i = 0; i < scripts.length; i++) {
            scriptsArray.push(scripts[i]);
        }
        // Execute scripts sequentially
        return scriptsArray.reduce(function (promise, oldScript, index) {
            return promise.then(function () {
                return new Promise(function (resolve, reject) {
                    var newScript = document.createElement('script');
                    // Copy all attributes from the old script to the new one
                    var attrs = oldScript.attributes;
                    for (var j = 0; j < attrs.length; j++) {
                        var attr = attrs[j];
                        newScript.setAttribute(attr.name, attr.value);
                    }
                    // Handle inline scripts
                    if (oldScript.innerHTML) {
                        newScript.textContent = oldScript.innerHTML;
                    }
                    // Handle external scripts
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    }
                    // Set up load/error handlers for external scripts
                    if (oldScript.src) {
                        newScript.onload = function () {
                            resolve();
                        };
                        newScript.onerror = function () {
                            console.warn('Script failed to load: ' + oldScript.src);
                            resolve(); // Continue with next script even if this one fails
                        };
                    }
                    else {
                        // For inline scripts, resolve immediately after appending
                        // Use setTimeout to ensure DOM is ready
                        setTimeout(function () {
                            resolve();
                        }, 0);
                    }
                    // Remove the old script (non-executable) and append the new one (which will execute)
                    var parentNode = oldScript.parentNode;
                    if (parentNode) {
                        parentNode.removeChild(oldScript);
                        parentNode.appendChild(newScript);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }, Promise.resolve());
    };
    /**
     * Helper method to safely insert HTML content and execute any scripts
     */
    ModernCewpWebPart.prototype.insertHtmlWithScripts = function (containerId, html) {
        var _this = this;
        var container = document.getElementById(containerId);
        if (!container) {
            return Promise.resolve();
        }
        // Insert the HTML content
        container.innerHTML = html;
        // Wait for DOM to be ready, then execute scripts in order
        return new Promise(function (resolve) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(function () {
                // Execute scripts sequentially and wait for completion
                _this.executeScripts(container).then(function () {
                    // Trigger DOMContentLoaded event for libraries that listen to it
                    var domContentLoadedEvent = new Event('DOMContentLoaded', {
                        bubbles: true,
                        cancelable: true
                    });
                    document.dispatchEvent(domContentLoadedEvent);
                    // Also trigger a custom event for libraries that might need it
                    var loadEvent = new Event('load', {
                        bubbles: true,
                        cancelable: true
                    });
                    window.dispatchEvent(loadEvent);
                    // Additional small delay to ensure all scripts have initialized
                    setTimeout(function () {
                        resolve();
                    }, 100);
                }).catch(function () {
                    resolve(); // Continue even if script execution has issues
                });
            });
        });
    };
    /**
     * Helper method to resolve relative URLs to absolute URLs
     */
    ModernCewpWebPart.prototype.resolveUrl = function (url) {
        // If URL is already absolute (starts with http:// or https://), return as is
        if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
            return url;
        }
        // If URL starts with /, it's a site-relative URL
        if (url.indexOf('/') === 0) {
            return this.context.pageContext.web.absoluteUrl + url;
        }
        // Otherwise, it's relative to the current web
        var webUrl = this.context.pageContext.web.absoluteUrl;
        var serverRelativeUrl = this.context.pageContext.web.serverRelativeUrl;
        // If URL starts with ~sitecollection or ~site, replace with actual URLs
        if (url.indexOf('~sitecollection') === 0) {
            var siteCollectionUrl = this.context.pageContext.site.absoluteUrl;
            return url.replace('~sitecollection', siteCollectionUrl);
        }
        if (url.indexOf('~site') === 0) {
            return url.replace('~site', webUrl);
        }
        // For relative URLs, construct the full path
        var needsSlash = serverRelativeUrl.length > 0 && serverRelativeUrl.charAt(serverRelativeUrl.length - 1) !== '/';
        return webUrl + serverRelativeUrl + (needsSlash ? '/' : '') + url;
    };
    /**
     * Helper method to load content from a URL with proper authentication
     */
    ModernCewpWebPart.prototype.loadContentFromUrl = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var absoluteUrl, response, errorText, _error_1, fetchResponse, fetchError_1, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        absoluteUrl = this.resolveUrl(url);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 12]);
                        return [4 /*yield*/, this.context.spHttpClient.get(absoluteUrl, SPHttpClient.configurations.v1)];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _a.sent();
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText, ". ").concat(errorText));
                    case 4: return [4 /*yield*/, response.text()];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6:
                        _error_1 = _a.sent();
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 10, , 11]);
                        return [4 /*yield*/, fetch(absoluteUrl, {
                                method: 'GET',
                                credentials: 'include',
                                headers: {
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                                }
                            })];
                    case 8:
                        fetchResponse = _a.sent();
                        if (!fetchResponse.ok) {
                            throw new Error("HTTP ".concat(fetchResponse.status, ": ").concat(fetchResponse.statusText));
                        }
                        return [4 /*yield*/, fetchResponse.text()];
                    case 9: return [2 /*return*/, _a.sent()];
                    case 10:
                        fetchError_1 = _a.sent();
                        errorMessage = fetchError_1 instanceof Error ? fetchError_1.message : String(fetchError_1);
                        throw new Error("Failed to load content from ".concat(absoluteUrl, ": ").concat(errorMessage));
                    case 11: return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    ModernCewpWebPart.prototype._renderEdit = function () {
        var path = this.properties.contentLink;
        var hasPath = path !== undefined && path !== '' ? strings.Yes : strings.No;
        if (path === '') {
            path = strings.PathNotSet;
        }
        var hasHtml = this.properties.content !== undefined && this.properties.content !== '' ? strings.Yes : strings.No;
        var hasLegacyContext = this.properties.spPageContextInfo ? strings.Yes : strings.No;
        this.domElement.innerHTML = "\n      <div class=\"".concat(styles.modernCewp, "\">\n        <div class=\"").concat(styles.container, "\">\n          <div class=\"").concat(styles.row, "\">\n              <div class=\"").concat(styles.title, "\">").concat(strings.webPartName, "</div>\n              <div class=\"").concat(styles.subTitle, "\">").concat(strings.webPartSettings, "</div>\n              <p class=\"").concat(styles.label, "\">").concat(strings.WebPartHasContentLinkLabel).concat(hasPath, "</p>\n              <p class=\"").concat(styles.label, "\">").concat(strings.WebPartHasHTMLLabel).concat(hasHtml, "</p>\n              <p class=\"").concat(styles.label, "\">").concat(strings.WebPartHasPageContextLabel).concat(hasLegacyContext, "</p>\n          </div>\n        </div>\n      </div>");
    };
    ModernCewpWebPart.prototype._renderView = function () {
        var _this = this;
        // Make jQuery globally available
        if (window.jQuery === undefined) {
            window.jQuery = jQuery;
        }
        // Make _spPageContextInfo available
        if (this.properties.spPageContextInfo && !window._spPageContextInfo) {
            window._spPageContextInfo = this.context.pageContext.legacyPageContext;
        }
        var uid = String(Math.random()).substring(2);
        var contentPlaceholderId = 'modernCEWP_ContentPlaceholder_' + uid;
        var contentLinkPlaceholderId = 'modernCEWP_ContentLinkPlaceholder_' + uid;
        var html = this.properties.content;
        var path = this.properties.contentLink;
        var innerHTML = "";
        if (html !== "") {
            innerHTML += '<div id="' + contentPlaceholderId + '"></div>';
        }
        if (path !== "") {
            innerHTML += '<div id="' + contentLinkPlaceholderId + '"></div>';
        }
        this.domElement.innerHTML = innerHTML;
        if (html !== undefined && html !== "") {
            this.insertHtmlWithScripts(contentPlaceholderId, html).catch(function (err) {
                console.error('Error inserting HTML content:', err);
            });
        }
        if (path !== undefined && path !== "") {
            this.loadContentFromUrl(this.properties.contentLink)
                .then(function (content) {
                return _this.insertHtmlWithScripts(contentLinkPlaceholderId, content);
            })
                .catch(function (err) {
                var errorMessage = err.message || String(err);
                var str = "\n          <div class=\"".concat(styles.modernCewp, "\">\n              <div class=\"").concat(styles.row, "\">\n                <div class=\"").concat(styles.title, "\">").concat(strings.FailedToLoadLabel, "</div>\n                <div style=\"margin-bottom:5px;\">").concat(_this.properties.contentLink, "</div>\n                <div class=\"").concat(styles.title, "\">").concat(strings.ErrorMessageLabel, "</div>\n                <div style=\"color:red;\">").concat(errorMessage, "</div>\n              </div>\n          </div>");
                var errorContainer = document.getElementById(contentLinkPlaceholderId);
                if (errorContainer) {
                    errorContainer.innerHTML = str;
                }
            });
        }
        if (path === "" && html === "") {
            var str = "\n        <div class=\"".concat(styles.modernCewp, "\">\n          <div class=\"").concat(styles.container, "\">\n            <div class=\"").concat(styles.row, "\">\n              <div class=\"").concat(styles.title, "\">").concat(strings.DispModeEmpty, "</div>\n            </div>\n          </div>\n        </div>");
            this.domElement.innerHTML = str;
        }
    };
    ModernCewpWebPart.prototype.render = function () {
        // Detect display mode on classic and modern pages pages
        if (Environment.type === EnvironmentType.ClassicSharePoint) {
            this._renderView();
        }
        else if (Environment.type === EnvironmentType.SharePoint) {
            if (this.displayMode === DisplayMode.Edit) {
                // Modern SharePoint in Edit Mode
                this._renderEdit();
            }
            else if (this.displayMode === DisplayMode.Read) {
                // Modern SharePoint in Read Mode
                this._renderView();
            }
        }
    };
    Object.defineProperty(ModernCewpWebPart.prototype, "dataVersion", {
        get: function () {
            return Version.parse('1.0');
        },
        enumerable: false,
        configurable: true
    });
    ModernCewpWebPart.prototype.getPropertyPaneConfiguration = function () {
        return {
            pages: [
                {
                    groups: [
                        {
                            groupName: strings.BasicGroupName,
                            groupFields: [
                                PropertyPaneTextField('contentLink', {
                                    label: strings.ContentlinkFieldLabel,
                                    multiline: true,
                                    rows: 2,
                                    resizable: true
                                }),
                                PropertyPaneTextField('content', {
                                    label: strings.ContentFieldLabel,
                                    multiline: true,
                                    rows: 20,
                                    resizable: true
                                }),
                                PropertyPaneToggle('spPageContextInfo', {
                                    label: strings.AddspPageContextInfo,
                                    checked: this.properties.spPageContextInfo,
                                    onText: 'Enabled',
                                    offText: 'Disabled'
                                })
                            ]
                        }
                    ]
                }
            ]
        };
    };
    return ModernCewpWebPart;
}(BaseClientSideWebPart));
export default ModernCewpWebPart;
//# sourceMappingURL=ModernCewpWebPart.js.map