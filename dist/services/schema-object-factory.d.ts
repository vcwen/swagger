/// <reference types="lodash" />
import { Type } from '@nestjs/common';
import { BaseParameterObject, ParameterObject, ReferenceObject, SchemaObject } from '../interfaces/open-api-spec.interface';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface';
import { ModelPropertiesAccessor } from './model-properties-accessor';
import { ParamWithTypeMetadata } from './parameter-metadata-accessor';
import { SwaggerTypesMapper } from './swagger-types-mapper';
export declare class SchemaObjectFactory {
    private readonly modelPropertiesAccessor;
    private readonly swaggerTypesMapper;
    constructor(modelPropertiesAccessor: ModelPropertiesAccessor, swaggerTypesMapper: SwaggerTypesMapper);
    createFromModel(parameters: ParamWithTypeMetadata[], schemas: Record<string, SchemaObject>): Array<ParamWithTypeMetadata | BaseParameterObject>;
    createQueryOrParamSchema(param: ParamWithTypeMetadata, schemas: Record<string, SchemaObject>): ParameterObject[] | ParamWithTypeMetadata | import("lodash").Omit<ParamWithTypeMetadata & BaseParameterObject, "items" | "enum" | "isArray" | "enumName"> | {
        type: string;
        name?: string | number | object;
        in?: import("../interfaces/open-api-spec.interface").ParameterLocation | "body" | "placeholder";
        isArray?: boolean;
        items?: SchemaObject;
        required: true;
        enum?: unknown[];
        enumName?: string;
        format: string;
    };
    extractPropertiesFromType(type: Type<unknown>, schemas: Record<string, SchemaObject>, pendingSchemasRefs?: string[]): ParameterObject[];
    exploreModelSchema(type: Type<unknown> | Function, schemas: Record<string, SchemaObject>, pendingSchemasRefs?: string[]): string;
    mergePropertyWithMetadata(key: string, prototype: Type<unknown>, schemas: Record<string, SchemaObject>, pendingSchemaRefs: string[], metadata?: SchemaObjectMetadata): SchemaObjectMetadata | ReferenceObject | ParameterObject;
    createEnumParam(param: ParamWithTypeMetadata & BaseParameterObject, schemas: Record<string, SchemaObject>): import("lodash").Omit<ParamWithTypeMetadata & BaseParameterObject, "items" | "enum" | "isArray" | "enumName">;
    createEnumSchemaType(key: string, metadata: SchemaObjectMetadata, schemas: Record<string, SchemaObject>): Partial<{
        $ref: string;
        items?: SchemaObject | ReferenceObject;
        name: string;
        type: string;
        isArray?: boolean;
        required?: boolean;
        enumName?: string;
        default?: any;
        externalDocs?: import("../interfaces/open-api-spec.interface").ExternalDocumentationObject;
        description?: string;
        nullable?: boolean;
        discriminator?: import("../interfaces/open-api-spec.interface").DiscriminatorObject;
        readOnly?: boolean;
        writeOnly?: boolean;
        xml?: import("../interfaces/open-api-spec.interface").XmlObject;
        example?: any;
        examples?: any[] | Record<string, any>;
        deprecated?: boolean;
        allOf?: (SchemaObject | ReferenceObject)[];
        oneOf?: (SchemaObject | ReferenceObject)[];
        anyOf?: (SchemaObject | ReferenceObject)[];
        not?: SchemaObject | ReferenceObject;
        properties?: Record<string, SchemaObject | ReferenceObject>;
        additionalProperties?: boolean | SchemaObject | ReferenceObject;
        patternProperties?: any;
        format?: string;
        title?: string;
        multipleOf?: number;
        maximum?: number;
        exclusiveMaximum?: boolean;
        minimum?: number;
        exclusiveMinimum?: boolean;
        maxLength?: number;
        minLength?: number;
        pattern?: string;
        maxItems?: number;
        minItems?: number;
        uniqueItems?: boolean;
        maxProperties?: number;
        minProperties?: number;
        enum?: any[];
    }> | {
        name: string;
        type?: string | Function | Record<string, any> | Type<unknown> | [Function];
        isArray?: boolean;
        required?: boolean;
        enumName?: string;
        default?: any;
        externalDocs?: import("../interfaces/open-api-spec.interface").ExternalDocumentationObject;
        description?: string;
        nullable?: boolean;
        discriminator?: import("../interfaces/open-api-spec.interface").DiscriminatorObject;
        readOnly?: boolean;
        writeOnly?: boolean;
        xml?: import("../interfaces/open-api-spec.interface").XmlObject;
        example?: any;
        examples?: any[] | Record<string, any>;
        deprecated?: boolean;
        allOf?: (SchemaObject | ReferenceObject)[];
        oneOf?: (SchemaObject | ReferenceObject)[];
        anyOf?: (SchemaObject | ReferenceObject)[];
        not?: SchemaObject | ReferenceObject;
        items?: SchemaObject | ReferenceObject;
        properties?: Record<string, SchemaObject | ReferenceObject>;
        additionalProperties?: boolean | SchemaObject | ReferenceObject;
        patternProperties?: any;
        format?: string;
        title?: string;
        multipleOf?: number;
        maximum?: number;
        exclusiveMaximum?: boolean;
        minimum?: number;
        exclusiveMinimum?: boolean;
        maxLength?: number;
        minLength?: number;
        pattern?: string;
        maxItems?: number;
        minItems?: number;
        uniqueItems?: boolean;
        maxProperties?: number;
        minProperties?: number;
        enum?: any[];
    };
    createNotBuiltInTypeReference(key: string, metadata: SchemaObjectMetadata, trueMetadataType: unknown, schemas: Record<string, SchemaObject>, pendingSchemaRefs: string[]): SchemaObjectMetadata;
    transformToArraySchemaProperty(metadata: SchemaObjectMetadata, key: string, type: string | Record<string, any>): SchemaObjectMetadata;
    mapArrayCtorParam(param: ParamWithTypeMetadata): any;
    createFromObjectLiteral(key: string, literalObj: Record<string, any>, schemas: Record<string, SchemaObject>): {
        name: string;
        type: string;
        properties: {};
    };
    createFromNestedArray(key: string, metadata: SchemaObjectMetadata, schemas: Record<string, SchemaObject>, pendingSchemaRefs: string[]): any;
    private createSchemaMetadata;
    private isArrayCtor;
    private isPrimitiveType;
    private isLazyTypeFunc;
    private getTypeName;
    private isObjectLiteral;
    private isBigInt;
    private extractPropertyModifiers;
}
