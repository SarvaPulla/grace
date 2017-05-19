/*****************************************************************************
 * FILE:    GRACE ADD REGION
 * DATE:    17 MAY 2017
 * AUTHOR: Sarva Pulla
 * COPYRIGHT: (c) Brigham Young University 2017
 * LICENSE: BSD 2-Clause
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/

var GRACE_ADD_REGION = (function() {
	// Wrap the library in a package function
	"use strict"; // And enable strict mode for this library

	/************************************************************************
 	*                      MODULE LEVEL / GLOBAL VARIABLES
 	*************************************************************************/
 	var $region_input,
        $shp_input,
        $geoserver_select,
        public_interface;				// Object returned by the module



	/************************************************************************
 	*                    PRIVATE FUNCTION DECLARATIONS
 	*************************************************************************/

    var add_region,init_jquery,reset_alert,reset_form;

 	/************************************************************************
 	*                    PRIVATE FUNCTION IMPLEMENTATIONS
 	*************************************************************************/

    init_jquery = function(){
        $shp_input = $("#shp-upload-input");
        $geoserver_select = $("#geoserver-select option:selected");
        $region_input = $("#region-name-input");
    };

    //Reset the alerts if everything is going well
    reset_alert = function(){
        $("#message").addClass('hidden');
        $("#message").empty()
            .addClass('hidden')
            .removeClass('alert-success')
            .removeClass('alert-info')
            .removeClass('alert-warning')
            .removeClass('alert-danger');
    };

    //Reset the form when the request is made succesfully
    reset_form = function(result){
        if("success" in result){
            $("#region-name-input").val('');
            $("#shp-upload-input").val('');
            addSuccessMessage('Region Upload Complete!');
        }
    };

    add_region = function(){
        reset_alert(); //Reset the alerts
        var region_name = $region_input.val();
        var geoserver = $geoserver_select.val();
        var shapefiles = $("#shp-upload-input")[0].files;

        if(region_name == ""){
                addErrorMessage("Region Name cannot be empty!");
                return false;
            }else{
                reset_alert();
            }
        if($shp_input.val() == ""){
                addErrorMessage("Region Shape File cannot be empty!");
                return false;
            }else{
                reset_alert();
            }

        //Preparing data to be submitted via AJAX POST request
            var data = new FormData();
            data.append("region_name",region_name);
        data.append("geoserver",geoserver);
        for(var i=0;i < shapefiles.length;i++){
            data.append("shapefile",shapefiles[i]);
        }
        var xhr = ajax_update_database_with_file("submit",data); //Submitting the data through the ajax function, see main.js for the helper function.
            xhr.done(function(return_data){ //Reset the form once the data is added successfully
                if("success" in return_data){
                    reset_form(return_data);
                }
            });

    };
    $("#submit-add-region").click(add_region);

	/************************************************************************
 	*                        DEFINE PUBLIC INTERFACE
 	*************************************************************************/
	/*
	 * Library object that contains public facing functions of the package.
	 * This is the object that is returned by the library wrapper function.
	 * See below.
	 * NOTE: The functions in the public interface have access to the private
	 * functions of the library because of JavaScript function scope.
	 */
	public_interface = {

	};

	/************************************************************************
 	*                  INITIALIZATION / CONSTRUCTOR
 	*************************************************************************/

	// Initialization: jQuery function that gets called when
	// the DOM tree finishes loading
	$(function() {
	    init_jquery();

	});

	return public_interface;

}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.