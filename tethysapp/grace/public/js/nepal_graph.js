/*****************************************************************************
 * FILE:    GRACE VIEWER MAIN.JS
 * DATE:    4 May 2017
 * AUTHOR: Sarva Pulla
 * COPYRIGHT: (c) Brigham Young University 2017
 * LICENSE: BSD 2-Clause
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/

var LIBRARY_OBJECT = (function() {
    // Wrap the library in a package function
    "use strict"; // And enable strict mode for this library

    /************************************************************************
     *                      MODULE LEVEL / GLOBAL VARIABLES
     *************************************************************************/
    var chart,
        current_layer,
        element,
        layers,
        layers_dict,
        gs_layer_json,
        gs_layer_list,
        $get_plot,
        $modalUpload,
        $btnUpload,
        map,
        popup,
        plotter,
        public_interface, // Object returned by the module
        range,
        range_min,
        range_max,
        shp_source,
        shp_layer,
        tracker,
        wms_source,
        wms_layer;




    /************************************************************************
     *                    PRIVATE FUNCTION DECLARATIONS
     *************************************************************************/
    var add_wms,clear_coords,get_plot,init_slider,init_events,init_map,init_vars,update_wms;


    /************************************************************************
     *                    PRIVATE FUNCTION IMPLEMENTATIONS
     *************************************************************************/
    init_vars = function(){
        var $layers_element = $('#layers');
        gs_layer_json = $layers_element.attr('data-layers');
        gs_layer_list = JSON.parse(gs_layer_json);
        range = $layers_element.attr('data-range');
        range = JSON.parse(range);
        tracker = $layers_element.attr('data-tracker');
        tracker = JSON.parse(tracker);
        range_min = range[0];
        range_max = range[1];
        chart = $(".highcharts-plot").highcharts();
        $get_plot = $('#get-plot');
        $modalUpload = $("#modalUpload");
        $btnUpload = $("#btn-add-shp");
        plotter = $('#plotter');
    };

    clear_coords = function(){
        $("#poly-lat-lon").val('');
        $("#point-lat-lon").val('');
        $("#shp-lat-lon").val('');
    };


    init_events = function() {
        (function () {
            var target, observer, config;
            // select the target node
            target = $('#app-content-wrapper')[0];

            observer = new MutationObserver(function () {
                window.setTimeout(function () {
                    map.updateSize();
                }, 350);
            });
            $(window).on('resize', function () {
                map.updateSize();
            });

            config = {attributes: true};

            observer.observe(target, config);
        }());

        map.on("singleclick",function(evt){

            $(element).popover('destroy');


            if (map.getTargetElement().style.cursor == "pointer" && $("#types").find('option:selected').val()=="None") {
                var clickCoord = evt.coordinate;
                popup.setPosition(clickCoord);
                var view = map.getView();
                var viewResolution = view.getResolution();

                var wms_url = current_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), {'INFO_FORMAT': 'application/json'}); //Get the wms url for the clicked point
                if (wms_url) {
                    //Retrieving the details for clicked point via the url
                    $.ajax({
                        type: "GET",
                        url: wms_url,
                        dataType: 'json',
                        success: function (result) {
                            var value = parseFloat(result["features"][0]["properties"]["GRAY_INDEX"]);
                            value = value.toFixed(2);
                            $(element).popover({
                                'placement': 'top',
                                'html': true,
                                //Dynamically Generating the popup content
                                'content':'Value: '+value
                            });

                            $(element).popover('show');
                            $(element).next().css('cursor', 'text');


                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            console.log(Error);
                        }
                    });
                }
            }
        });

        map.on('pointermove', function(evt) {
            if (evt.dragging) {
                return;
            }
            var pixel = map.getEventPixel(evt.originalEvent);
            var hit = map.forEachLayerAtPixel(pixel, function(layer) {
                if (layer != layers[0] && layer != layers[1] && layer != layers[2] && layer != layers[4]){
                    current_layer = layer;
                    return true;}
            });
            map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

    };

    init_map = function(){
        var projection = ol.proj.get('EPSG:3857');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
            })
        });
        var fullScreenControl = new ol.control.FullScreen();
        var view = new ol.View({
            center: [9495552.56, 3298233.44],
            projection: projection,
            zoom: 6
        });

        //Creating an empty source and empty layer for displaying the shpefile object
        shp_source = new ol.source.Vector();
        shp_layer = new ol.layer.Vector({
            source: shp_source
        });

        var vector_source = new ol.source.Vector({
            wrapX: false
        });

        var vector_layer = new ol.layer.Vector({
            name: 'my_vectorlayer',
            source: vector_source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });
        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });
        layers = [baseLayer,wms_layer,vector_layer,shp_layer];

        layers_dict = {};


        map = new ol.Map({
            target: document.getElementById("map"),
            layers: layers,
            view: view
        });
        map.addControl(new ol.control.ZoomSlider());
        map.addControl(fullScreenControl);
        map.crossOrigin = 'anonymous';
        element = document.getElementById('popup');

        popup = new ol.Overlay({
            element: element,
            positioning: 'bottom-center',
            stopEvent: true
        });
        map.addOverlay(popup);

        //Code for adding interaction for drawing on the map
        var lastFeature, draw, featureType;

        //Clear the last feature before adding a new feature to the map
        var removeLastFeature = function () {
            if (lastFeature) vector_source.removeFeature(lastFeature);
        };

        //Add interaction to the map based on the selected interaction type
        var addInteraction = function (geomtype) {
            var typeSelect = document.getElementById('types');
            var value = typeSelect.value;
            $('#data').val('');
            if (value !== 'None') {
                if (draw)
                    map.removeInteraction(draw);

                draw = new ol.interaction.Draw({
                    source: vector_source,
                    type: geomtype
                });


                map.addInteraction(draw);
            }
            if (featureType === 'Point' || featureType === 'Polygon') {

                draw.on('drawend', function (e) {
                    lastFeature = e.feature;

                });

                draw.on('drawstart', function (e) {
                    vector_source.clear();
                });

            }

        };

        vector_layer.getSource().on('addfeature', function(event){
            //Extracting the point/polygon values from the drawn feature
            var feature_json = saveData();
            var parsed_feature = JSON.parse(feature_json);
            var feature_type = parsed_feature["features"][0]["geometry"]["type"];
            if (feature_type == 'Point'){
                var coords = parsed_feature["features"][0]["geometry"]["coordinates"];
                var proj_coords = ol.proj.transform(coords, 'EPSG:3857','EPSG:4326');
                $("#point-lat-lon").val(proj_coords);

            } else if (feature_type == 'Polygon'){
                var coords = parsed_feature["features"][0]["geometry"]["coordinates"][0];
                proj_coords = [];
                coords.forEach(function (coord) {
                    var transformed = ol.proj.transform(coord,'EPSG:3857','EPSG:4326');
                    proj_coords.push('['+transformed+']');
                });
                var json_object = '{"type":"Polygon","coordinates":[['+proj_coords+']]}';
                $("#poly-lat-lon").val(json_object);
            }
        });

        function saveData() {
            // get the format the user has chosen
            var data_type = 'GeoJSON',
                // define a format the data shall be converted to
                format = new ol.format[data_type](),
                // this will be the data in the chosen format
                data;
            try {
                // convert the data of the vector_layer into the chosen format
                data = format.writeFeatures(vector_layer.getSource().getFeatures());
            } catch (e) {
                // at time of creation there is an error in the GPX format (18.7.2014)
                $('#data').val(e.name + ": " + e.message);
                return;
            }
            // $('#data').val(JSON.stringify(data, null, 4));
            return data;

        }
        $('#types').change(function (e) {
            featureType = $(this).find('option:selected').val();
            if(featureType == 'None'){
                $('#data').val('');
                clear_coords();
                map.removeInteraction(draw);
                vector_layer.getSource().clear();
                shp_layer.getSource().clear();
            }else if(featureType == 'Upload')
            {
                clear_coords();
                vector_layer.getSource().clear();
                shp_layer.getSource().clear();
                map.removeInteraction(draw);
                $modalUpload.modal('show');
            }else if(featureType == 'Point')
            {
                clear_coords();
                shp_layer.getSource().clear();
                addInteraction(featureType);
            }else if(featureType == 'Polygon'){
                clear_coords();
                shp_layer.getSource().clear();
                addInteraction(featureType);
            }
        }).change();
    };

    add_wms = function(){
        // gs_layer_list.forEach(function(item){
        map.removeLayer(wms_layer);
        var store_name = $("#select_layer").find('option:selected').val();
        // var layer_name = 'grace:'+item[0]+'_nepal';
        var layer_name = 'grace:'+store_name;
        var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>'+layer_name+'</Name><UserStyle><FeatureTypeStyle><Rule>\
        <RasterSymbolizer> \
        <ColorMap> \
        <ColorMapEntry color="#000000" quantity="'+range_min+'" label="nodata" opacity="0.0" /> \
        <ColorMapEntry color="#FF0000" quantity="0" label="label1" opacity="0.4"/>\
        <ColorMapEntry color="#0000FF" quantity="'+range_max+'" label="label2" opacity="0.4"/>\
        </ColorMap>\
        </RasterSymbolizer>\
        </Rule>\
        </FeatureTypeStyle>\
        </UserStyle>\
        </NamedLayer>\
        </StyledLayerDescriptor>';

        wms_source = new ol.source.ImageWMS({
            url: 'http://tethys.byu.edu:8181/geoserver/wms',
            params: {'LAYERS':layer_name,'SLD_BODY':sld_string},
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        });

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        map.addLayer(wms_layer);


    };

    update_wms = function(date_str){
        // map.removeLayer(wms_layer);
        var layer_name = 'grace:'+date_str;
        var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>'+layer_name+'</Name><UserStyle><FeatureTypeStyle><Rule>\
        <RasterSymbolizer> \
        <ColorMap> \
        <ColorMapEntry color="#000000" quantity="'+range_min+'" label="nodata" opacity="0.0" /> \
        <ColorMapEntry color="#FF0000" quantity="0" label="label1" opacity="0.4"/>\
        <ColorMapEntry color="#0000FF" quantity="'+range_max+'" label="label2" opacity="0.4"/>\
        </ColorMap>\
        </RasterSymbolizer>\
        </Rule>\
        </FeatureTypeStyle>\
        </UserStyle>\
        </NamedLayer>\
        </StyledLayerDescriptor>';

        wms_source.updateParams({'LAYERS':layer_name,'SLD_BODY':sld_string})

    };


    init_slider = function(){

        $( "#slider" ).slider({
            value:1,
            min: 0,
            max: gs_layer_list.length - 1,
            step: 1, //Assigning the slider step based on the depths that were retrieved in the controller
            animate:"fast",
            slide: function( event, ui ) {
                var date_text = $("#select_layer option")[ui.value].text;
                $( "#grace-date" ).val(date_text); //Get the value from the slider
                var date_value = $("#select_layer option")[ui.value].value;
                update_wms(date_value);
            }
        });

    };

    get_plot = function(){
        if($("#poly-lat-lon").val() == "" && $("#point-lat-lon").val() == "" && $("#shp-lat-lon").val() == ""){
            $('.warning').html('<b>No feature selected. Please create a feature using the map interaction dropdown. Plot cannot be generated without a feature.</b>');
            return false;
        }else{
            $('.warning').html('');
        }

        var datastring = $get_plot.serialize();

         $.ajax({
            type:"POST",
            url:'/apps/grace/plot/',
            dataType:'HTML',
            data:datastring,
            success:function(result) {
                var json_response = JSON.parse(result);
                $("#plotter").highcharts({
                     chart: {
                            type:'area',
                            zoomType: 'x'
                        },
                        title: {
                            text:"Values at " +json_response.location,
                            style: {
                                fontSize: '11px'
                            }
                        },
                        xAxis: {
                            type: 'datetime',
                            labels: {
                                format: '{value:%d %b %Y}',
                                rotation: 45,
                                align: 'left'
                            },
                            title: {
                                text: 'Date'
                            }
                        },
                        yAxis: {
                            title: {
                                text: "LWE Thickness (cm)"
                            }

                        },
                        exporting: {
                            enabled: true
                        },
                        series: [{
                            data:json_response.values,
                            name: "LWE Thickness"
                        }]
                    });

            }
        });
    };

    $("#btn-get-plot").on('click',get_plot);


    /************************************************************************
     *                        DEFINE PUBLIC INTERFACE
     *************************************************************************/

    public_interface = {

    };

    /************************************************************************
     *                  INITIALIZATION / CONSTRUCTOR
     *************************************************************************/

    // Initialization: jQuery function that gets called when
    // the DOM tree finishes loading
    $(function() {
        // Initialize Global Variables
        init_map();
        init_events();
        init_vars();
        init_slider();



        $("#select_layer").change(function(){
            add_wms();
            // var selected_option = $(this).find('option:selected').val();
            // var lyr_str = 'grace:'+selected_option;
            // map.addLayer(layers_dict[lyr_str]);
        }).change();

        // $("#slider").on("slidechange", function(event, ui) {
        //
        //               $( "#grace-date" ).val(result['map_forecast'][ui.value - 1][0]); //The text below the slider
        //               var decimal_value = range_value.toString().split(".").join("");
        //
        //           });

        var animationDelay = 1000;
        var sliderInterval = {};

        $(".btn-run").on("click", function() {
            //Set the slider value to the current value to start the animation at the correct point.

            var sliderVal = $("#slider").slider("value");
            sliderInterval = setInterval(function() {
                sliderVal += 1;
                $("#slider").slider("value", sliderVal);
                if (sliderVal===gs_layer_list.length - 1) sliderVal=0;
            }, animationDelay);
        });
        $(".btn-stop").on("click", function() {
            //Call clearInterval to stop the animation.
            clearInterval(sliderInterval);
        });

        $("#slider").on("slidechange", function(event, ui) {
            var x = tracker[ui.value];
            chart.series[1].setData([[x,-50],[x,50]]);
            var date_text = $("#select_layer option")[ui.value].text;
            $( "#grace-date" ).val(date_text); //Get the value from the slider
            var date_value = $("#select_layer option")[ui.value].value;
            update_wms(date_value);

        });
    });

    return public_interface;

}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.
