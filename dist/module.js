'use strict';

System.register(['./datasource', './query_ctrl'], function (_export, _context) {
  "use strict";

  var MQEDatasource, MQEQueryCtrl, MQEConfigCtrl, MQEQueryOptionsCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_datasource) {
      MQEDatasource = _datasource.MQEDatasource;
    }, function (_query_ctrl) {
      MQEQueryCtrl = _query_ctrl.MQEQueryCtrl;
    }],
    execute: function () {
      _export('ConfigCtrl', MQEConfigCtrl = function MQEConfigCtrl() {
        _classCallCheck(this, MQEConfigCtrl);
      });

      MQEConfigCtrl.templateUrl = 'partials/config.html';

      _export('QueryOptionsCtrl', MQEQueryOptionsCtrl = function MQEQueryOptionsCtrl() {
        _classCallCheck(this, MQEQueryOptionsCtrl);
      });

      MQEQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

      _export('Datasource', MQEDatasource);

      _export('ConfigCtrl', MQEConfigCtrl);

      _export('QueryCtrl', MQEQueryCtrl);

      _export('QueryOptionsCtrl', MQEQueryOptionsCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
