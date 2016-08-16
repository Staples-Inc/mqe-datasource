import {MQEDatasource} from './datasource';
import {MQEQueryCtrl} from './query_ctrl';

class MQEConfigCtrl {}
MQEConfigCtrl.templateUrl = 'partials/config.html';

class MQEQueryOptionsCtrl {}
MQEQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

export {
  MQEDatasource as Datasource,
  MQEConfigCtrl as ConfigCtrl,
  MQEQueryCtrl as QueryCtrl,
  MQEQueryOptionsCtrl as QueryOptionsCtrl
};
