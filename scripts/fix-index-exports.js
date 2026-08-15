"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var schemasDir = path_1.default.join(process.cwd(), 'src/api/generated/schemas');
var services = fs_1.default.readdirSync(schemasDir).filter(function (f) { return fs_1.default.statSync(path_1.default.join(schemasDir, f)).isDirectory(); });
for (var _i = 0, services_1 = services; _i < services_1.length; _i++) {
    var service = services_1[_i];
    var indexFile = path_1.default.join(schemasDir, service, 'index.ts');
    if (fs_1.default.existsSync(indexFile)) {
        var content = fs_1.default.readFileSync(indexFile, 'utf8');
        var facadeName = "create".concat(service.charAt(0).toUpperCase() + service.slice(1), "Facade");
        var exportLine = "export { ".concat(facadeName, " as createApiClient } from './facade';\n");
        if (!content.includes(exportLine)) {
            fs_1.default.writeFileSync(indexFile, content + '\n' + exportLine);
            console.log("Added createApiClient export to ".concat(service, "/index.ts"));
        }
    }
}
