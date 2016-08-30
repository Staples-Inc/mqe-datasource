# mqe-datasource

Experimental prototype MQE (Metrics Query Engine) data source plugin for Grafana 3.x.
* NOT FOR PRODUCTION USE *

## Building from sources
You need nodejs and grunt-cli to build plugin from sources.
First time run `npm install` to load required dependencies. Then run `grunt` to build project.
```sh
git pull https://github.com/Staples-Inc/mqe-datasource.git
cd mqe-datasource
npm install
grunt
```

When you update a project, run grunt to rebuild.
```sh
git pull
grunt
```

## Usage

### Metric Selection
To begin, start to type a metric name (or part of name) and choose a metric from dropdown menu. You can add more than one metric into request by clicking plus sign at the right side of editor.

Another way to query multiple metrics is with _wildcards_. You can replace a part of metric name with a `*` wildcard sign. For example, if you want to select metrics like
```
os.cpu.all.system_percentage
os.cpu.all.user_percentage
os.cpu.all.iowait_percentage
...
```
just use wildcard: `os.cpu.all.*_percentage`.

Another example: instead
```
os.disk.sda.io_time
os.disk.sdb.io_time
os.disk.sdc.io_time
```
use `os.disk.*.io_time`.

### Tags
In Staples MQE implementation, each metric has two tags - `Host` and `App`. You can use these tags for filtering metrics belongs to selected hosts and apps. Click plus sign and select apps and hosts.

### Aliases
Use `Alias` field to set a custom metric name.

If you query metrics from multiple hosts or apps, it makes sense to add these names to metric alias. Use `Add to alias` section an choose what you want to add.

When you set custom alias for metric, it rewrites the metric name with this value. So if you query multiple metrics with wildcard all metric names will be rewritten with the same value. To prevent this useless behaviour use `*` as alias. In this case names will be replaced with extracted values:
```
os.cpu.all.*_percentage

os.cpu.all.system_percentage 	-> system
os.cpu.all.user_percentage 		-> user
os.cpu.all.iowait_percentage 	-> iowait
```
or
```
os.disk.*.io_time

os.disk.sda.io_time -> sda
os.disk.sdb.io_time -> sdb
os.disk.sdc.io_time -> sdc
```

### Templating
Staples MQE data source supports template variables. To add template variable, open _Templating_ and click _New_. Choose a name for variable and go to _Query_. MQE data source supports 3 types of queries:
  * Applications: `apps`
  * Hosts: `hosts`
  * Metrics: `metrics`

Use _Regex_ field to filter returned values.
