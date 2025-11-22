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
var GraphService = /** @class */ (function () {
    function GraphService(context) {
        this.userCache = new Map();
        this.photoCache = new Map();
        this.subordinatesCountCache = new Map();
        this.context = context;
    }
    GraphService.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        console.log('GraphService: Requesting MS Graph Client v3...');
                        _a = this;
                        return [4 /*yield*/, this.context.msGraphClientFactory.getClient('3')];
                    case 1:
                        _a.graphClient = _b.sent();
                        console.log('GraphService: MS Graph Client obtained successfully');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        console.error('GraphService: Failed to get MS Graph Client:', error_1);
                        throw new Error("Failed to initialize Graph client: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GraphService.prototype.getCurrentUser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.graphClient) {
                            throw new Error('Graph client not initialized');
                        }
                        return [4 /*yield*/, this.graphClient
                                .api('/me')
                                .select('id,displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation')
                                .get()];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    GraphService.prototype.getUserById = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.userCache.has(userId)) {
                            return [2 /*return*/, this.userCache.get(userId)];
                        }
                        if (!this.graphClient) {
                            throw new Error('Graph client not initialized');
                        }
                        return [4 /*yield*/, this.graphClient
                                .api("/users/".concat(userId))
                                .select('id,displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation')
                                .get()];
                    case 1:
                        response = _a.sent();
                        this.userCache.set(userId, response);
                        return [2 /*return*/, response];
                }
            });
        });
    };
    GraphService.prototype.getUserPhoto = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var photoBlob, photoUrl, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.photoCache.has(userId)) {
                            return [2 /*return*/, this.photoCache.get(userId)];
                        }
                        if (!this.graphClient) {
                            throw new Error('Graph client not initialized');
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.graphClient
                                .api("/users/".concat(userId, "/photo/$value"))
                                .get()];
                    case 2:
                        photoBlob = _b.sent();
                        photoUrl = URL.createObjectURL(photoBlob);
                        this.photoCache.set(userId, photoUrl);
                        return [2 /*return*/, photoUrl];
                    case 3:
                        _a = _b.sent();
                        console.warn("Could not fetch photo for user ".concat(userId));
                        return [2 /*return*/, undefined];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GraphService.prototype.getDirectReports = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.graphClient) {
                            throw new Error('Graph client not initialized');
                        }
                        return [4 /*yield*/, this.graphClient
                                .api("/users/".concat(userId, "/directReports"))
                                .select('id,displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation')
                                .get()];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.value || []];
                }
            });
        });
    };
    GraphService.prototype.getManager = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.graphClient) {
                            throw new Error('Graph client not initialized');
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.graphClient
                                .api("/users/".concat(userId, "/manager"))
                                .select('id,displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation')
                                .get()];
                    case 2:
                        response = _b.sent();
                        return [2 /*return*/, response];
                    case 3:
                        _a = _b.sent();
                        console.warn("No manager found for user ".concat(userId));
                        return [2 /*return*/, undefined];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GraphService.prototype.buildOrgHierarchy = function (startUserId, maxDepth, currentDepth) {
        if (maxDepth === void 0) { maxDepth = 5; }
        if (currentDepth === void 0) { currentDepth = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var user, directReports, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getUserById(startUserId)];
                    case 1:
                        user = _b.sent();
                        if (currentDepth >= maxDepth) {
                            return [2 /*return*/, user];
                        }
                        return [4 /*yield*/, this.getDirectReports(startUserId)];
                    case 2:
                        directReports = _b.sent();
                        if (!(directReports.length > 0)) return [3 /*break*/, 4];
                        _a = user;
                        return [4 /*yield*/, Promise.all(directReports.map(function (report) {
                                return _this.buildOrgHierarchy(report.id, maxDepth, currentDepth + 1);
                            }))];
                    case 3:
                        _a.directReports = _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/, user];
                }
            });
        });
    };
    GraphService.prototype.searchUsers = function (searchTerm) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.graphClient) {
                            throw new Error('Graph client not initialized');
                        }
                        return [4 /*yield*/, this.graphClient
                                .api('/users')
                                .filter("startsWith(displayName,'".concat(searchTerm, "') or startsWith(mail,'").concat(searchTerm, "')"))
                                .select('id,displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation')
                                .top(20)
                                .get()];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.value || []];
                }
            });
        });
    };
    GraphService.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var response, upnError_1, searchResponse, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.graphClient) {
                            throw new Error('Graph client not initialized');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, this.graphClient
                                .api("/users/".concat(encodeURIComponent(email)))
                                .select('id,displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation')
                                .get()];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 4:
                        upnError_1 = _a.sent();
                        return [4 /*yield*/, this.graphClient
                                .api('/users')
                                .filter("mail eq '".concat(email.replace(/'/g, "''"), "' or userPrincipalName eq '").concat(email.replace(/'/g, "''"), "'"))
                                .select('id,displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation')
                                .top(1)
                                .get()];
                    case 5:
                        searchResponse = _a.sent();
                        if (searchResponse.value && searchResponse.value.length > 0) {
                            return [2 /*return*/, searchResponse.value[0]];
                        }
                        throw upnError_1; // Re-throw if both methods fail
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        console.warn("User not found with email: ".concat(email), error_2);
                        return [2 /*return*/, undefined];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    GraphService.prototype.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.graphClient) {
                            throw new Error('Graph client not initialized');
                        }
                        return [4 /*yield*/, this.graphClient
                                .api('/users')
                                .select('id,displayName,jobTitle,department,officeLocation')
                                .top(999)
                                .get()];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.value || []];
                }
            });
        });
    };
    /**
     * Gets the total count of all subordinates (direct and indirect) for a user
     * @param userId - The user ID to count subordinates for
     * @returns The total number of people reporting to this user (directly or indirectly)
     */
    GraphService.prototype.getTotalSubordinatesCount = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var directReports, totalCount, childCounts, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check cache first
                        if (this.subordinatesCountCache.has(userId)) {
                            return [2 /*return*/, this.subordinatesCountCache.get(userId)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.getDirectReports(userId)];
                    case 2:
                        directReports = _a.sent();
                        if (directReports.length === 0) {
                            this.subordinatesCountCache.set(userId, 0);
                            return [2 /*return*/, 0];
                        }
                        totalCount = directReports.length;
                        return [4 /*yield*/, Promise.all(directReports.map(function (report) { return _this.getTotalSubordinatesCount(report.id); }))];
                    case 3:
                        childCounts = _a.sent();
                        // Add all indirect reports
                        totalCount += childCounts.reduce(function (sum, count) { return sum + count; }, 0);
                        // Cache the result
                        this.subordinatesCountCache.set(userId, totalCount);
                        return [2 /*return*/, totalCount];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Error getting subordinates count for user ".concat(userId, ":"), error_3);
                        return [2 /*return*/, 0];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return GraphService;
}());
export { GraphService };
//# sourceMappingURL=GraphService.js.map