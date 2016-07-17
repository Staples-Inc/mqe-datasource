import _ from 'lodash';

export default class MQEQuery {

  /** @ngInject */
  constructor(target, templateSrv, scopedVars) {
    this.target = target;
    this.templateSrv = templateSrv;
    this.scopedVars = scopedVars;
  }

  /////////////////////
  // Query Rendering //
  /////////////////////

  render(timeFrom, timeTo, interval) {
    // pass
  }

  ////////////////////
  // Static methods //
  ////////////////////

  static getMetrics() {
    var query = "describe all";
    return query;
  }

  static addTimeRange(query, timeFrom, timeTo, interval) {
    var timeRangeRegex = /from.*to/;
    if(!timeRangeRegex.test(query)) {
      query = trim(query) + " from " + timeFrom + " to " + timeTo;
    }
    return query;
  }
}

function trim(str) {
  var trimRegex = /^[\s]*(.*?)[\s]*$/;
  var match = str.match(trimRegex);
  return match ? match[0] : match;
}
