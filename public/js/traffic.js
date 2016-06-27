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
styledMap = new google.maps.StyledMapType([
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "lightness": 17
      }
    ]
  }, {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "lightness": 20
      }
    ]
  }, {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "lightness": 17
      }
    ]
  }, {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "weight": 0.2
      }, {
        "lightness": 29
      }
    ]
  }, {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "lightness": 18
      }
    ]
  }, {
    "featureType": "road.local",
    "elementType": "geometry",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "lightness": 16
      }
    ]
  }, {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "lightness": 21
      }
    ]
  }, {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "visibility": "on"
      }, {
        "color": '#000000'
      }, {
        "lightness": 16
      }
    ]
  }, {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "lightness": 40
      }
    ]
  }, {
    "featureType": "all",
    "elementType": "labels.icon",
    "stylers": [{
      "visibility": "off"
    }]
  }, {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "lightness": 19
      }
    ]
  }, {
    "featureType": "administrative",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "lightness": 20
      }
    ]
  }, {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": '#000000'
      }, {
        "weight": 1.2
      }, {
        "lightness": 17
      }
    ]
  }
], {
  name: "Styled Map"
});
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
  map.mapTypes.set('map_style', styledMap);
  map.setMapTypeId('map_style');
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
  navls = [
    {
      "ttl": "Accident Crossfilter",
      "txt": "Accidents from the Xinzhu area in Taiwan are visualized in the period January to October 2013 – a total of 13,200 accidents and 25+ deaths. Orange represents accidents, and red are accidents where death occurred. </br></br>(Click here to start navigation.)",
      "act": function(){}
    }, {
      "ttl": "Death by Month – 2013",
      "txt": "Here are the statistics by months: Orange represents accidents, and red accidents involved a death. Notice that there were no deaths in April, although the accident count is relatively high. (Click here for Day of the Week)",
      "act": function(){
        return d3.selectAll(".fltWeek, .fltHour").transition().style({
          "opacity": 0.2
        });
      }
    }, {
      "ttl": "Day of the Week",
      "txt": "Accidents on days of the week are relatively even; however, in our dataset, there were no accidents death on Monday. (Click here for Hour of the Day)",
      "act": function(){
        d3.selectAll(".fltMonth, .fltHour").transition().style({
          "opacity": 0.2
        });
        return d3.selectAll(".fltWeek").transition().style({
          "opacity": 1
        });
      }
    }, {
      "ttl": "Hour of the Day",
      "txt": "Accidents decreased after 7 pm, and the lowest number occurred between 0 am to 7 am. When we look at accident deaths, however, 0 am to 7 am is very deadly. To prevent accident deaths, this time period is a good place to start.</br></br>This is interesting, but where exactly are these accidents? (Click here to find out)",
      "act": function(){
        d3.selectAll(".fltMonth, .fltWeek").transition().style({
          "opacity": 0.2
        });
        return d3.selectAll(".fltHour").transition().style({
          "opacity": 1
        });
      }
    }, {
      "ttl": "Analysis with a Click",
      "txt": "If you drag your mouse from 0 am to 7 am, all the accidents are highlighted on the map (1 sec response time). Notice that the week and month charts are updated according to your action. (Click here for Crossfilter)",
      "act": function(){
        d3.selectAll(".filter").transition().style({
          "opacity": 1
        });
        return hourDim.filter([0, 8]);
      }
    }, {
      "ttl": "Crossfilter",
      "txt": "You can also select multiple criteria, such as the accidents that happened from 0 am to 7 am on weekends. For these criteria, drag your mouse for the timeframe and then click on Saturday and Sunday. (Click here for Geo-Crossfilter)",
      "act": function(){
        return weekdayDim.filter(["Sat", "Sun"]);
      }
    }, {
      "ttl": "Geo-Crossfilter",
      "txt": "This also work the other way, we can zoom-in into any part of the map, and the charts will update accordingly. Now we are viewing the area around the train station. (Click here for another Geo-Crossfilter)",
      "act": function(){
        map.setZoom(13);
        return setTimeout(function(){
          map.setZoom(14);
          return setTimeout(function(){
            map.setZoom(15);
            return setTimeout(function(){
              return map.setZoom(16);
            }, 100);
          }, 100);
        }, 100);
      }
    }, {
      "ttl": "Geo-Crossfilter",
      "txt": "Now we’re around Chiao Tung University.</br></br>The benefit of programming-generated visualization is that once developed, we just feed in different data to generate an up-to-date graph.</br></br>Start exploring on your own! Zoom in and out use the sliding scale on the left. You can use the directional arrows to move around the map or just drag the map itself from one part of the city to another.",
      "act": function(){
        return map.panTo({
          lat: 24.799232620011438,
          lng: 120.98143010818478
        });
      }
    }
  ];
  navidx = 0;
  (nav = function(){
    var ctn, l;
    ctn = navls[navidx];
    l = navls.length - 1;
    if (navidx > l) {
      return d3.selectAll(".ctn-nav").transition().style({
        "opacity": 0
      });
    } else {
      d3.selectAll(".navttl").text(ctn.ttl);
      d3.selectAll(".navidx").text(navidx + "/" + l);
      d3.selectAll(".navtxt").html(ctn.txt);
      return ctn.act();
    }
  })();
  return d3.selectAll(".ctn-nav").on("mousedown", function(){
    ++navidx;
    return nav();
  });
});