let map;
let grayscale;
let baseMaps;
let polyGeojson;
let overlayers;
let sideBar;
let panelContent;

var ctlEasyButton;
var ctlSidebar

var theCnty = [];
var current_id;
var properties;





//Preparation des basemaps
grayscale = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19}),
    streets   = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
    });
    mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
      maxZoom: 18,
      id: 'mapbox/streets-v11',
      tileSize: 512,
      zoomOffset: -1,
      accessToken: 'pk.eyJ1IjoibWVkLWhhZGVyIiwiYSI6ImNrbDloMTRrbTBucWwyeG4wNnZtNnB3dmgifQ.PHWB416VZhzSxJe9h64f2Q'
  });

// Preparation de la carte
map = L.map('mapid', {
    center: [33.952171019848045,-6.88068151473999],
    zoom: 17,
    layers: [grayscale],
    zoomControl: false
});
new L.Control.Zoom({ position: 'bottomleft' }).addTo(map);
// Preparation des donnees
polyGeojson = L.geoJSON.ajax('./PA_SAIDIA_F.geojson',{
  style: returnFeature,
  onEachFeature:processFeature,
}).addTo(map)
.on({click: function(e) {
  ctlSidebar.on('hidden', function() {
    ctlSidebar.toggle();})
    
}});
  






// l'ajout des element de la carte
baseMaps = {
  "Grayscale": grayscale,
  "Streets":streets,
  "MapBox": mapbox
};

overlayers = {
    "<span style='color: red'>GeoJSON Polys</span>": polyGeojson
};
L.control.layers(baseMaps,overlayers).addTo(map);
// GenerateTable();




//fonction qui affiche les parcelles selon le type
function returnFeature(geoJsonFeature){
    let att = geoJsonFeature.properties;
    switch (att.type){
      case 'villa' :
        return{fillColor: 'deeppink', color: 'red', zIndex: 100}
        break;
      case 'immeuble' :
        return{fillColor: 'bleu', color: 'black', zIndex: 100}
        break;
    }
}

// Fonction de gestion du popup des parcelles
function processFeature(geoJsonFeature, lyr){
    var att = geoJsonFeature.properties;
    properties = geoJsonFeature.properties;
    lyr.bindPopup("<h4>IF: "+att.iF+"</h4>Description: "+att.Description, {opacity : 1});
    theCnty.push({
      IF: att.iF,
      Description: att.Description,
      type : att.type,
      Med: att.const
  });
    lyr.on({click: function(e) {
      current_id = lyr.feature.properties.iF;
      GenerateSelectedTable(lyr.feature.properties,lyr);
    }});
}


function zoomtolayer(layer){
  map.fitBounds(this.layer.getBounds());  
  layer.openPopup(); 
}



table = [
  {
  field: "action",
  title: "<i class='fa fa-gear'></i>&nbsp;Action",
  align: "center",
  valign: "middle",
  width: "75px",
  cardVisible: false,
  switchable: false,
  formatter: function(value, row, index) {
    return [
      '<a class="zoom" href="javascript:void(0)" title="Zoom" style="margin-right: 10px;">zoom',
        '<i class="fa fa-search-plus"></i>',
      '</a>'
    ].join("");
  },
  events: {
    "click .zoom": function (e, value, row, index) {
      map.fitBounds(polyGeojson.getLayer(row.leaflet_stamp).getBounds());
      polyGeojson.getLayer(row.leaflet_stamp).openPopup();
    }
  }
},
{
  field: 'iF',
  title: 'IF',
  table: {
    visible: false,
    sortable: true
  }
}, {
  field: 'type',
  title: 'Type',
  table: {
    visible: false,
    sortable: true
  }
}, {
  field: 'const',
  title: 'Const',
  table: {
    visible: false,
    sortable: true
  }
},{
  field: 'Description',
  title: 'Description',
  table: {
    visible: true,
    sortable: true,
    formatter: urlFormatter
  },
  filter: false
}];


function buildTable() {
  $("#table").bootstrapTable({
    cache: false,
    height: $("#table-container").height(),
    undefinedText: "",
    striped: false,
    pagination: false,
    minimumCountColumns: 1,
    // sortName: config.sortProperty,
    sortOrder: "desc",
    toolbar: "#toolbar",
    search: true,
    trimOnSearch: false,
    showColumns: true,
    showToggle: true,
    columns: table,
    onClickRow: function (row) {
      // do something!
    },
    onDblClickRow: function (row) {
      // do something!
      map.fitBounds(polyGeojson.getLayer(row.leaflet_stamp).getBounds());
      polyGeojson.getLayer(row.leaflet_stamp).openPopup();
    }
  });

  map.fitBounds(polyGeojson.getBounds());

  $(window).resize(function () {
    $("#table").bootstrapTable("resetView", {
      height: $("#table-container").height()
    });
  });
  // $("#table").bootstrapTable("load", properties);
}

function syncTable() {
  tableFeatures = [];
  polyGeojson.eachLayer(function (layer) {
    layer.feature.properties.leaflet_stamp = L.stamp(layer);
    if (map.hasLayer(polyGeojson)) {
      if (map.getBounds().contains(layer.getBounds())) {
        tableFeatures.push(layer.feature.properties);
      }
    }
  });
  $("#table").bootstrapTable("load", JSON.parse(JSON.stringify(tableFeatures)));
  var featureCount = $("#table").bootstrapTable("getData").length;
  if (featureCount == 1) {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible feature");
  } else {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible features");
  }
}
map.on("moveend", function (e) {
  syncTable();
});
// Table formatter to make links clickable
function urlFormatter (value, row, index) {
  if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
    return "<a href='"+value+"' target='_blank'>"+value+"</a>";
  } else return 1;
}



function switchView(view) {
  if (view == "split") {
    $("#view").html("Split View");
    location.hash = "#split";
    $("#table-container").show();
    $("#table-container").css("height", "40%");
    $("#map-container").show();
    $("#map-container").css("height", "60%");
    $(window).resize();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "map") {
    $("#view").html("Map View");
    location.hash = "#map";
    $("#map-container").show();
    $("#map-container").css("height", "100%");
    $("#table-container").hide();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "table") {
    $("#view").html("Table View");
    location.hash = "#table";
    $("#table-container").show();
    $("#table-container").css("height", "100%");
    $("#map-container").hide();
    $(window).resize();
  }
}

$("[name='view']").click(function() {
  $(".in,.open").removeClass("in open");
  if (this.id === "map-graph") {
    switchView("split");
    return false;
  } else if (this.id === "map-only") {
    switchView("map");
    return false;
  } else if (this.id === "graph-only") {
    switchView("table");
    return false;
  }
});
$("#extent-btn").click(function() {
  map.fitBounds(polyGeojson.getBounds());
  $(".navbar-collapse.in")
  return false;
});



















// $(document).ready( function (geoJsonFeature) {
//   var table = $('#table_id').DataTable({
//     "ajax":{
//       "url":"../PA_SAIDIA_F.geojson",
//       "dataSrc": "features"
//     },
//     "columns": [
//         { data: "properties", title: 'IF',render: function (data) {
//           return "<a href = '' onClick='zoomtolayer("+data+")'>"+data.iF+"</a>";
//       }},
//         { data: "properties.Description", title: 'Description          ' },
//         { data: "properties.type", title: 'Type' },
//         { data: "properties.const", title: 'Const' }
//     ]
     
//   });
//   $('#table_id tbody').on('click', 'tr', function () {
    
    
// } );
  
// } );

// $(document).ready( function (geoJsonFeature) {
//   $('#selectTable').DataTable({
//     select: true
//   });
// } );

// sideBar = L.control.sidebar('side-bar',{position: 'left'}).addTo(map);

// ctlSidebar = L.control.sidebar('side-bar').addTo(map);
// ctlEasyButton = L.easyButton('fa-exchange', function () {
//   ctlSidebar.toggle();
// }).addTo(map);

// map.on('keypress',function (e) {
//   if(e.originalEvent.key = 'l'){
//       map.locate();
//   }

// });
// $('#get_location_id').click(function () {
//   map.locate();
// });


//     //  get map zoom level
//     map.on('moveend', function (e) {
//       $('#map_center_id').html(latLngToString(map.getCenter()));
//   });

//   // get mouse location
//   map.on('mousemove',function (e) {

//       $('#mouse_location_id').html(latLngToString(e.latlng));

//   });

//   //custom functions
//   function latLngToString(ll) {
//       return "["+ll.lat.toFixed(5)+","+ll.lng.toFixed(5)+"]";
//   }
// Fonction d'affichage de la table attributaire onclick

// function GenerateTable() {

//   //Create a HTML Table element.
//  var table = document.createElement("TABLE");
//  table.border = "1";


//  //Add the header row.
//  var row = table.insertRow(-1);
//      var headerCell = document.createElement("TH");
//      headerCell.innerHTML = "IF";  //Fieldname
//      row.appendChild(headerCell);
//      var headerCell = document.createElement("TH");
//      headerCell.innerHTML = "Description";   //Fieldname
//      row.appendChild(headerCell);
//      var headerCell = document.createElement("TH");
//      headerCell.innerHTML = "type";   //Fieldname
//      row.appendChild(headerCell);
//      var headerCell = document.createElement("TH");
//      headerCell.innerHTML = "Med";   //Fieldname
//      row.appendChild(headerCell);

//  //Add the data rows. 
//  for (var i = 0; i < theCnty.length; i++) {
//      row = table.insertRow(-1);

//          var cell = row.insertCell(-1);
//          cell.innerHTML = theCnty[i].IF;
//          var cell = row.insertCell(-1);
//          cell.innerHTML = theCnty[i].Description;
//          var cell = row.insertCell(-1);
//          cell.innerHTML = theCnty[i].type;
//          var cell = row.insertCell(-1);
//          cell.innerHTML = theCnty[i].Med;
//  }
//  var dvTable = document.getElementById("table_id");
//  dvTable.innerHTML = "";
//  dvTable.appendChild(table);

// }

//  function GenerateSelectedTable(selectedfeat, layer) {

//   //Create a HTML Table element.
//  var table = document.createElement("TABLE");
//  table.border = "1";


//  //Add the header row.
//  var row = table.insertRow(-1);
//      var headerCell = document.createElement("TH");
     
//      headerCell.innerHTML = "IF";  //Fieldname
//      row.appendChild(headerCell);
//      var headerCell = document.createElement("TH");
//      headerCell.innerHTML = "Description";   //Fieldname
//      row.appendChild(headerCell);
//      var headerCell = document.createElement("TH");
//      headerCell.innerHTML = "type";   //Fieldname
//      row.appendChild(headerCell);
//      var headerCell = document.createElement("TH");
//      headerCell.innerHTML = "Med";   //Fieldname
//      row.appendChild(headerCell);

//  //Add the data rows. 
  


//  var a = document.createElement("a");
//      row = table.insertRow(-1);

//          var head = row.insertCell(-1);
//          head.appendChild(a);
//          //
// content = selectedfeat;

// // Create the "button".
// a.innerHTML = content.iF;
// a.href = "#";
// a.layer = layer; 
// a.addEventListener("click", function (event) {
//   event.preventDefault(); // Prevent the link from scrolling the page.
//   map.fitBounds(this.layer.getBounds());  
//   layer.openPopup(); 
// });
// //
         
//          var cell = row.insertCell(-1);
//          cell.innerHTML = selectedfeat.Description;
//          var cell = row.insertCell(-1);
//          cell.innerHTML = selectedfeat.type;
//          var cell = row.insertCell(-1);
//          cell.innerHTML = selectedfeat.const;
 

//  var dvTable = document.getElementById("selectTable");
//  dvTable.innerHTML = "";
//  dvTable.appendChild(table);
// }