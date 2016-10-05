import MQEQuery from '../query_builder';

describe('MQEQuery', function() {
  var ctx = {};
  var metricList = [
    'os.cpu.all.user',
    'os.cpu.all.system',
    'os.cpu.all.active',
    'os.disk.sda.io_time',
    'os.disk.sdb.io_time',
    'os.disk.sdc.io_time'
  ];
  var target_template = {
    metrics: [
      {metric: 'os.cpu.all.user'}
    ],
      functionList: [{ func: '' }],
    alias: '',
    apps: [],
    hosts: []
  };

  describe('When render query', function() {
    beforeEach(function() {
      ctx.templateSrv = {
        // Mock templateSrv.replace()
        replace: function(value) {
          return value;
        }
      };
      ctx.scopedVars = {};

      ctx.timeFrom = '1464130140000';
      ctx.timeTo = '1464130150000';
      ctx.interval = '10s';

      ctx.target = target_template;
      ctx.query = new MQEQuery(ctx.target, ctx.templateSrv, ctx.scopedVars);
    });

    it('should render proper MQE query', function(done) {
      var expected_query = [
        "(`os.cpu.all.user`) {os.cpu.all.user} from 1464130140000 to 1464130150000"
      ];
      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);
      expect(result).to.deep.equal(expected_query);
      done();
    });

    it('should render proper query when wildcard used', function(done) {
      var target = {
        metrics: [
          {metric: "os.cpu.all.*"}
        ],
          functionList: [{ func: '' }],
        apps: [],
        hosts: []
      };

      var expected_query = [
        "(`os.cpu.all.user`) {os.cpu.all.user} from 1464130140000 to 1464130150000",
        "(`os.cpu.all.system`) {os.cpu.all.system} from 1464130140000 to 1464130150000",
        "(`os.cpu.all.active`) {os.cpu.all.active} from 1464130140000 to 1464130150000"
      ];

      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);
      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);

      expect(result).to.deep.equal(expected_query);
      done();
    });

    it('should render proper query when multiple metrics used', function(done) {
      var target = {
        metrics: [
          {metric: "os.cpu.all.user"},
          {metric: "os.cpu.all.system"}
        ],
          functionList: [{ func: '' }],
        apps: [],
        hosts: []
      };

      var expected_query = [
        "(`os.cpu.all.user`) {os.cpu.all.user} from 1464130140000 to 1464130150000",
        "(`os.cpu.all.system`) {os.cpu.all.system} from 1464130140000 to 1464130150000"
      ];

      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);
      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);

      expect(result).to.deep.equal(expected_query);
      done();
    });

    it('should add proper where clause when tags added', function(done) {
      var target = {
        metrics: [
          {metric: "os.cpu.all.user"}
        ],
          functionList: [{ func: '' }],
        apps: [],
        hosts: []
      };

      target.hosts = ["host01", "host02"];
      var expected_query = [
        "(`os.cpu.all.user`) {os.cpu.all.user} where host in ('host01', 'host02') from 1464130140000 to 1464130150000"
      ];

      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);
      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);
      expect(result).to.deep.equal(expected_query);

      target.hosts = ["host01"];
      expected_query = [
        "(`os.cpu.all.user`) {os.cpu.all.user} where host in ('host01') from 1464130140000 to 1464130150000"
      ];

      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);
      result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);
      expect(result).to.deep.equal(expected_query);

      target.hosts = ["host01"];
      target.apps = ["app1", "app2"];
      expected_query = [
        "(`os.cpu.all.user`) {os.cpu.all.user} where cluster in ('app1', 'app2') and host in ('host01') from 1464130140000 to 1464130150000"
      ];

      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);
      result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);
      expect(result).to.deep.equal(expected_query);

      done();
    });

    it('should add alias if it set', function(done) {
      var target = {
        metrics: [
          {
            metric: "os.cpu.all.user",
            alias: "user"
          }
        ],
          functionList: [{ func: '' }],
        apps: [],
        hosts: []
      };

      var expected_query = [
        "(`os.cpu.all.user`) {user} from 1464130140000 to 1464130150000"
      ];

      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);
      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);

      expect(result).to.deep.equal(expected_query);
      done();
    });

    it('should add multiple aliases if wildcard used', function(done) {
      var target = {
        metrics: [
          {
            metric: "os.cpu.all.*",
            alias: "*"
          }
        ],
          functionList: [{ func: '' }],
        apps: [],
        hosts: []
      };

      var expected_query = [
        "(`os.cpu.all.user`) {user} from 1464130140000 to 1464130150000",
        "(`os.cpu.all.system`) {system} from 1464130140000 to 1464130150000",
        "(`os.cpu.all.active`) {active} from 1464130140000 to 1464130150000"
      ];

      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);
      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);

      expect(result).to.deep.equal(expected_query);
      done();
    });

    it('should render proper query when no functions added', function(done) {
      var target = {
        metrics: [
          {metric: "os.cpu.all.user"}
        ],
        apps: [],
        hosts: []
      };

      var expected_query = [
        "(`os.cpu.all.user`) {os.cpu.all.user} from 1464130140000 to 1464130150000"
      ];

      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);
      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);

      expect(result).to.deep.equal(expected_query);
      done();
    });

    it('should render proper query when operators are added', function(done) {
      var target = {
        metrics: [
          {metric: "os.cpu.all.user", joins:[{joinOP:"+", joinMetric:"os.cpu.all.system"}]}
        ],
        apps: [],
        hosts: []
      };

      var expected_query = [
        "(`os.cpu.all.user` + `os.cpu.all.system`) {os.cpu.all.user} from 1464130140000 to 1464130150000"
      ];

      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);
      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);

      expect(result).to.deep.equal(expected_query);
      done();
    });

  });
});