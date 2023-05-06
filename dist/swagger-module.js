"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerModule = void 0;
const jsyaml = require("js-yaml");
const swagger_scanner_1 = require("./swagger-scanner");
const swagger_ui_1 = require("./swagger-ui");
const assign_two_levels_deep_1 = require("./utils/assign-two-levels-deep");
const get_global_prefix_1 = require("./utils/get-global-prefix");
const validate_path_util_1 = require("./utils/validate-path.util");
const normalize_rel_path_1 = require("./utils/normalize-rel-path");
const validate_global_prefix_util_1 = require("./utils/validate-global-prefix.util");
const hash_1 = require("./utils/hash");
class SwaggerModule {
    static createDocument(app, config, options = {}) {
        const swaggerScanner = new swagger_scanner_1.SwaggerScanner();
        const document = swaggerScanner.scanApplication(app, options);
        document.components = (0, assign_two_levels_deep_1.assignTwoLevelsDeep)({}, config.components, document.components);
        return Object.assign(Object.assign({ openapi: '3.0.0', paths: {} }, config), document);
    }
    static serveStatic(finalPath, app) {
        const httpAdapter = app.getHttpAdapter();
        const swaggerAssetsAbsoluteFSPath = (0, swagger_ui_1.getSwaggerAssetsAbsoluteFSPath)();
        if (httpAdapter && httpAdapter.getType() === 'fastify') {
            app.useStaticAssets({
                root: swaggerAssetsAbsoluteFSPath,
                prefix: finalPath,
                decorateReply: false
            });
        }
        else {
            app.useStaticAssets(swaggerAssetsAbsoluteFSPath, { prefix: finalPath });
        }
    }
    static serveDocuments(finalPath, urlLastSubdirectory, httpAdapter, swaggerInitJS, options) {
        const hash = (0, hash_1.sha1)(swaggerInitJS);
        httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(`${finalPath}/swagger-ui-init-${hash}.js`), (req, res) => {
            res.type('application/javascript');
            res.send(swaggerInitJS);
        });
        try {
            httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(`${finalPath}/${urlLastSubdirectory}/swagger-ui-init-${hash}.js`), (req, res) => {
                res.type('application/javascript');
                res.send(swaggerInitJS);
            });
        }
        catch (err) {
        }
        httpAdapter.get(finalPath, (req, res) => {
            res.type('text/html');
            res.send(options.html);
        });
        try {
            httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(`${finalPath}/`), (req, res) => {
                res.type('text/html');
                res.send(options.html);
            });
        }
        catch (err) {
        }
        httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(options.jsonDocumentUrl), (req, res) => {
            res.type('application/json');
            res.send(options.jsonDocument);
        });
        httpAdapter.get((0, normalize_rel_path_1.normalizeRelPath)(options.yamlDocumentUrl), (req, res) => {
            res.type('text/yaml');
            res.send(options.yamlDocument);
        });
    }
    static setup(path, app, document, options) {
        const globalPrefix = (0, get_global_prefix_1.getGlobalPrefix)(app);
        const finalPath = (0, validate_path_util_1.validatePath)((options === null || options === void 0 ? void 0 : options.useGlobalPrefix) && (0, validate_global_prefix_util_1.validateGlobalPrefix)(globalPrefix)
            ? `${globalPrefix}${(0, validate_path_util_1.validatePath)(path)}`
            : path);
        const urlLastSubdirectory = finalPath.split('/').slice(-1).pop();
        const yamlDocument = jsyaml.dump(document, { skipInvalid: true });
        const jsonDocument = JSON.stringify(document);
        const validatedGlobalPrefix = (options === null || options === void 0 ? void 0 : options.useGlobalPrefix) && (0, validate_global_prefix_util_1.validateGlobalPrefix)(globalPrefix)
            ? (0, validate_path_util_1.validatePath)(globalPrefix)
            : '';
        const finalJSONDocumentPath = (options === null || options === void 0 ? void 0 : options.jsonDocumentUrl)
            ? `${validatedGlobalPrefix}${(0, validate_path_util_1.validatePath)(options.jsonDocumentUrl)}`
            : `${finalPath}-json`;
        const finalYAMLDocumentPath = (options === null || options === void 0 ? void 0 : options.yamlDocumentUrl)
            ? `${validatedGlobalPrefix}${(0, validate_path_util_1.validatePath)(options.yamlDocumentUrl)}`
            : `${finalPath}-yaml`;
        const baseUrlForSwaggerUI = (0, normalize_rel_path_1.normalizeRelPath)(`./${urlLastSubdirectory}/`);
        const swaggerInitJS = (0, swagger_ui_1.buildSwaggerInitJS)(document, options);
        const swaggerHash = (0, hash_1.sha1)(swaggerInitJS);
        const html = (0, swagger_ui_1.buildSwaggerHTML)(baseUrlForSwaggerUI, swaggerHash, options);
        const httpAdapter = app.getHttpAdapter();
        SwaggerModule.serveDocuments(finalPath, urlLastSubdirectory, httpAdapter, swaggerInitJS, {
            html,
            yamlDocument,
            jsonDocument,
            jsonDocumentUrl: finalJSONDocumentPath,
            yamlDocumentUrl: finalYAMLDocumentPath
        });
        SwaggerModule.serveStatic(finalPath, app);
        const serveStaticSlashEndingPath = `${finalPath}/${urlLastSubdirectory}`;
        if (serveStaticSlashEndingPath !== finalPath) {
            SwaggerModule.serveStatic(serveStaticSlashEndingPath, app);
        }
    }
}
exports.SwaggerModule = SwaggerModule;
