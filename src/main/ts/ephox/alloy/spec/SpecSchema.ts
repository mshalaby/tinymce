import { FieldProcessorAdt, FieldSchema, Objects, ValueSchema } from '@ephox/boulder';
import { Arr, Merger, Obj } from '@ephox/katamari';
import { JSON as Json } from '@ephox/sand';

import { AdtInterface } from '../alien/TypeDefinitions';
import { AlloySpec, ComponentSpec, RawDomSchema } from '../api/component/SpecTypes';
import { EventHandlerConfigRecord } from '../api/events/AlloyEvents';
import * as Fields from '../data/Fields';
import * as UiSubstitutes from './UiSubstitutes';

export interface SpecSchemaStruct {
  components: () => ComponentSpec;
  dom: () => RawDomSchema;
  domModification: () => {}; // TODO: Mike
  eventOrder: () => { [key: string]: string[] }; // TODO: Mike test this
  events: () => EventHandlerConfigRecord;
  originalSpec: () => any; // For debugging purposes only
  uid: () => string;
  'debug.sketcher': () => {};
  // ... optional
  // some items are optional
}
export interface ContainerBehaviours {
  dump: () => {};
  [key: string]: any;
}

const getPartsSchema = function (partNames, _optPartNames, _owner): FieldProcessorAdt[] {
  const owner = _owner !== undefined ? _owner : 'Unknown owner';
  const fallbackThunk = function () {
    return [
      Fields.output('partUids', { })
    ];
  };

  const optPartNames = _optPartNames !== undefined ? _optPartNames : fallbackThunk();
  if (partNames.length === 0 && optPartNames.length === 0) { return fallbackThunk(); }

  // temporary hacking
  const partsSchema = FieldSchema.strictObjOf(
    'parts',
    Arr.flatten([
      Arr.map(partNames, FieldSchema.strict),
      Arr.map(optPartNames, function (optPart) {
        return FieldSchema.defaulted(optPart, UiSubstitutes.single(false, function () {
          throw new Error('The optional part: ' + optPart + ' was not specified in the config, but it was used in components');
        }));
      })
    ])
  );

  const partUidsSchema = FieldSchema.state(
    'partUids',
    function (spec) {
      if (! Objects.hasKey(spec, 'parts')) {
        throw new Error(
          'Part uid definition for owner: ' + owner + ' requires "parts"\nExpected parts: ' + partNames.join(', ') + '\nSpec: ' +
          Json.stringify(spec, null, 2)
        );
      }
      const uids = Obj.map(spec.parts, function (v, k) {
        return Objects.readOptFrom(v, 'uid').getOrThunk(function () {
          return spec.uid + '-' + k;
        });
      });
      return uids;
    }
  );

  return [ partsSchema, partUidsSchema ];
};

const getPartUidsSchema = function (label, spec): FieldProcessorAdt {
  return FieldSchema.state(
    'partUids',
    function (spec) {
      if (! Objects.hasKey(spec, 'parts')) {
        throw new Error(
          'Part uid definition for owner: ' + label + ' requires "parts\nSpec: ' +
          Json.stringify(spec, null, 2)
        );
      }
      const uids = Obj.map(spec.parts, function (v, k) {
        return Objects.readOptFrom(v, 'uid').getOrThunk(function () {
          return spec.uid + '-' + k;
        });
      });
      return uids;
    }
  );
};

const base = function (label, partSchemas, partUidsSchemas, spec) {
  const ps = partSchemas.length > 0 ? [
    FieldSchema.strictObjOf('parts', partSchemas)
  ] : [ ];

  return ps.concat([
    FieldSchema.strict('uid'),
    FieldSchema.defaulted('dom', { }), // Maybe get rid of.
    FieldSchema.defaulted('components', [ ]),
    Fields.snapshot('originalSpec'),
    FieldSchema.defaulted('debug.sketcher', { })
  ]).concat(partUidsSchemas);
};

const asRawOrDie = function (label, schema, spec, partSchemas, partUidsSchemas) {
  const baseS = base(label, partSchemas, spec, partUidsSchemas);
  return ValueSchema.asRawOrDie(label + ' [SpecSchema]', ValueSchema.objOfOnly(baseS.concat(schema)), spec);
};

const asStructOrDie = function (label: string, schema: AdtInterface[], spec: AlloySpec, partSchemas: any[], partUidsSchemas: any[]): SpecSchemaStruct {
  const baseS = base(label, partSchemas, partUidsSchemas, spec);
  return ValueSchema.asStructOrDie(label + ' [SpecSchema]', ValueSchema.objOfOnly(baseS.concat(schema)), spec);
};

const extend = function (builder, original, nu) {
  // Merge all at the moment.
  const newSpec = Merger.deepMerge(original, nu);
  return builder(newSpec);
};

const addBehaviours = function (original, behaviours) {
  return Merger.deepMerge(original, behaviours);
};

export {
  asRawOrDie,
  asStructOrDie,
  addBehaviours,

  getPartsSchema,
  extend
};