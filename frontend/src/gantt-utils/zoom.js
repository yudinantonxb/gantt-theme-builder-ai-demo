export default function initZoom(gantt) {
  function applyConfig(config, dates) {
    gantt.config.scales = config.scales;

    // restore the previous scroll position
    if (config.scroll_position) {
      setTimeout(function () {
        gantt.scrollTo(config.scroll_position.x, config.scroll_position.y);
      }, 4);
    }
  }

  function zoomToFit() {
    var project = gantt.getSubtaskDates(),
      areaWidth = gantt.$task.offsetWidth,
      scaleConfigs = zoomConfig.levels;

    for (var i = 0; i < scaleConfigs.length; i++) {
      var columnCount = getUnitsBetween(
        project.start_date,
        project.end_date,
        scaleConfigs[i].scales[scaleConfigs[i].scales.length - 1].unit,
        scaleConfigs[i].scales[0].step
      );
      if ((columnCount + 2) * gantt.config.min_column_width <= areaWidth) {
        break;
      }
    }

    if (i == scaleConfigs.length) {
      i--;
    }

    gantt.ext.zoom.setLevel(scaleConfigs[i].name);
    applyConfig(scaleConfigs[i], project);
  }

  gantt.ext.zoomToFit = zoomToFit;

  // get number of columns in timeline
  function getUnitsBetween(from, to, unit, step) {
    var start = new Date(from),
      end = new Date(to);
    var units = 0;
    while (start.valueOf() < end.valueOf()) {
      units++;
      start = gantt.date.add(start, step, unit);
    }
    return units;
  }

  var zoomConfig = {
    levels: [
      // hours
      {
        name: 'hour',
        scale_height: 50,
        scales: [
          { unit: 'day', step: 1, format: '%d %M' },
          { unit: 'hour', step: 1, format: '%H:%i' },
        ],
      },
      // days
      {
        name: 'day',
        scale_height: 50,
        scales: [
          { unit: 'month', step: 1, format: '%F, %Y' },
          { unit: 'day', step: 1, format: '%d %M' },
        ],
      },
      // weeks
      {
        name: 'week',
        scale_height: 80,
        scales: [
          { unit: 'month', step: 1, format: '%F, %Y' },
          {
            unit: 'week',
            step: 1,
            format: function (date) {
              var dateToStr = gantt.date.date_to_str('%d %M');
              var endDate = gantt.date.add(date, 7 - date.getDay(), 'day');
              var weekNum = gantt.date.date_to_str('%W')(date);
              return '#' + weekNum + ', ' + dateToStr(date) + ' - ' + dateToStr(endDate);
            },
          },
          { unit: 'day', step: 1, format: '%j %D' },
        ],
      },
      // months
      {
        name: 'month',
        scale_height: 80,
        scales: [
          { unit: 'month', step: 1, format: '%F, %Y' },
          {
            unit: 'week',
            step: 1,
            format: function (date) {
              var dateToStr = gantt.date.date_to_str('%d %M');
              var endDate = gantt.date.add(date, 7 - date.getDay(), 'day');
              return dateToStr(date) + ' - ' + dateToStr(endDate);
            },
          },
        ],
      },
      // quarters
      {
        name: 'quarter',
        height: 80,
        scales: [
          {
            unit: 'quarter',
            step: 3,
            format: function (date) {
              var dateToStr = gantt.date.date_to_str('%M %y');
              var endDate = gantt.date.add(date, 2 - (date.getMonth() % 3), 'month');
              return dateToStr(date) + ' - ' + dateToStr(endDate);
            },
          },
          { unit: 'month', step: 1, format: '%M' },
        ],
      },
      // years
      {
        name: 'year',
        scale_height: 80,
        scales: [
          {
            unit: 'year',
            step: 5,
            format: function (date) {
              var dateToStr = gantt.date.date_to_str('%Y');
              var endDate = gantt.date.add(gantt.date.add(date, 5, 'year'), -1, 'day');
              return dateToStr(date) + ' - ' + dateToStr(endDate);
            },
          },
        ],
      },
    ],
  };

  gantt.config.fit_tasks = true;

  gantt.ext.zoom.init(zoomConfig);

  gantt.ext.zoom.setLevel('day');

  gantt.$zoomToFit = false;
}
