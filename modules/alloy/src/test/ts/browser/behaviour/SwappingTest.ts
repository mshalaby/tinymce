import { ApproxStructure, Assertions, Step } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock-client';
import { Arr, Fun } from '@ephox/katamari';

import * as Behaviour from 'ephox/alloy/api/behaviour/Behaviour';
import { Swapping } from 'ephox/alloy/api/behaviour/Swapping';
import * as GuiFactory from 'ephox/alloy/api/component/GuiFactory';
import { Container } from 'ephox/alloy/api/ui/Container';
import * as GuiSetup from 'ephox/alloy/api/testhelpers/GuiSetup';

UnitTest.asynctest('SwappingTest', (success, failure) => {

  const ALPHA_CLS = Fun.constant('i-am-the-alpha');
  const OMEGA_CLS = Fun.constant('and-the-omega');

  GuiSetup.setup((store, doc, body) => {
    return GuiFactory.build(
      Container.sketch({
        dom: {
          tag: 'div',
          styles: {
            background: 'steelblue',
            height: '200px',
            width: '200px'
          },
          attributes: {
            'test-uid': 'wat-uid'
          }
        },
        containerBehaviours: Behaviour.derive([
          Swapping.config({
            alpha: ALPHA_CLS(),
            omega: OMEGA_CLS()
          })
        ])
      })
    );
  }, (doc, body, gui, component, store) => {
    // string -> [string] -> [string] -> ()
    const assertClasses = (label: string, has: string[], not: string[]) => {
      Assertions.assertStructure(
        'Asserting structure after: ' + label,
        ApproxStructure.build((s, str, arr) => {
          return s.element('div', {
            classes: Arr.map(has, arr.has).concat(Arr.map(not, arr.not)),
            attrs: {
              'test-uid': str.is('wat-uid')
            }
          });
        }),
        component.element()
      );
    };

    const testHasNoClass = (label: string) => {
      return Step.sync(() => {
        assertClasses(label, [], [ ALPHA_CLS(), OMEGA_CLS() ]);
      });
    };

    const testHasAlpha = (label: string) => {
      return Step.sync(() => {
        assertClasses(label, [ ALPHA_CLS() ], [ OMEGA_CLS() ]);
      });
    };

    const testHasOmega = (label: string) => {
      return Step.sync(() => {
        assertClasses(label, [ OMEGA_CLS() ], [ ALPHA_CLS() ]);
      });
    };

    const testPredicates = (label: string, isAlpha: boolean, isOmega: boolean) => {
      return Step.sync(() => {
        Assertions.assertEq(label, isAlpha, Swapping.isAlpha(component));
        Assertions.assertEq(label, isOmega, Swapping.isOmega(component));
      });
    };

    const sAlpha = Step.sync(() => {
      Swapping.toAlpha(component);
    });

    const sOmega = Step.sync(() => {
      Swapping.toOmega(component);
    });

    const sClear = Step.sync(() => {
      Swapping.clear(component);
    });

    return [
      testHasNoClass('no initial class'),
      testPredicates('isAlpha, isOmega', false, false),

      sAlpha,
      testHasAlpha('initial alpha class'),
      testPredicates('isAlpha, isOmega', true, false),

      sOmega,
      testHasOmega('swap to omega class'),
      testPredicates('isAlpha, isOmega', false, true),

      sAlpha,
      testHasAlpha('swap back to alpha class'),
      testPredicates('isAlpha, isOmega', true, false),

      sClear,
      testHasNoClass('clear classes'),
      testPredicates('isAlpha, isOmega', false, false),

      sOmega,
      testHasOmega('initial omega class'),
      testPredicates('isAlpha, isOmega', false, true),

      sAlpha,
      testHasAlpha('swap to alpha class'),
      testPredicates('isAlpha, isOmega', true, false),

      sOmega,
      testHasOmega('swap back to omega class'),
      testPredicates('isAlpha, isOmega', false, true),

      sClear,
      testHasNoClass('clear classes'),
      testPredicates('isAlpha, isOmega', false, false)
    ];
  }, success, failure);
});
