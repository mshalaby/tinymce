import { FocusTools, GeneralSteps, Keyboard, Keys, Log, Step } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock-client';
import { Body, Element, Focus, SelectorFind } from '@ephox/sugar';

import * as Behaviour from 'ephox/alloy/api/behaviour/Behaviour';
import { Focusing } from 'ephox/alloy/api/behaviour/Focusing';
import { Keying } from 'ephox/alloy/api/behaviour/Keying';
import { AlloyComponent } from 'ephox/alloy/api/component/ComponentApi';
import * as GuiFactory from 'ephox/alloy/api/component/GuiFactory';
import { AlloySpec } from 'ephox/alloy/api/component/SpecTypes';
import { FocusInsideModes } from 'ephox/alloy/keying/KeyingModeTypes';
import * as GuiSetup from 'ephox/alloy/api/testhelpers/GuiSetup';

UnitTest.asynctest('Focus Modes Test', (success, failure) => {

  GuiSetup.setup((store, doc, body) => {
    const makeContainer = (name: string, mode: FocusInsideModes): AlloySpec => {
      return {
        dom: {
          tag: 'div',
          classes: [ name ]
        },
        components: [
          {
            dom: {
              tag: 'span',
              classes: [ `${name}-button` ],
              innerHtml: name
            },
            components: [ ],
            behaviours: Behaviour.derive([
              Focusing.config({ })
            ])
          }
        ],
        behaviours: Behaviour.derive([
          Keying.config({
            mode: 'flow',
            selector: 'span',
            focusInside: mode
          }),

          Focusing.config({ })
        ])
      };
    };

    return GuiFactory.build(
      {
        dom: {
          tag: 'div',
          classes: [ 'cyclic-keying-test' ],
          styles: {
            background: 'blue',
            width: '200px',
            height: '200px'
          }
        },
        components: [
          makeContainer('onApi', FocusInsideModes.OnApiMode),
          makeContainer('onKeyboard', FocusInsideModes.OnEnterOrSpaceMode),
          makeContainer('onFocus', FocusInsideModes.OnFocusMode)
        ]
      }
    );

  }, (doc, body, gui, component, store) => {
    const onApiComp = SelectorFind.descendant(component.element(), '.onApi').bind((elem) => {
      return component.getSystem().getByDom(elem).toOption();
    }).getOrDie('Could not find "onApi" div');

    const onEnterOrSpaceComp = SelectorFind.descendant(component.element(), '.onKeyboard').bind((elem) => {
      return component.getSystem().getByDom(elem).toOption();
    }).getOrDie('Could not find "onKeyboard" div');

    const onFocusComp = SelectorFind.descendant(component.element(), '.onFocus').bind((elem) => {
      return component.getSystem().getByDom(elem).toOption();
    }).getOrDie('Could not find "onFocus" div');

    const sResetFocus = Step.sync(() => {
      Focus.focus(Body.body());
    });

    const sFocusIn = (comp: AlloyComponent) => Step.sync(() => {
      Keying.focusIn(comp);
    });

    const sTriggerFocus = (target: Element) => Step.sync(() => {
      component.getSystem().triggerFocus(target, component.element());
    });

    return [
      Log.step('TBA', 'Check FocusMode.onApi response to System focus', GeneralSteps.sequence([
        sResetFocus,
        sTriggerFocus(onApiComp.element()),
        FocusTools.sTryOnSelector('Focus should move to onApi container', doc, '.onApi'),
        Keyboard.sKeydown(doc, Keys.enter(), { }),
        FocusTools.sTryOnSelector('Focus should not move because of *enter*', doc, '.onApi')
      ])),

      Log.step('TBA', 'Check FocusMode.onApi response to Keying.focusIn', GeneralSteps.sequence([
        sResetFocus,
        sFocusIn(onApiComp),
        FocusTools.sTryOnSelector('Focus should move within container', doc, '.onApi-button')
      ])),

      Log.step('TBA', 'Check FocusMode.onEnterOrSpace response to System focus', GeneralSteps.sequence([
        sTriggerFocus(onEnterOrSpaceComp.element()),
        FocusTools.sTryOnSelector('Focus should move to onKeyboard container', doc, '.onKeyboard'),
        Keyboard.sKeydown(doc, Keys.enter(), { }),
        FocusTools.sTryOnSelector('Focus should move inside', doc, '.onKeyboard-button')
      ])),

      Log.step('TBA', 'Check FocusMode.onEnterOrSpace response to Keying.focusIn', GeneralSteps.sequence([
        sResetFocus,
        sFocusIn(onEnterOrSpaceComp),
        FocusTools.sTryOnSelector('Focus should move within container', doc, '.onKeyboard-button')
      ])),

      Log.step('TBA', 'Check FocusMode.onFocus response to System focus', GeneralSteps.sequence([
        sTriggerFocus(onFocusComp.element()),
        FocusTools.sTryOnSelector('Focus should move immediately inside', doc, '.onFocus-button')
      ])),

      Log.step('TBA', 'Check FocusMode.onFocus response to Keying.focusIn', GeneralSteps.sequence([
        sResetFocus,
        sFocusIn(onFocusComp),
        FocusTools.sTryOnSelector('Focus should move within container', doc, '.onFocus-button')
      ]))
    ];
  }, () => {
    success();
  }, failure);
});
