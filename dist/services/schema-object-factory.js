"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaObjectFactory = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const helpers_1 = require("../decorators/helpers");
const api_extra_models_explorer_1 = require("../explorers/api-extra-models.explorer");
const utils_1 = require("../utils");
const enum_utils_1 = require("../utils/enum.utils");
const is_body_parameter_util_1 = require("../utils/is-body-parameter.util");
const is_built_in_type_util_1 = require("../utils/is-built-in-type.util");
const is_date_ctor_util_1 = require("../utils/is-date-ctor.util");
class SchemaObjectFactory {
    constructor(modelPropertiesAccessor, swaggerTypesMapper) {
        this.modelPropertiesAccessor = modelPropertiesAccessor;
        this.swaggerTypesMapper = swaggerTypesMapper;
    }
    createFromModel(parameters, schemas) {
        const parameterObjects = parameters.map((param) => {
            if (this.isLazyTypeFunc(param.type)) {
                [param.type, param.isArray] = (0, helpers_1.getTypeIsArrayTuple)(param.type(), undefined);
            }
            if (this.isPrimitiveType(param.type)) {
                return param;
            }
            if (this.isArrayCtor(param.type)) {
                return this.mapArrayCtorParam(param);
            }
            if (!(0, is_body_parameter_util_1.isBodyParameter)(param)) {
                return this.createQueryOrParamSchema(param, schemas);
            }
            const modelName = this.exploreModelSchema(param.type, schemas);
            const name = param.name || modelName;
            const schema = Object.assign(Object.assign({}, (param.schema || {})), { $ref: (0, utils_1.getSchemaPath)(modelName) });
            const isArray = param.isArray;
            param = (0, lodash_1.omit)(param, 'isArray');
            if (isArray) {
                return Object.assign(Object.assign({}, param), { name, schema: {
                        type: 'array',
                        items: schema
                    } });
            }
            return Object.assign(Object.assign({}, param), { name,
                schema });
        });
        return (0, lodash_1.flatten)(parameterObjects);
    }
    createQueryOrParamSchema(param, schemas) {
        if (param.enumName) {
            return this.createEnumParam(param, schemas);
        }
        if ((0, is_date_ctor_util_1.isDateCtor)(param.type)) {
            return Object.assign(Object.assign({ format: 'date-time' }, param), { type: 'string' });
        }
        if ((0, lodash_1.isFunction)(param.type)) {
            const propertiesWithType = this.extractPropertiesFromType(param.type, schemas);
            if (!propertiesWithType) {
                return param;
            }
            return propertiesWithType.map((property) => {
                var _a;
                const parameterObject = Object.assign(Object.assign({}, (0, lodash_1.omit)(property, 'enumName')), { in: 'query', required: (_a = property.required) !== null && _a !== void 0 ? _a : true });
                return parameterObject;
            });
        }
        return param;
    }
    extractPropertiesFromType(type, schemas, pendingSchemasRefs = []) {
        const { prototype } = type;
        if (!prototype) {
            return;
        }
        const extraModels = (0, api_extra_models_explorer_1.exploreGlobalApiExtraModelsMetadata)(type);
        extraModels.forEach((item) => this.exploreModelSchema(item, schemas, pendingSchemasRefs));
        this.modelPropertiesAccessor.applyMetadataFactory(prototype);
        const modelProperties = this.modelPropertiesAccessor.getModelProperties(prototype);
        const propertiesWithType = modelProperties.map((key) => {
            const property = this.mergePropertyWithMetadata(key, prototype, schemas, pendingSchemasRefs);
            const schemaCombinators = ['oneOf', 'anyOf', 'allOf'];
            if (schemaCombinators.some((key) => key in property)) {
                delete property.type;
            }
            return property;
        });
        return propertiesWithType;
    }
    exploreModelSchema(type, schemas, pendingSchemasRefs = []) {
        if (this.isLazyTypeFunc(type)) {
            type = type();
        }
        const propertiesWithType = this.extractPropertiesFromType(type, schemas, pendingSchemasRefs);
        if (!propertiesWithType) {
            return '';
        }
        const typeDefinition = {
            type: 'object',
            properties: (0, lodash_1.mapValues)((0, lodash_1.keyBy)(propertiesWithType, 'name'), (property) => (0, lodash_1.omit)(property, ['name', 'isArray', 'required', 'enumName']))
        };
        const typeDefinitionRequiredFields = propertiesWithType
            .filter((property) => property.required != false)
            .map((property) => property.name);
        if (typeDefinitionRequiredFields.length > 0) {
            typeDefinition['required'] = typeDefinitionRequiredFields;
        }
        schemas[type.name] = typeDefinition;
        return type.name;
    }
    mergePropertyWithMetadata(key, prototype, schemas, pendingSchemaRefs, metadata) {
        if (!metadata) {
            metadata =
                Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES, prototype, key) ||
                    {};
        }
        if (this.isLazyTypeFunc(metadata.type)) {
            metadata.type = metadata.type();
            [metadata.type, metadata.isArray] = (0, helpers_1.getTypeIsArrayTuple)(metadata.type, metadata.isArray);
        }
        if (Array.isArray(metadata.type)) {
            return this.createFromNestedArray(key, metadata, schemas, pendingSchemaRefs);
        }
        return this.createSchemaMetadata(key, metadata, schemas, pendingSchemaRefs);
    }
    createEnumParam(param, schemas) {
        var _a, _b, _c;
        const enumName = param.enumName;
        const $ref = (0, utils_1.getSchemaPath)(enumName);
        if (!(enumName in schemas)) {
            const _enum = param.enum
                ? param.enum
                : param.schema ?
                    (param.schema['items']
                        ? param.schema['items']['enum']
                        : param.schema['enum'])
                    : param.isArray && param.items
                        ? param.items.enum
                        : undefined;
            schemas[enumName] = {
                type: (_b = (_a = param.schema) === null || _a === void 0 ? void 0 : _a['type']) !== null && _b !== void 0 ? _b : 'string',
                enum: _enum
            };
        }
        param.schema =
            param.isArray || ((_c = param.schema) === null || _c === void 0 ? void 0 : _c['items'])
                ? { type: 'array', items: { $ref } }
                : { $ref };
        return (0, lodash_1.omit)(param, ['isArray', 'items', 'enumName', 'enum']);
    }
    createEnumSchemaType(key, metadata, schemas) {
        if (!metadata.enumName) {
            return Object.assign(Object.assign({}, metadata), { name: metadata.name || key });
        }
        const enumName = metadata.enumName;
        const $ref = (0, utils_1.getSchemaPath)(enumName);
        if (!(enumName in schemas)) {
            schemas[enumName] = {
                type: 'string',
                enum: metadata.isArray && metadata.items
                    ? metadata.items['enum']
                    : metadata.enum
            };
        }
        const _schemaObject = Object.assign(Object.assign({}, metadata), { name: metadata.name || key, type: metadata.isArray ? 'array' : 'string' });
        const refHost = metadata.isArray ? { items: { $ref } } : { $ref };
        const paramObject = Object.assign(Object.assign({}, _schemaObject), refHost);
        const pathsToOmit = ['enum', 'enumName'];
        if (!metadata.isArray) {
            pathsToOmit.push('type');
        }
        return (0, lodash_1.omit)(paramObject, pathsToOmit);
    }
    createNotBuiltInTypeReference(key, metadata, trueMetadataType, schemas, pendingSchemaRefs) {
        if ((0, shared_utils_1.isUndefined)(trueMetadataType)) {
            throw new Error(`A circular dependency has been detected (property key: "${key}"). Please, make sure that each side of a bidirectional relationships are using lazy resolvers ("type: () => ClassType").`);
        }
        let schemaObjectName = trueMetadataType.name;
        if (!(schemaObjectName in schemas) &&
            !pendingSchemaRefs.includes(schemaObjectName)) {
            schemaObjectName = this.exploreModelSchema(trueMetadataType, schemas, [...pendingSchemaRefs, schemaObjectName]);
        }
        const $ref = (0, utils_1.getSchemaPath)(schemaObjectName);
        if (metadata.isArray) {
            return this.transformToArraySchemaProperty(metadata, key, { $ref });
        }
        const keysToRemove = ['type', 'isArray', 'required'];
        const validMetadataObject = (0, lodash_1.omit)(metadata, keysToRemove);
        const extraMetadataKeys = Object.keys(validMetadataObject);
        if (extraMetadataKeys.length > 0) {
            return Object.assign(Object.assign({ name: metadata.name || key, required: metadata.required }, validMetadataObject), { allOf: [{ $ref }] });
        }
        return {
            name: metadata.name || key,
            required: metadata.required,
            $ref
        };
    }
    transformToArraySchemaProperty(metadata, key, type) {
        const keysToRemove = ['type', 'enum'];
        const [movedProperties, keysToMove] = this.extractPropertyModifiers(metadata);
        const schemaHost = Object.assign(Object.assign({}, (0, lodash_1.omit)(metadata, [...keysToRemove, ...keysToMove])), { name: metadata.name || key, type: 'array', items: (0, lodash_1.isString)(type)
                ? Object.assign({ type }, movedProperties) : Object.assign(Object.assign({}, type), movedProperties) });
        schemaHost.items = (0, lodash_1.omitBy)(schemaHost.items, shared_utils_1.isUndefined);
        return schemaHost;
    }
    mapArrayCtorParam(param) {
        return Object.assign(Object.assign({}, (0, lodash_1.omit)(param, 'type')), { schema: {
                type: 'array',
                items: {
                    type: 'string'
                }
            } });
    }
    createFromObjectLiteral(key, literalObj, schemas) {
        const objLiteralKeys = Object.keys(literalObj);
        const properties = {};
        objLiteralKeys.forEach((key) => {
            const propertyCompilerMetadata = literalObj[key];
            if ((0, enum_utils_1.isEnumArray)(propertyCompilerMetadata)) {
                propertyCompilerMetadata.type = 'array';
                const enumValues = (0, enum_utils_1.getEnumValues)(propertyCompilerMetadata.enum);
                propertyCompilerMetadata.items = {
                    type: (0, enum_utils_1.getEnumType)(enumValues),
                    enum: enumValues
                };
                delete propertyCompilerMetadata.enum;
            }
            else if (propertyCompilerMetadata.enum) {
                const enumValues = (0, enum_utils_1.getEnumValues)(propertyCompilerMetadata.enum);
                propertyCompilerMetadata.enum = enumValues;
                propertyCompilerMetadata.type = (0, enum_utils_1.getEnumType)(enumValues);
            }
            const propertyMetadata = this.mergePropertyWithMetadata(key, Object, schemas, [], propertyCompilerMetadata);
            const keysToRemove = ['isArray', 'name'];
            const validMetadataObject = (0, lodash_1.omit)(propertyMetadata, keysToRemove);
            properties[key] = validMetadataObject;
        });
        return {
            name: key,
            type: 'object',
            properties
        };
    }
    createFromNestedArray(key, metadata, schemas, pendingSchemaRefs) {
        const recurse = (type) => {
            if (!Array.isArray(type)) {
                const schemaMetadata = this.createSchemaMetadata(key, metadata, schemas, pendingSchemaRefs, type);
                return (0, lodash_1.omit)(schemaMetadata, ['isArray', 'name']);
            }
            return {
                name: key,
                type: 'array',
                items: recurse(type[0])
            };
        };
        return recurse(metadata.type);
    }
    createSchemaMetadata(key, metadata, schemas, pendingSchemaRefs, nestedArrayType) {
        const trueType = nestedArrayType || metadata.type;
        if (this.isObjectLiteral(trueType)) {
            return this.createFromObjectLiteral(key, trueType, schemas);
        }
        if ((0, lodash_1.isString)(trueType)) {
            if ((0, enum_utils_1.isEnumMetadata)(metadata)) {
                return this.createEnumSchemaType(key, metadata, schemas);
            }
            if (metadata.isArray) {
                return this.transformToArraySchemaProperty(metadata, key, trueType);
            }
            return Object.assign(Object.assign({}, metadata), { name: metadata.name || key });
        }
        if ((0, is_date_ctor_util_1.isDateCtor)(trueType)) {
            if (metadata.isArray) {
                return this.transformToArraySchemaProperty(metadata, key, {
                    format: metadata.format || 'date-time',
                    type: 'string'
                });
            }
            return Object.assign(Object.assign({ format: 'date-time' }, metadata), { type: 'string', name: metadata.name || key });
        }
        if (this.isBigInt(trueType)) {
            return Object.assign(Object.assign({ format: 'int64' }, metadata), { type: 'integer', name: metadata.name || key });
        }
        if (!(0, is_built_in_type_util_1.isBuiltInType)(trueType)) {
            return this.createNotBuiltInTypeReference(key, metadata, trueType, schemas, pendingSchemaRefs);
        }
        const typeName = this.getTypeName(trueType);
        const itemType = this.swaggerTypesMapper.mapTypeToOpenAPIType(typeName);
        if (metadata.isArray) {
            return this.transformToArraySchemaProperty(metadata, key, {
                type: itemType
            });
        }
        else if (itemType === 'array') {
            const defaultOnArray = 'string';
            return this.transformToArraySchemaProperty(metadata, key, {
                type: defaultOnArray
            });
        }
        return Object.assign(Object.assign({}, metadata), { name: metadata.name || key, type: itemType });
    }
    isArrayCtor(type) {
        return type === Array;
    }
    isPrimitiveType(type) {
        return ((0, lodash_1.isFunction)(type) &&
            [String, Boolean, Number].some((item) => item === type));
    }
    isLazyTypeFunc(type) {
        return (0, lodash_1.isFunction)(type) && type.name == 'type';
    }
    getTypeName(type) {
        return type && (0, lodash_1.isFunction)(type) ? type.name : type;
    }
    isObjectLiteral(obj) {
        if (typeof obj !== 'object' || !obj) {
            return false;
        }
        const hasOwnProp = Object.prototype.hasOwnProperty;
        let objPrototype = obj;
        while (Object.getPrototypeOf((objPrototype = Object.getPrototypeOf(objPrototype))) !== null)
            ;
        for (const prop in obj) {
            if (!hasOwnProp.call(obj, prop) && !hasOwnProp.call(objPrototype, prop)) {
                return false;
            }
        }
        return Object.getPrototypeOf(obj) === objPrototype;
    }
    isBigInt(type) {
        return type === BigInt;
    }
    extractPropertyModifiers(metadata) {
        const modifierKeys = [
            'format',
            'maximum',
            'maxLength',
            'minimum',
            'minLength',
            'pattern'
        ];
        return [(0, lodash_1.pick)(metadata, modifierKeys), modifierKeys];
    }
}
exports.SchemaObjectFactory = SchemaObjectFactory;
