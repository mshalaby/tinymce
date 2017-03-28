define(
  'ephox.alloy.demo.TypeaheadDemo',

  [
    'ephox.alloy.api.behaviour.Representing',
    'ephox.alloy.api.system.Attachment',
    'ephox.alloy.api.system.Gui',
    'ephox.alloy.api.ui.TieredMenu',
    'ephox.alloy.api.ui.Typeahead',
    'ephox.alloy.demo.DemoMenus',
    'ephox.alloy.demo.DemoSink',
    'ephox.alloy.demo.HtmlDisplay',
    'ephox.katamari.api.Arr',
    'ephox.katamari.api.Future',
    'ephox.katamari.api.Option',
    'ephox.katamari.api.Result',
    'ephox.sugar.api.dom.Insert',
    'ephox.sugar.api.node.Element',
    'ephox.sugar.api.properties.Class',
    'ephox.sugar.api.properties.Value'
  ],

  function (Representing, Attachment, Gui, TieredMenu, Typeahead, DemoMenus, DemoSink, HtmlDisplay, Arr, Future, Option, Result, Insert, Element, Class, Value) {
    return function () {
      var gui = Gui.create();
      var body = Element.fromDom(document.body);
      Class.add(gui.element(), 'gui-root-demo-container');
      Attachment.attachSystem(body, gui);

      var sink = DemoSink.make();

      gui.add(sink);

      var dataset = [
        'ant',
        'bison',
        'cat',
        'dog',
        'elephant',
        'frog',
        'goose',
        'hyena',
        'iguana',
        'jaguar',
        'koala',
        'lemur',
        'mongoose',
        'narwhal',
        'orca',
        'pig',
        'quoll',
        'robin',
        'snake',
        'tern',
        'uakari',
        'viper',
        'wombat',
        'x',
        'yak',
        'zebra'
      ];

      var lazySink = function () {
        return Result.value(sink);
      };

      HtmlDisplay.section(gui,
        'An example of a typeahead component',
        Typeahead.sketch({
          minChars: 1,
          lazySink: lazySink,
          dom: {
            tag: 'input'
          },

          parts: {
            menu: DemoMenus.list()
          },

          markers: {
            openClass: 'demo-typeahead-open'
          },

          fetch: function (input) {
            var text = Value.get(input.element());
            console.log('text', text);
            var matching = Arr.bind(dataset, function (d) {
              var index = d.indexOf(text.toLowerCase());
              if (index > -1) {
                var html = d.substring(0, index) + '<b>' + d.substring(index, index + text.length) + '</b>' + 
                  d.substring(index + text.length);
                return [ { type: 'item', data: { value: d, text: d, html: html }, 'item-class': 'class-' + d } ];
              } else {
                return [ ];
              }
            });

            var matches = matching.length > 0 ? matching : [
              { type: 'separator', text: 'No items' }
            ];
   
            var future = Future.pure(matches);
            return future.map(function (items) {
              return TieredMenu.simpleData('blah', 'Blah', items);
            });
          },
          onExecute: function (sandbox, item, itemValue) {
            var value = Representing.getValue(item);
            return Option.some(true);
            console.log('*** typeahead menu demo execute on: ' + value + ' ***');
          }
        })
      );
    };
  }
);