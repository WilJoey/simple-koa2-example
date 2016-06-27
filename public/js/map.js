var colorDead, colorAcci, lngDim, latDim, projection, overlay, padding, mapOffset, weekDayTable, gPrints, monthDim, weekdayDim, hourDim, map, barAcciHour, styledMap, initMap, transform, ifdead, setCircle, initCircle, tranCircle, updateGraph;
colorDead = "#de2d26";
colorAcci = "rgb(255, 204, 0)";
lngDim = null;
latDim = null;
projection = null;
overlay = null;
padding = 5;
mapOffset = 4000;
weekDayTable = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
gPrints = null;
monthDim = null;
weekdayDim = null;
hourDim = null;
map = null;
barAcciHour = null;

initMap = function(){
  map = new google.maps.Map(d3.select("#map").node(), {
    zoom: 12,
    center: new google.maps.LatLng(24.80363496720421, 120.96827655517575),
    mapTypeControlOptions: {
      mapTypeId: [google.maps.MapTypeId.ROADMAP, 'map_style']
    }
  });
  google.maps.event.addListener(map, "bounds_changed", function(){
    var bounds, northEast, southWest;
    bounds = this.getBounds();
    northEast = bounds.getNorthEast();
    southWest = bounds.getSouthWest();
    console.log([(southWest.lng() + northEast.lng()) / 2, (southWest.lat() + northEast.lat()) / 2]);
    lngDim.filterRange([southWest.lng(), northEast.lng()]);
    latDim.filterRange([southWest.lat(), northEast.lat()]);
    return dc.redrawAll();
  });
  //map.mapTypes.set('map_style', styledMap);
  //map.setMapTypeId('map_style');
  return overlay.setMap(map);
};
transform = function(d){
  d = new google.maps.LatLng(d.GoogleLat, d.GoogleLng);
  d = projection.fromLatLngToDivPixel(d);
  return d3.select(this).style("left", (d.x - padding) + "px").style("top", (d.y - padding) + "px");
};
ifdead = function(it, iftrue, iffalse){
  if (it.dead > 0) {
    return iftrue;
  } else {
    return iffalse;
  }
};
setCircle = function(it){
  return it.attr({
    "cx": function(it){
      return it.coorx;
    },
    "cy": function(it){
      return it.coory;
    },
    "r": function(it){
      return ifdead(it, "5px", "2.5px");
    }
  }).style({
    "fill": function(it){
      return ifdead(it, colorDead, colorAcci);
    },
    "position": "absolute",
    "opacity": function(it){
      return ifdead(it, 1, 0.3);
    }
  });
};
initCircle = function(it){
  return it.style({
    "opacity": 0
  });
};
tranCircle = function(it){
  return it.style({
    "opacity": function(it){
      return ifdead(it, 1, 0.3);
    }
  });
};
updateGraph = function(){
  var dt;
  dt = gPrints.selectAll("circle").data(monthDim.top(Infinity));
  dt.enter().append("circle").call(setCircle);
  dt.call(setCircle);
  return dt.exit().remove();
};
d3.tsv("./static/accidentXY_light.tsv", function(err, tsvBody){
  var deadData, barPerMonth, barPerWeekDay, barPerHour, barAcciMonth, barAcciWeekDay, ndx, all, acciMonth, acciWeekDay, acciHour, deathMonth, deathWeekDay, deathHour, barMt, barWk, barHr, marginMt, marginWk, marginHr, navls, navidx, nav;
  deadData = [];
  tsvBody.filter(function(d){
    d.GoogleLng = +d.GoogleLng;
    d.GoogleLat = +d.GoogleLat;
    d.date = new Date(d["年"], d["月"], d["日"], d["時"], d["分"]);
    d.week = weekDayTable[d.date.getDay()];
    d.dead = (+d["2-30"]) + (+d["死"]);
    if (d.dead > 0) {
      deadData.push(d);
    }
    return true;
  });
  overlay = new google.maps.OverlayView();
  overlay.onAdd = function(){
    var layer, svg;
    layer = d3.select(this.getPanes().overlayLayer).append("div").attr("class", "stationOverlay");
    svg = layer.append("svg");
    gPrints = svg.append("g").attr({
      "class": "class",
      "gPrints": "gPrints"
    });
    svg.attr({
      "width": mapOffset * 2,
      "height": mapOffset * 2
    }).style({
      "position": "absolute",
      "top": -1 * mapOffset + "px",
      "left": -1 * mapOffset + "px"
    });
    return overlay.draw = function(){
      var googleMapProjection, dt;
      projection = this.getProjection();
      googleMapProjection = function(coordinates){
        var googleCoordinates, pixelCoordinates;
        googleCoordinates = new google.maps.LatLng(coordinates[0], coordinates[1]);
        pixelCoordinates = projection.fromLatLngToDivPixel(googleCoordinates);
        return [pixelCoordinates.x + mapOffset, pixelCoordinates.y + mapOffset];
      };
      tsvBody.filter(function(it){
        var coor;
        coor = googleMapProjection([it.GoogleLat, it.GoogleLng]);
        it.coorx = coor[0];
        it.coory = coor[1];
        return true;
      });
      dt = gPrints.selectAll("circle").data(tsvBody);
      dt.enter().append("circle").call(setCircle);
      dt.call(setCircle);
      return dt.exit().remove();
    };
  };
  barPerMonth = dc.barChart("#DeathMonth");
  barPerWeekDay = dc.barChart("#DeathWeekDay");
  barPerHour = dc.barChart("#DeathHour");
  barAcciMonth = dc.barChart("#AcciMonth");
  barAcciWeekDay = dc.barChart("#AcciWeekDay");
  barAcciHour = dc.barChart("#AcciHour");
  ndx = crossfilter(tsvBody);
  all = ndx.groupAll();
  monthDim = ndx.dimension(function(it){
    return it["月"];
  });
  weekdayDim = ndx.dimension(function(it){
    return it.week;
  });
  hourDim = ndx.dimension(function(it){
    return it["時"];
  });
  lngDim = ndx.dimension(function(it){
    return it.GoogleLng;
  });
  latDim = ndx.dimension(function(it){
    return it.GoogleLat;
  });
  acciMonth = monthDim.group().reduceCount();
  acciWeekDay = weekdayDim.group().reduceCount();
  acciHour = hourDim.group().reduceCount();
  deathMonth = monthDim.group().reduceSum(function(it){
    return it.dead;
  });
  deathWeekDay = weekdayDim.group().reduceSum(function(it){
    return it.dead;
  });
  deathHour = hourDim.group().reduceSum(function(it){
    return it.dead;
  });
  barMt = 350;
  barWk = 270;
  barHr = 550;
  marginMt = {
    "top": 10,
    "right": 10,
    "left": 30,
    "bottom": 20
  };
  marginWk = marginMt;
  marginHr = marginMt;
  barPerMonth.width(barMt).height(100).margins(marginMt).dimension(monthDim).group(deathMonth).x(d3.scale.ordinal().domain(d3.range(1, 13))).xUnits(dc.units.ordinal).elasticY(true).colors(colorDead).on("filtered", function(c, f){
    return updateGraph();
  }).yAxis().ticks(3);
  barPerWeekDay.width(barWk).height(100).margins(marginWk).dimension(weekdayDim).group(deathWeekDay).x(d3.scale.ordinal().domain(weekDayTable)).xUnits(dc.units.ordinal).gap(4).elasticY(true).colors(colorDead).on("filtered", function(c, f){
    return updateGraph();
  }).yAxis().ticks(3);
  barPerHour.width(barHr).height(100).margins(marginHr).dimension(hourDim).group(deathHour).x(d3.scale.linear().domain([0, 24])).elasticY(true).colors(colorDead).on("filtered", function(c, f){
    return updateGraph();
  }).yAxis().ticks(3);
  barAcciMonth.width(barMt).height(100).margins(marginMt).dimension(monthDim).group(acciMonth).x(d3.scale.ordinal().domain(d3.range(1, 13))).xUnits(dc.units.ordinal).elasticY(true).colors(colorAcci).on("filtered", function(c, f){
    return updateGraph();
  }).yAxis().ticks(4);
  barAcciWeekDay.width(barWk).height(100).margins(marginWk).dimension(weekdayDim).group(acciWeekDay).x(d3.scale.ordinal().domain(weekDayTable)).xUnits(dc.units.ordinal).elasticY(true).gap(4).colors(colorAcci).on("filtered", function(c, f){
    return updateGraph();
  }).yAxis().ticks(4);
  barAcciHour.width(barHr).height(100).margins(marginHr).dimension(hourDim).group(acciHour).x(d3.scale.linear().domain([0, 24])).elasticY(true).colors(colorAcci).on("filtered", function(c, f){
    return updateGraph();
  }).yAxis().ticks(4);
  dc.renderAll();
  initMap();
  

});